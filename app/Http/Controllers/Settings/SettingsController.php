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
    private const SETTINGS_PERMISSIONS = [
        'manage-system-settings',
        'manage-email-settings',
        'manage-email-notification-settings',
        'manage-brand-settings',
        'manage-company-settings',
        'manage-payment-settings',
        'manage-currency-settings',
        'manage-slack-settings',
        'manage-twilio-settings',
        'manage-webhook-settings',
        'manage-google-calendar-settings',
        'manage-quotation-invoice-settings',
        'manage-aliaddo-settings',
    ];

    private const SETTINGS_KEYS_BY_PERMISSION = [
        'manage-system-settings' => [
            'defaultLanguage', 'dateFormat', 'timeFormat', 'calendarStartDay',
            'defaultTimezone', 'emailVerification', 'landingPageEnabled',
            'registrationEnabled', 'termsConditionsUrl',
        ],
        'manage-brand-settings' => [
            'logoDark', 'logoLight', 'favicon', 'titleText', 'footerText',
            'themeColor', 'customColor', 'sidebarVariant', 'sidebarStyle',
            'layoutDirection', 'themeMode',
        ],
        'manage-currency-settings' => [
            'defaultCurrency', 'decimalFormat', 'decimalSeparator',
            'thousandsSeparator', 'floatNumber', 'currencySymbolSpace',
            'currencySymbolPosition',
        ],
        'manage-email-settings' => [
            'email_provider', 'email_driver', 'email_host', 'email_port',
            'email_username', 'email_encryption', 'email_from_address', 'email_from_name',
        ],
        'manage-email-notification-settings' => [
            'email_notification_new_user', 'email_notification_new_customer',
            'email_notification_new_vendor', 'email_notification_new_branch',
            'email_notification_new_expense', 'email_notification_new_purchase',
            'email_notification_new_purchase_return', 'email_notification_new_quotation',
            'email_notification_new_sale_return',
        ],
        'manage-company-settings' => [
            'companyName', 'companyAddress', 'companyCity', 'companyState',
            'companyZipCode', 'companyCountry', 'companyTelephone',
        ],
        'manage-slack-settings' => ['slack_webhook_url', 'slack_enabled'],
        'manage-twilio-settings' => [
            'twilio_account_sid', 'twilio_auth_token', 'twilio_from_number',
        ],
        'manage-google-calendar-settings' => [
            'googleCalendarEnabled', 'googleCalendarId', 'googleCalendarJsonPath',
            'is_googlecalendar_sync',
        ],
        'manage-quotation-invoice-settings' => [
            'quotation_invoice_template', 'quotation_invoice_qr_display',
            'quotation_invoice_color', 'quotation_invoice_footer_title',
            'quotation_invoice_footer_notes',
        ],
    ];

    /**
     * Display the main settings page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $user = auth()->user();
        $accessiblePermissions = $user->getAccessiblePermissions()->pluck('name')->all();
        $isSuperAdmin = $user->isSuperAdmin();
        $hasSettingsPermission = fn (string $permission): bool => in_array($permission, $accessiblePermissions, true);

        abort_unless(
            $isSuperAdmin
                || $hasSettingsPermission('manage-settings')
                || collect(self::SETTINGS_PERMISSIONS)->contains($hasSettingsPermission),
            403
        );

        // Get system settings using helper function
        $systemSettings = settings();
        $currencies = $isSuperAdmin || $hasSettingsPermission('manage-currency-settings')
            ? Currency::all()
            : collect();
        $paymentSettings = $isSuperAdmin || $hasSettingsPermission('manage-payment-settings')
            ? PaymentSetting::getUserSettings($user->id)
            : [];
        $settingsUserId = $user->id;

        if ($user->type !== 'company' && $user->created_by) {
            $settingsUserId = $user->created_by;
        }

        if (! $isSuperAdmin) {
            $visibleSettingKeys = collect(self::SETTINGS_KEYS_BY_PERMISSION)
                ->filter(fn ($keys, $permission) => $hasSettingsPermission($permission))
                ->flatten()
                ->all();
            $systemSettings = array_intersect_key(
                (array) $systemSettings,
                array_flip($visibleSettingKeys)
            );
        }

        // Get email notification settings from user_email_templates table for company users
        if (
            $hasSettingsPermission('manage-email-notification-settings')
            && ($user->type === 'company' || ($user->type !== 'superadmin' && $user->created_by))
        ) {
            $companyUserId = $user->type === 'company' ? $user->id : $user->created_by;
            $emailNotificationSettings = getEmailNotificationSettings($companyUserId);
            $systemSettings = array_merge($systemSettings, $emailNotificationSettings);
        }

        // Get notification templates for company users
        $templates = [];
        $notificationSettings = [];
        $emailTemplates = [];

        if ($user->type === 'company' && $hasSettingsPermission('manage-email-notification-settings')) {
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
            'cacheSize' => $isSuperAdmin ? getCacheSize() : '0.00',
            'currencies' => $currencies,
            'timezones' => config('timezones'),
            'dateFormats' => config('dateformat'),
            'timeFormats' => config('timeformat'),
            'paymentSettings' => $paymentSettings,
            'templates' => $templates,
            'notificationSettings' => $notificationSettings,
            'emailTemplates' => $emailTemplates,
            'aliaddoSettings' => $user->type === 'company' && $hasSettingsPermission('manage-aliaddo-settings')
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
            'settings' => [
                'is_googlecalendar_sync' => $settings['is_googlecalendar_sync'] ?? null,
            ],
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
