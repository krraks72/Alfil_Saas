<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Plan;
use App\Models\LandingPageSetting;
use App\Models\LandingPageCustomPage;
use App\Models\Contact;
use App\Models\NewsletterSubscription;

class LandingPageController extends Controller
{
    public function show(Request $request)
    {
        $host = $request->getHost();
        $hostParts = explode('.', $host);
        
        // Track general landing page visit
        // Visitor tracking removed
        
        // Check if landing page is enabled in settings
        if (!isLandingPageEnabled()) {
            return redirect()->route('login');
        }
        
        $landingSettings = LandingPageSetting::getSettings();
        
        $plans = Plan::where('is_plan_enable', 'on')->get()->map(function ($plan) {
            $features = [];
            if ($plan->enable_chatgpt === 'on') $features[] = 'AI Integration';
            
            return [
                'id' => $plan->id,
                'name' => $plan->name,
                'price' => $plan->price,
                'yearly_price' => $plan->yearly_price,
                'duration' => $plan->duration,
                'description' => $plan->description,
                'features' => $features,
                'stats' => [
                    'customers' => $plan->total_customers ?? 0,
                    'users' => $plan->max_users,
                    'storage' => $plan->storage_limit . ' GB',
                    'vendors' => $plan->total_vendors ?? 0
                ],
                'is_plan_enable' => $plan->is_plan_enable,
                'is_popular' => false // Will be set based on subscriber count
            ];
        });
        
        // Mark most subscribed plan as popular
        $planSubscriberCounts = Plan::withCount('users')->get()->pluck('users_count', 'id');
        if ($planSubscriberCounts->isNotEmpty()) {
            $mostSubscribedPlanId = $planSubscriberCounts->keys()->sortByDesc(function($planId) use ($planSubscriberCounts) {
                return $planSubscriberCounts[$planId];
            })->first();
            
            $plans = $plans->map(function($plan) use ($mostSubscribedPlanId) {
                if ($plan['id'] == $mostSubscribedPlanId && $plan['price'] != '0') {
                    $plan['is_popular'] = true;
                }
                return $plan;
            });
        }
        
        // Get testimonials and FAQs from settings configuration
        $sections = $landingSettings->config_sections['sections'] ?? [];
        
        $testimonialsSection = collect($sections)->firstWhere('key', 'testimonials');
        $testimonials = collect($testimonialsSection['testimonials'] ?? [])
            ->map(function($testimonial, $index) {
                return [
                    'id' => $index + 1,
                    'name' => $testimonial['name'] ?? '',
                    'role' => $testimonial['role'] ?? '',
                    'company' => $testimonial['company'] ?? '',
                    'content' => $testimonial['content'] ?? '',
                    'rating' => $testimonial['rating'] ?? 5,
                    'avatar' => $testimonial['avatar'] ?? null
                ];
            });
            
        $faqSection = collect($sections)->firstWhere('key', 'faq');
        $faqs = collect($faqSection['faqs'] ?? [])
            ->map(function($faq, $index) {
                return [
                    'id' => $index + 1,
                    'question' => $faq['question'] ?? '',
                    'answer' => $faq['answer'] ?? ''
                ];
            });
        
        return Inertia::render('landing-page/index', [
            'plans' => $plans,
            'testimonials' => $testimonials,
            'faqs' => $faqs,
            'customPages' => LandingPageCustomPage::active()->ordered()->get() ?? [],
            'settings' => $landingSettings,
            'sectionData' => [
                'testimonials' => [
                    'title' => $testimonialsSection['title'] ?? 'What Our Clients Say',
                    'subtitle' => $testimonialsSection['subtitle'] ?? "Don't just take our word for it.",
                    'trust_title' => $testimonialsSection['trust_title'] ?? 'Trusted by Professionals Worldwide',
                    'trust_stats' => $testimonialsSection['trust_stats'] ?? [],
                    'default_testimonials' => $testimonials->toArray()
                ],
                'faq' => [
                    'title' => $faqSection['title'] ?? 'Frequently Asked Questions',
                    'subtitle' => $faqSection['subtitle'] ?? "Got questions? We've got answers.",
                    'cta_text' => $faqSection['cta_text'] ?? 'Still have questions?',
                    'button_text' => $faqSection['button_text'] ?? 'Contact Support',
                    'default_faqs' => $faqs->toArray()
                ]
            ]
        ]);
    }

    public function submitContact(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string'
        ]);

        $contact = new Contact();
        $contact->name = $request->name;
        $contact->email = $request->email;
        $contact->subject = $request->subject;
        $contact->message = $request->message;
        $contact->save();

        return back()->with('success', __('Thank you for your message. We will get back to you soon!'));
    }

    public function subscribe(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:255'
        ]);

        NewsletterSubscription::updateOrCreate(
            ['email' => $request->email],
            ['subscribed_at' => now(), 'unsubscribed_at' => null]
        );

        return back()->with('success', __('Thank you for subscribing to our newsletter!'));
    }

    public function settings()
    {
        $landingSettings = LandingPageSetting::getSettings();
        
        return Inertia::render('landing-page/settings', [
            'settings' => $landingSettings
        ]);
    }

    public function updateSettings(Request $request)
    {
        $request->validate([
            'company_name' => 'required|string|max:255',
            'contact_email' => 'required|email|max:255',
            'contact_phone' => 'required|string|max:255',
            'contact_address' => 'required|string|max:255',
            'config_sections' => 'required|array'
        ]);
        $landingSettings = LandingPageSetting::getSettings();
        $landingSettings->update($request->all());

        return back()->with('success', __('Landing page settings updated successfully!'));
    }
}