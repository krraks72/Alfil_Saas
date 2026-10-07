<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlanController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        
        // Company users see only active plans
        if ($user->type !== 'superadmin') {
            return $this->companyPlansView($request);
        }
        
        // Admin view
        $billingCycle = $request->input('billing_cycle', 'monthly');
        
        $dbPlans = Plan::all();
        $hasDefaultPlan = $dbPlans->where('is_default', true)->count() > 0;
        
        $plans = $dbPlans->map(function ($plan) use ($billingCycle) {
            // Determine features based on plan attributes
            $features = [];
            if ($plan->enable_chatgpt === 'on') $features[] = 'AI Integration';
            
            // Get price and formatted price based on billing cycle
            $price = $plan->getPriceForCycle($billingCycle);
            $formattedPrice = $plan->getFormattedPriceForCycle($billingCycle);
            
            // Set duration based on billing cycle
            $duration = $billingCycle === 'yearly' ? 'Yearly' : 'Monthly';
            
            return [
                'id' => $plan->id,
                'name' => $plan->name,
                'price' => $price,
                'yearly_price' => $plan->yearly_price, // Include yearly price for frontend reference
                'formatted_price' => $formattedPrice,
                'duration' => $duration,
                'description' => $plan->description,
                'trial_days' => $plan->trial_day,
                'features' => $features,
                'stats' => [
                    'customers' => $plan->total_customers ?? 0,
                    'users' => $plan->max_users,
                    'storage' => $plan->storage_limit . ' GB',
                    'vendors' => $plan->total_vendors ?? 0
                ],
                'status' => $plan->is_plan_enable === 'on',
                'is_default' => $plan->is_default,
                'recommended' => false // Default to false
            ];
        })->toArray();
        
        // Mark the plan with most subscribers as recommended
        $planSubscriberCounts = Plan::withCount('users')->get()->pluck('users_count', 'id');
        $mostSubscribedPlanId = $planSubscriberCounts->keys()->first();
        if ($planSubscriberCounts->isNotEmpty()) {
            $mostSubscribedPlanId = $planSubscriberCounts->keys()->sortByDesc(function($planId) use ($planSubscriberCounts) {
                return $planSubscriberCounts[$planId];
            })->first();
        }
        
        foreach ($plans as &$plan) {
            if ($plan['id'] == $mostSubscribedPlanId && $plan['price'] != '0') {
                $plan['recommended'] = true;
                break;
            }
        }

        return Inertia::render('plans/index', [
            'plans' => $plans,
            'billingCycle' => $billingCycle,
            'hasDefaultPlan' => $hasDefaultPlan,
            'isAdmin' => true
        ]);
    }
    
    /**
     * Toggle plan status
     */
    public function toggleStatus(Plan $plan)
    {
        $plan->is_plan_enable = $plan->is_plan_enable === 'on' ? 'off' : 'on';
        $plan->save();
        
        return back();
    }
    
    /**
     * Show the form for creating a new plan
     */
    public function create()
    {
        $hasDefaultPlan = Plan::where('is_default', true)->exists();
        
        return Inertia::render('plans/create', [
            'hasDefaultPlan' => $hasDefaultPlan
        ]);
    }
    
    /**
     * Store a newly created plan
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:plans',
            'price' => 'required|numeric|min:0',
            'yearly_price' => 'nullable|numeric|min:0',
            'duration' => 'required|string',
            'description' => 'nullable|string',
            'total_customers' => 'required|integer|min:0',
            'total_vendors' => 'required|integer|min:0',
            'max_users' => 'required|integer|min:0',
            'storage_limit' => 'required|numeric|min:0',
            'enable_chatgpt' => 'nullable|in:on,off',
            'is_trial' => 'nullable|in:on,off',
            'trial_day' => 'nullable|integer|min:0',
            'is_plan_enable' => 'nullable|in:on,off',
            'is_default' => 'nullable|boolean',
         ]);
        
        // Set default values for nullable fields
        $validated['enable_chatgpt'] = $validated['enable_chatgpt'] ?? 'off';
        $validated['is_trial'] = $validated['is_trial'] ?? null;
        $validated['is_plan_enable'] = $validated['is_plan_enable'] ?? 'on';
        $validated['is_default'] = $validated['is_default'] ?? false;
        
        // If yearly_price is not provided, calculate it as 80% of monthly price * 12
        if (!isset($validated['yearly_price']) || $validated['yearly_price'] === null) {
            $validated['yearly_price'] = $validated['price'] * 12 * 0.8;
        }
        
        // If this plan is set as default, remove default status from other plans
        if ($validated['is_default']) {
            Plan::where('is_default', true)->update(['is_default' => false]);
        }
        
        // Create the plan
        Plan::create($validated);
        
        return redirect()->route('plans.index')->with('success', __('Plan created successfully.'));
    }
    
    /**
     * Show the form for editing a plan
     */
    public function edit(Plan $plan)
    {
        $otherDefaultPlanExists = Plan::where('is_default', true)
            ->where('id', '!=', $plan->id)
            ->exists();
            
        return Inertia::render('plans/edit', [
            'plan' => $plan,
            'otherDefaultPlanExists' => $otherDefaultPlanExists
        ]);
    }
    
    /**
     * Update a plan
     */
    public function update(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:plans,name,' . $plan->id,
            'price' => 'required|numeric|min:0',
            'yearly_price' => 'nullable|numeric|min:0',
            'duration' => 'required|string',
            'description' => 'nullable|string',
            'total_customers' => 'required|integer|min:0',
            'total_vendors' => 'required|integer|min:0',
            'max_users' => 'required|integer|min:0',
            'storage_limit' => 'required|numeric|min:0',
            'enable_chatgpt' => 'nullable|in:on,off',
            'is_trial' => 'nullable|in:on,off',
            'trial_day' => 'nullable|integer|min:0',
            'is_plan_enable' => 'nullable|in:on,off',
            'is_default' => 'nullable|boolean',
        ], [
            'price.min' => __('Monthly Price cannot be negative'),
            'yearly_price.min' => __('Yearly Price cannot be negative'),
            'total_customers.min' => __('Total Customers cannot be negative'),
            'total_vendors.min' => __('Total Vendors cannot be negative'),
            'max_users.min' => __('Maximum Users cannot be negative'),
            'storage_limit.min' => __('Storage Limit (GB) cannot be negative'),
            'trial_day.min' => __('Trial Days cannot be negative'),
        ]);
        
        // Set default values for nullable fields
        $validated['enable_chatgpt'] = $validated['enable_chatgpt'] ?? 'off';
        $validated['is_trial'] = $validated['is_trial'] ?? null;
        $validated['is_plan_enable'] = $validated['is_plan_enable'] ?? 'on';
        $validated['is_default'] = $validated['is_default'] ?? false;
        
        // If yearly_price is not provided, calculate it as 80% of monthly price * 12
        if (!isset($validated['yearly_price']) || $validated['yearly_price'] === null) {
            $validated['yearly_price'] = $validated['price'] * 12 * 0.8;
        }
        
        // If this plan is set as default, remove default status from other plans
        if ($validated['is_default'] && !$plan->is_default) {
            Plan::where('is_default', true)->update(['is_default' => false]);
        }
        
        // Update the plan
        $plan->update($validated);
        
        return redirect()->route('plans.index')->with('success', __('Plan updated successfully.'));
    }
    
    /**
     * Delete a plan
     */
    public function destroy(Plan $plan)
    {
        // Don't allow deleting the default plan
        if ($plan->is_default) {
            return back()->with('error', __('Cannot delete the default plan.'));
        }
        
        // Don't allow deleting plans assigned to users
        if ($plan->users()->count() > 0) {
            return back()->with('error', __('The company has subscribed to this plan, so it cannot be deleted.'));
        }
        
        $plan->delete();
        
        return redirect()->route('plans.index')->with('success', __('Plan deleted successfully.'));
    }
    
    private function companyPlansView(Request $request)
    {
        $user = auth()->user();

        // Get user's active plan billing cycle from latest approved order
        $latestPlanOrder = \App\Models\PlanOrder::where('user_id', $user->id)
            ->where('plan_id', $user->plan_id)
            ->where('status', 'approved')
            ->latest()
            ->first();

        $currentBillingCycle = $latestPlanOrder ? $latestPlanOrder->billing_cycle : 'monthly';
        if ($user->is_trial) {
            $currentBillingCycle = 'monthly';
        }

        // Default to currentBillingCycle on first load so plan data matches the selected tab
        $billingCycle = $request->input('billing_cycle', $currentBillingCycle);

        $dbPlans = Plan::where('is_plan_enable', 'on')->get();
        
        $plans = $dbPlans->map(function ($plan) use ($billingCycle, $user, $currentBillingCycle) {
            // Get price and formatted price based on billing cycle
            $price = $plan->getPriceForCycle($billingCycle);
            $formattedPrice = $plan->getFormattedPriceForCycle($billingCycle);
            
            $features = [];
            if ($plan->enable_chatgpt === 'on') $features[] = 'AI Integration';
            
            // Check if user has pending request for this plan
            $pendingRequest = \App\Models\PlanRequest::where('user_id', $user->id)
                ->where('plan_id', $plan->id)
                ->where('status', 'pending')
                ->first();

            // is_current: plan must match AND billing cycle must match current tab
            $isCurrent = $user->plan_id == $plan->id && $currentBillingCycle == $billingCycle;
            
            return [
                'id' => $plan->id,
                'name' => $plan->name,
                'price' => $price,
                'yearly_price' => $plan->yearly_price, // Include yearly price for frontend reference
                'formatted_price' => $formattedPrice,
                'duration' => $billingCycle === 'yearly' ? 'Yearly' : 'Monthly',
                'description' => $plan->description,
                'trial_days' => $plan->trial_day,
                'features' => $features,
                'stats' => [
                    'customers' => $plan->total_customers ?? 0,
                    'users' => $plan->max_users,
                    'storage' => $plan->storage_limit . ' GB',
                    'vendors' => $plan->total_vendors ?? 0
                ],
                'is_current' => $isCurrent,
                'is_trial_available' => $plan->is_trial === 'on' && !$user->is_trial,
                'is_default' => $plan->is_default,
                'recommended' => false, // Default to false
                'has_pending_request' => $pendingRequest ? true : false,
                'request_id' => $pendingRequest ? $pendingRequest->id : null
            ];
        });
        
        // Mark the plan with most subscribers as recommended
        $planSubscriberCounts = Plan::withCount('users')->get()->pluck('users_count', 'id');
        if ($planSubscriberCounts->isNotEmpty()) {
            $mostSubscribedPlanId = $planSubscriberCounts->keys()->sortByDesc(function($planId) use ($planSubscriberCounts) {
                return $planSubscriberCounts[$planId];
            })->first();
            
            $plans = $plans->map(function($plan) use ($mostSubscribedPlanId) {
                if ($plan['id'] == $mostSubscribedPlanId) {
                    $plan['recommended'] = true;
                }
                return $plan;
            });
        }
        
        return Inertia::render('plans/index', [
            'plans' => $plans,
            'billingCycle' => $billingCycle,
            'currentPlan' => $user->plan,
            'userTrialUsed' => $user->is_trial,
            'currentBillingCycle' => $currentBillingCycle,
        ]);
    }
    
    public function requestPlan(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'billing_cycle' => 'required|in:monthly,yearly'
        ]);
        
        $user = auth()->user();
        
        // Check if user already has a pending request
        $existingRequest = \App\Models\PlanRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();
            
        if ($existingRequest) {
            return back()->with('error', __('You already sent request to another plan'));
        }
        
        $plan = Plan::findOrFail($request->plan_id);
        
        \App\Models\PlanRequest::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'duration' => $request['billing_cycle'],
            'status' => 'pending'
        ]);
        
        return back()->with('success', __('Plan request submitted successfully'));
    }
    
    public function cancelRequest(Request $request)
    {
        $request->validate([
            'request_id' => 'required|exists:plan_requests,id'
        ]);
        
        $planRequest = \App\Models\PlanRequest::findOrFail($request->request_id);
        
        $planRequest->delete();
        
        return back()->with('success', __('Plan request cancelled successfully'));
    }
    
    public function startTrial(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id'
        ]);
        
        $user = auth()->user();
        $plan = Plan::findOrFail($request->plan_id);
        
        if ($user->is_trial || $plan->is_trial !== 'on') {
            return back()->withErrors(['error' => 'Trial not available']);
        }
        
        $user->update([
            'plan_id' => $plan->id,
            'is_trial' => 1,
            'trial_day' => $plan->trial_day,
            'trial_expire_date' => now()->addDays($plan->trial_day),
            'plan_is_active' => 1
        ]);
        
        return back()->with('success', __('Trial started successfully'));
    }
    
    public function subscribe(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'billing_cycle' => 'required|in:monthly,yearly'
        ]);
        
        $user = auth()->user();
        $plan = Plan::findOrFail($request->plan_id);
        $price = $plan->getPriceForCycle($request->billing_cycle);
        
        \App\Models\PlanOrder::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'original_price' => $price,
            'final_price' => $price,
            'status' => 'pending',
            'billing_cycle' => $request->billing_cycle,
            'processed_at' => now()
        ]);
        
        return back()->with('success', __('Subscription request submitted successfully'));
    }
}