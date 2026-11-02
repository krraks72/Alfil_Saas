<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\AliaddoSetting;
use App\Models\NotificationTemplate;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Currency;
use App\Models\PaymentSetting;
use App\Models\EmailTemplate;
use App\Models\UserEmailTemplate;


class SettingsController extends Controller
{
    /**
     * Display the main settings page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        // Get system settings using helper function
        $systemSettings = settings();
        $currencies = Currency::all();
        $paymentSettings = PaymentSetting::getUserSettings(auth()->id());

        $user = auth()->user();
        $settingsUserId = $user->id;

        if ($user->type !== 'company' && $user->created_by) {
            $settingsUserId = $user->created_by;
        }

        // Get email notification settings from user_email_templates table for company users
        if ($user->type === 'company' || ($user->type !== 'superadmin' && $user->created_by)) {
            $companyUserId = $user->type === 'company' ? $user->id : $user->created_by;
            $emailNotificationSettings = getEmailNotificationSettings($companyUserId);
            $systemSettings = array_merge($systemSettings, $emailNotificationSettings);
        }

        // Get notification templates for company users
        $templates = [];
        $notificationSettings = [];
        $emailTemplates = [];

        if ($user->type === 'company') {
            $templates = NotificationTemplate::get();
            $notificationSettings = Setting::where('user_id', $settingsUserId)
                ->where('key', 'like', 'notification_%_sms_enabled')
                ->pluck('value', 'key')
                ->toArray();
            
            // Get email templates with their active status
            $emailTemplates = EmailTemplate::with(['userEmailTemplates' => function($query) use ($settingsUserId) {
                    $query->where('user_id', $settingsUserId);
                }])
                ->get()
                ->map(function($template) {
                    return [
                        'id' => $template->id,
                        'name' => $template->name,
                        'is_active' => $template->userEmailTemplates->first()?->is_active ?? false
                    ];
                });
        }

        $data = [
            'systemSettings' => $systemSettings,
            'settings' => $systemSettings, // For helper functions
            'cacheSize' => getCacheSize(),
            'currencies' => $currencies,
            'timezones' => config('timezones'),
            'dateFormats' => config('dateformat'),
            'timeFormats' => config('timeformat'),
            'paymentSettings' => $paymentSettings,
            'templates' => $templates,
            'notificationSettings' => $notificationSettings,
            'emailTemplates' => $emailTemplates,
            'aliaddoSettings' => $user->type === 'company'
                ? $this->aliaddoSettingsForCompany($user->id)
                : null,
        ];

        // Webhooks removed from company side
        $data['webhooks'] = [];

        return Inertia::render('settings/index', $data);
    }

    private function aliaddoSettingsForCompany(int $companyId): array
    {
        $setting = AliaddoSetting::firstWhere('company_id', $companyId);

        return [
            'enabled' => $setting?->enabled ?? false,
            'base_url' => $setting?->base_url ?? 'https://orka.test.aliaddo.net',
            'has_token' => filled($setting?->api_token),
            'configuration' => $setting?->configuration ?? [],
        ];
    }

    /**
     * Get current settings as JSON for API calls
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSettings()
    {
        $settings = settings();
        return response()->json([
            'settings' => $settings
        ]);
    }

    /**
     * Update email notification settings
     */
    public function updateEmailNotifications(\Illuminate\Http\Request $request)
    {
        $user = auth()->user();
        $userId = $user->type === 'company' ? $user->id : $user->created_by;

        if (!$userId) {
            return back()->with('error', __('Unauthorized'));
        }

        $templateSettings = $request->input('templates', []);

        foreach ($templateSettings as $templateId => $isActive) {
            UserEmailTemplate::updateOrCreate(
                [
                    'template_id' => $templateId,
                    'user_id' => $userId
                ],
                [
                    'is_active' => $isActive
                ]
            );
        }

        return back()->with('success', __('Email notification settings updated successfully'));
    }
}
