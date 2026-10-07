<?php

use App\Models\Setting;
use App\Models\User;
use App\Models\Coupon;
use App\Models\NotificationTemplate;
use App\Models\NotificationTemplateLang;
use Carbon\Carbon;
use App\Models\Plan;
use App\Models\PlanOrder;
use App\Models\Role;
use App\Models\PaymentSetting;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

if (!function_exists('getCacheSize')) {
    /**
     * Get the total cache size in MB
     *
     * @return string
     */
    function getCacheSize()
    {
        $file_size = 0;
        $framework_path = storage_path('framework');

        if (is_dir($framework_path)) {
            foreach (\File::allFiles($framework_path) as $file) {
                $file_size += $file->getSize();
            }
        }

        return number_format($file_size / 1000000, 2);
    }
}

if (! function_exists('settings')) {
    function settings($user_id = null)
    {
        // Skip database queries during installation
        if (request()->is('install/*') || request()->is('update/*') || !file_exists(storage_path('installed'))) {
            return [];
        }

        if (is_null($user_id)) {
            if (auth()->user()) {
                if (!in_array(auth()->user()->type, ['superadmin', 'company'])) {
                    $user_id = auth()->user()->created_by;
                } else {
                    $user_id = auth()->id();
                }
            } else {
                $user = User::where('type', 'superadmin')->first();
                $user_id = $user ? $user->id : null;
            }
        }

        if (!$user_id) {
            return collect();
        }

        $userSettings = Setting::where('user_id', $user_id)->pluck('value', 'key')->toArray();

        // If user is not superadmin, merge with superadmin settings for specific keys
        if (auth()->check() && auth()->user()->type !== 'superadmin') {
            $superAdmin = User::where('type', 'superadmin')->first();
            if ($superAdmin) {
                $superAdminKeys = ['decimalFormat', 'defaultCurrency', 'thousandsSeparator', 'floatNumber', 'currencySymbolSpace', 'currencySymbolPosition', 'dateFormat', 'timeFormat', 'calendarStartDay', 'defaultTimezone', 'enableLogging', 'strictlyNecessaryCookies', 'cookieTitle', 'cookieDescription', 'strictlyCookieTitle', 'strictlyCookieDescription', 'contactUsDescription', 'contactUsUrl'];
                $superAdminSettings = Setting::where('user_id', $superAdmin->id)
                    ->whereIn('key', $superAdminKeys)
                    ->pluck('value', 'key')
                    ->toArray();
                $userSettings = array_merge($superAdminSettings, $userSettings);
            }
        }

        // Add base_url and image_url from APP_URL
        $appUrl = config('app.url');
        $userSettings['base_url'] = $appUrl;
        $userSettings['image_url'] = $appUrl;

        // Add asset_url helper for frontend
        $userSettings['asset_url'] = $appUrl;

        // Add app_url for API endpoint construction
        $userSettings['app_url'] = $appUrl;

        // Add IS_DEMO from environment
        $userSettings['is_demo'] = config('app.is_demo', false) === 'true' || config('app.is_demo', false) === true;

        // Add email notification settings from user_email_templates for company users
        if (auth()->check()) {
            $currentUser = auth()->user();
            if ($currentUser->type === 'company' || ($currentUser->type !== 'superadmin' && $currentUser->created_by)) {
                $companyUserId = $currentUser->type === 'company' ? $currentUser->id : $currentUser->created_by;
                $emailNotificationSettings = getEmailNotificationSettings($companyUserId);
                $userSettings = array_merge($userSettings, $emailNotificationSettings);
            }
        }

        // Add default purchase invoice settings if not set
        $defaultPurchaseInvoiceSettings = [
            'purchase_invoice_template' => 'new_york',
            'purchase_invoice_qr_display' => 'false',
            'purchase_invoice_color' => '#3b82f6',
            'purchase_invoice_footer_title' => '',
            'purchase_invoice_footer_notes' => '',
        ];

        foreach ($defaultPurchaseInvoiceSettings as $key => $defaultValue) {
            if (!isset($userSettings[$key])) {
                $userSettings[$key] = $defaultValue;
            }
        }

        return $userSettings;
    }
}

if (! function_exists('formatDateTime')) {
    function formatDateTime($date, $includeTime = true)
    {
        if (!$date) {
            return null;
        }

        $settings = settings();

        $dateFormat = $settings['dateFormat'] ?? 'Y-m-d';
        $timeFormat = $settings['timeFormat'] ?? 'H:i';
        $timezone = $settings['defaultTimezone'] ?? config('app.timezone', 'UTC');

        $format = $includeTime ? "$dateFormat $timeFormat" : $dateFormat;

        return Carbon::parse($date)->timezone($timezone)->format($format);
    }
}

if (! function_exists('getSetting')) {
    function getSetting($key, $default = null, $user_id = null)
    {
        $settings = settings($user_id);

        // If no value found and no default provided, try to get from defaultSettings
        if (!isset($settings[$key]) && $default === null) {
            $defaultSettings = defaultSettings();
            $default = $defaultSettings[$key] ?? null;
        }

        return $settings[$key] ?? $default;
    }
}
if (! function_exists('getCompanyIdByUser')) {
    function getCompanyIdByUser($userId = null)
    {
        $user = $userId ? User::find($userId) : auth()->user();
        if (!$user) return null;

        if ($user->type === 'company') return $user->id;

        if ($user->created_by) return getCompanyIdByUser($user->created_by);

        return null;
    }
}

if (! function_exists('getCompanyAndUsersId')) {
    function getCompanyAndUsersId()
    {
        $user = Auth::user();
        if ($user->hasRole(['company'])) {
            $companyUserIds = User::where('created_by', $user->id)->pluck('id')->toArray();
            $companyUserIds[] = $user->id;
            return $companyUserIds;
        } else {
            $userCreatedBy = User::where('id', Auth::user()->created_by)->value('id');
            $companyUserIds = User::where('created_by', $userCreatedBy)->pluck('id')->toArray();
            $companyUserIds[] = $userCreatedBy;
            return $companyUserIds;
        }
    }
}


if (! function_exists('updateSetting')) {
    function updateSetting($key, $value, $user_id = null)
    {
        if (is_null($user_id)) {
            if (auth()->user()) {
                if (!in_array(auth()->user()->type, ['superadmin', 'company'])) {
                    $user_id = auth()->user()->created_by;
                } else {
                    $user_id = auth()->id();
                }
            } else {
                $user = User::where('type', 'superadmin')->first();
                $user_id = $user ? $user->id : null;
            }
        }

        if (!$user_id) {
            return false;
        }

        return Setting::updateOrCreate(
            ['user_id' => $user_id, 'key' => $key],
            ['value' => $value]
        );
    }
}

if (! function_exists('isLandingPageEnabled')) {
    function isLandingPageEnabled()
    {
        return getSetting('landingPageEnabled', true) === true || getSetting('landingPageEnabled', true) === '1';
    }
}

if (! function_exists('isRegistrationEnabled')) {
    function isRegistrationEnabled()
    {
        return getSetting('registrationEnabled', false) === true || getSetting('registrationEnabled', false) === '1';
    }
}

if (! function_exists('defaultRoleAndSetting')) {
    function defaultRoleAndSetting($user)
    {
        $companyRole = Role::where('name', 'company')->first();

        if ($companyRole) {
            $user->assignRole($companyRole);
        }

        // Create default settings for the user
        if ($user->type === 'superadmin') {
            createDefaultSettings($user->id);
            defultnotificationAndsetting($user->id);
        } elseif ($user->type === 'company') {
            copySettingsFromSuperAdmin($user->id);
            $user->companyDefaultData($user);
            defultnotificationAndsetting($user->id);
        }

        return true;
    }
}
if (! function_exists('defultnotificationAndsetting')) {
    function defultnotificationAndsetting($user)
    {
        $templates = NotificationTemplate::all();
        // Copy language content from created_by=1 to new company
        foreach ($templates as $template) {
            $defaultLangs = NotificationTemplateLang::where('parent_id', $template->id)
                ->where('created_by', 1)
                ->get();
            foreach ($defaultLangs as $defaultLang) {
                NotificationTemplateLang::updateOrCreate(
                    [
                        'parent_id' => $template->id,
                        'lang' => $defaultLang->lang,
                        'created_by' => $user
                    ],
                    [
                        'title' => $defaultLang->title,
                        'content' => $defaultLang->content
                    ]
                );
            }
        }
    }
}

if (! function_exists('getPaymentSettings')) {
    /**
     * Get payment settings for a user
     *
     * @param int|null $userId
     * @return array
     */
    function getPaymentSettings($userId = null)
    {
        if (is_null($userId)) {
            if (auth()->check() && auth()->user()->type == 'superadmin') {
                $userId = auth()->id();
            } else {
                $user = User::where('type', 'superadmin')->first();
                $userId = $user ? $user->id : null;
            }
        }

        return PaymentSetting::getUserSettings($userId);
    }
}

if (! function_exists('updatePaymentSetting')) {
    /**
     * Update or create a payment setting
     *
     * @param string $key
     * @param mixed $value
     * @param int|null $userId
     * @return \App\Models\PaymentSetting
     */
    function updatePaymentSetting($key, $value, $userId = null)
    {
        if (is_null($userId)) {
            $userId = auth()->id();
        }

        return PaymentSetting::updateOrCreateSetting($userId, $key, $value);
    }
}

if (! function_exists('isPaymentMethodEnabled')) {
    /**
     * Check if a payment method is enabled
     *
     * @param string $method (stripe, paypal, razorpay, mercadopago, bank)
     * @param int|null $userId
     * @return bool
     */
    function isPaymentMethodEnabled($method, $userId = null)
    {
        $settings = getPaymentSettings($userId);
        $key = "is_{$method}_enabled";

        return isset($settings[$key]) && ($settings[$key] === true || $settings[$key] === '1');
    }
}

if (! function_exists('getPaymentMethodConfig')) {
    /**
     * Get configuration for a specific payment method
     *
     * @param string $method (stripe, paypal, razorpay, mercadopago)
     * @param int|null $userId
     * @return array
     */
    function getPaymentMethodConfig($method, $userId = null)
    {
        $settings = getPaymentSettings($userId);

        switch ($method) {
            case 'stripe':
                return [
                    'enabled' => isPaymentMethodEnabled('stripe', $userId),
                    'key' => $settings['stripe_key'] ?? null,
                    'secret' => $settings['stripe_secret'] ?? null,
                ];

            case 'paypal':
                return [
                    'enabled' => isPaymentMethodEnabled('paypal', $userId),
                    'mode' => $settings['paypal_mode'] ?? 'sandbox',
                    'client_id' => $settings['paypal_client_id'] ?? null,
                    'secret' => $settings['paypal_secret_key'] ?? null,
                ];

            case 'razorpay':
                return [
                    'enabled' => isPaymentMethodEnabled('razorpay', $userId),
                    'key' => $settings['razorpay_key'] ?? null,
                    'secret' => $settings['razorpay_secret'] ?? null,
                ];

            case 'mercadopago':
                return [
                    'enabled' => isPaymentMethodEnabled('mercadopago', $userId),
                    'mode' => $settings['mercadopago_mode'] ?? 'sandbox',
                    'access_token' => $settings['mercadopago_access_token'] ?? null,
                ];

            case 'paystack':
                return [
                    'enabled' => isPaymentMethodEnabled('paystack', $userId),
                    'public_key' => $settings['paystack_public_key'] ?? null,
                    'secret_key' => $settings['paystack_secret_key'] ?? null,
                ];

            case 'flutterwave':
                return [
                    'enabled' => isPaymentMethodEnabled('flutterwave', $userId),
                    'public_key' => $settings['flutterwave_public_key'] ?? null,
                    'secret_key' => $settings['flutterwave_secret_key'] ?? null,
                ];

            case 'bank':
                return [
                    'enabled' => isPaymentMethodEnabled('bank', $userId),
                    'details' => $settings['bank_detail'] ?? null,
                ];

            case 'paytabs':
                return [
                    'enabled' => isPaymentMethodEnabled('paytabs', $userId),
                    'mode' => $settings['paytabs_mode'] ?? 'sandbox',
                    'profile_id' => $settings['paytabs_profile_id'] ?? null,
                    'server_key' => $settings['paytabs_server_key'] ?? null,
                    'region' => $settings['paytabs_region'] ?? 'ARE',
                ];

            case 'skrill':
                return [
                    'enabled' => isPaymentMethodEnabled('skrill', $userId),
                    'merchant_id' => $settings['skrill_merchant_id'] ?? null,
                    'secret_word' => $settings['skrill_secret_word'] ?? null,
                ];

            case 'coingate':
                return [
                    'enabled' => isPaymentMethodEnabled('coingate', $userId),
                    'mode' => $settings['coingate_mode'] ?? 'sandbox',
                    'api_token' => $settings['coingate_api_token'] ?? null,
                ];

            case 'payfast':
                return [
                    'enabled' => isPaymentMethodEnabled('payfast', $userId),
                    'mode' => $settings['payfast_mode'] ?? 'sandbox',
                    'merchant_id' => $settings['payfast_merchant_id'] ?? null,
                    'merchant_key' => $settings['payfast_merchant_key'] ?? null,
                    'passphrase' => $settings['payfast_passphrase'] ?? null,
                ];

            case 'tap':
                return [
                    'enabled' => isPaymentMethodEnabled('tap', $userId),
                    'secret_key' => $settings['tap_secret_key'] ?? null,
                ];

            case 'xendit':
                return [
                    'enabled' => isPaymentMethodEnabled('xendit', $userId),
                    'api_key' => $settings['xendit_api_key'] ?? null,
                ];

            case 'paytr':
                return [
                    'enabled' => isPaymentMethodEnabled('paytr', $userId),
                    'merchant_id' => $settings['paytr_merchant_id'] ?? null,
                    'merchant_key' => $settings['paytr_merchant_key'] ?? null,
                    'merchant_salt' => $settings['paytr_merchant_salt'] ?? null,
                ];

            case 'mollie':
                return [
                    'enabled' => isPaymentMethodEnabled('mollie', $userId),
                    'api_key' => $settings['mollie_api_key'] ?? null,
                ];

            case 'toyyibpay':
                return [
                    'enabled' => isPaymentMethodEnabled('toyyibpay', $userId),
                    'category_code' => $settings['toyyibpay_category_code'] ?? null,
                    'secret_key' => $settings['toyyibpay_secret_key'] ?? null,
                    'mode' => $settings['toyyibpay_mode'] ?? 'sandbox',
                ];

            case 'cashfree':
                return [
                    'enabled' => isPaymentMethodEnabled('cashfree', $userId),
                    'mode' => $settings['cashfree_mode'] ?? 'sandbox',
                    'public_key' => $settings['cashfree_public_key'] ?? null,
                    'secret_key' => $settings['cashfree_secret_key'] ?? null,
                ];

            case 'iyzipay':
                return [
                    'enabled' => isPaymentMethodEnabled('iyzipay', $userId),
                    'mode' => $settings['iyzipay_mode'] ?? 'sandbox',
                    'public_key' => $settings['iyzipay_public_key'] ?? null,
                    'secret_key' => $settings['iyzipay_secret_key'] ?? null,
                ];

            case 'benefit':
                return [
                    'enabled' => isPaymentMethodEnabled('benefit', $userId),
                    'mode' => $settings['benefit_mode'] ?? 'sandbox',
                    'public_key' => $settings['benefit_public_key'] ?? null,
                    'secret_key' => $settings['benefit_secret_key'] ?? null,
                ];

            case 'ozow':
                return [
                    'enabled' => isPaymentMethodEnabled('ozow', $userId),
                    'mode' => $settings['ozow_mode'] ?? 'sandbox',
                    'site_key' => $settings['ozow_site_key'] ?? null,
                    'private_key' => $settings['ozow_private_key'] ?? null,
                    'api_key' => $settings['ozow_api_key'] ?? null,
                ];

            case 'easebuzz':
                return [
                    'enabled' => isPaymentMethodEnabled('easebuzz', $userId),
                    'merchant_key' => $settings['easebuzz_merchant_key'] ?? null,
                    'salt_key' => $settings['easebuzz_salt_key'] ?? null,
                    'environment' => $settings['easebuzz_environment'] ?? 'test',
                ];

            case 'khalti':
                return [
                    'enabled' => isPaymentMethodEnabled('khalti', $userId),
                    'public_key' => $settings['khalti_public_key'] ?? null,
                    'secret_key' => $settings['khalti_secret_key'] ?? null,
                ];

            case 'authorizenet':
                return [
                    'enabled' => isPaymentMethodEnabled('authorizenet', $userId),
                    'mode' => $settings['authorizenet_mode'] ?? 'sandbox',
                    'merchant_id' => $settings['authorizenet_merchant_id'] ?? null,
                    'transaction_key' => $settings['authorizenet_transaction_key'] ?? null,
                    'supported_countries' => ['US', 'CA', 'GB', 'AU'],
                    'supported_currencies' => ['USD', 'CAD', 'CHF', 'DKK', 'EUR', 'GBP', 'NOK', 'PLN', 'SEK', 'AUD', 'NZD'],
                ];

            case 'fedapay':
                return [
                    'enabled' => isPaymentMethodEnabled('fedapay', $userId),
                    'mode' => $settings['fedapay_mode'] ?? 'sandbox',
                    'public_key' => $settings['fedapay_public_key'] ?? null,
                    'secret_key' => $settings['fedapay_secret_key'] ?? null,
                ];

            case 'payhere':
                return [
                    'enabled' => isPaymentMethodEnabled('payhere', $userId),
                    'mode' => $settings['payhere_mode'] ?? 'sandbox',
                    'merchant_id' => $settings['payhere_merchant_id'] ?? null,
                    'merchant_secret' => $settings['payhere_merchant_secret'] ?? null,
                    'app_id' => $settings['payhere_app_id'] ?? null,
                    'app_secret' => $settings['payhere_app_secret'] ?? null,
                ];

            case 'cinetpay':
                return [
                    'enabled' => isPaymentMethodEnabled('cinetpay', $userId),
                    'site_id' => $settings['cinetpay_site_id'] ?? null,
                    'api_key' => $settings['cinetpay_api_key'] ?? null,
                    'secret_key' => $settings['cinetpay_secret_key'] ?? null,
                ];

            case 'paiement':
                return [
                    'enabled' => isPaymentMethodEnabled('paiement', $userId),
                    'merchant_id' => $settings['paiement_merchant_id'] ?? null,
                ];

            case 'midtrans':
                return [
                    'enabled' => isPaymentMethodEnabled('midtrans', $userId),
                    'mode' => $settings['midtrans_mode'] ?? 'sandbox',
                    'secret_key' => $settings['midtrans_secret_key'] ?? null,
                ];

            default:
                return [];
        }
    }
}

if (! function_exists('getEnabledPaymentMethods')) {
    /**
     * Get all enabled payment methods
     *
     * @param int|null $userId
     * @return array
     */
    function getEnabledPaymentMethods($userId = null)
    {
        $methods = ['stripe', 'paypal', 'razorpay', 'mercadopago', 'paystack', 'flutterwave', 'bank', 'paytabs', 'skrill', 'coingate', 'payfast', 'tap', 'xendit', 'paytr', 'mollie', 'toyyibpay', 'cashfree', 'iyzipay', 'benefit', 'ozow', 'easebuzz', 'khalti', 'authorizenet', 'fedapay', 'payhere', 'cinetpay', 'paiement'];
        $enabled = [];

        foreach ($methods as $method) {
            if (isPaymentMethodEnabled($method, $userId)) {
                $enabled[$method] = getPaymentMethodConfig($method, $userId);
            }
        }

        return $enabled;
    }
}

if (! function_exists('validatePaymentMethodConfig')) {
    /**
     * Validate payment method configuration
     *
     * @param string $method
     * @param array $config
     * @return array [valid => bool, errors => array]
     */
    function validatePaymentMethodConfig($method, $config)
    {
        $errors = [];

        switch ($method) {
            case 'stripe':
                if (empty($config['key'])) {
                    $errors[] = 'Stripe publishable key is required';
                }
                if (empty($config['secret'])) {
                    $errors[] = 'Stripe secret key is required';
                }
                break;

            case 'paypal':
                if (empty($config['client_id'])) {
                    $errors[] = 'PayPal client ID is required';
                }
                if (empty($config['secret'])) {
                    $errors[] = 'PayPal secret key is required';
                }
                break;

            case 'razorpay':
                if (empty($config['key'])) {
                    $errors[] = 'Razorpay key ID is required';
                }
                if (empty($config['secret'])) {
                    $errors[] = 'Razorpay secret key is required';
                }
                break;

            case 'mercadopago':
                if (empty($config['access_token'])) {
                    $errors[] = 'MercadoPago access token is required';
                }
                break;

            case 'bank':
                if (empty($config['details'])) {
                    $errors[] = 'Bank details are required';
                }
                break;

            case 'paytabs':
                if (empty($config['server_key'])) {
                    $errors[] = 'PayTabs server key is required';
                }
                if (empty($config['profile_id'])) {
                    $errors[] = 'PayTabs profile id is required';
                }
                if (empty($config['region'])) {
                    $errors[] = 'PayTabs region is required';
                }
                break;

            case 'skrill':
                if (empty($config['merchant_id'])) {
                    $errors[] = 'Skrill merchant ID is required';
                }
                if (empty($config['secret_word'])) {
                    $errors[] = 'Skrill secret word is required';
                }
                break;

            case 'coingate':
                if (empty($config['api_token'])) {
                    $errors[] = 'CoinGate API token is required';
                }
                break;

            case 'payfast':
                if (empty($config['merchant_id'])) {
                    $errors[] = 'Payfast merchant ID is required';
                }
                if (empty($config['merchant_key'])) {
                    $errors[] = 'Payfast merchant key is required';
                }
                break;

            case 'tap':
                if (empty($config['secret_key'])) {
                    $errors[] = 'Tap secret key is required';
                }
                break;

            case 'xendit':
                if (empty($config['api_key'])) {
                    $errors[] = 'Xendit api key is required';
                }
                break;

            case 'paytr':
                if (empty($config['merchant_id'])) {
                    $errors[] = 'PayTR merchant ID is required';
                }
                if (empty($config['merchant_key'])) {
                    $errors[] = 'PayTR merchant key is required';
                }
                if (empty($config['merchant_salt'])) {
                    $errors[] = 'PayTR merchant salt is required';
                }
                break;

            case 'mollie':
                if (empty($config['api_key'])) {
                    $errors[] = 'Mollie API key is required';
                }
                break;

            case 'toyyibpay':
                if (empty($config['category_code'])) {
                    $errors[] = 'toyyibPay category code is required';
                }
                if (empty($config['secret_key'])) {
                    $errors[] = 'toyyibPay secret key is required';
                }
                break;

            case 'cashfree':
                if (empty($config['public_key'])) {
                    $errors[] = 'Cashfree App ID is required';
                }
                if (empty($config['secret_key'])) {
                    $errors[] = 'Cashfree Secret Key is required';
                }
                break;

            case 'iyzipay':
                if (empty($config['public_key'])) {
                    $errors[] = 'Iyzipay API key is required';
                }
                if (empty($config['secret_key'])) {
                    $errors[] = 'Iyzipay secret key is required';
                }
                break;

            case 'benefit':
                if (empty($config['public_key'])) {
                    $errors[] = 'Benefit API key is required';
                }
                if (empty($config['secret_key'])) {
                    $errors[] = 'Benefit secret key is required';
                }
                break;

            case 'ozow':
                if (empty($config['site_key'])) {
                    $errors[] = 'Ozow site key is required';
                }
                if (empty($config['private_key'])) {
                    $errors[] = 'Ozow private key is required';
                }
                break;

            case 'easebuzz':
                if (empty($config['merchant_key'])) {
                    $errors[] = 'Easebuzz merchant key is required';
                }
                if (empty($config['salt_key'])) {
                    $errors[] = 'Easebuzz salt key is required';
                }
                break;

            case 'khalti':
                if (empty($config['public_key'])) {
                    $errors[] = 'Khalti public key is required';
                }
                if (empty($config['secret_key'])) {
                    $errors[] = 'Khalti secret key is required';
                }
                break;

            case 'authorizenet':
                if (empty($config['merchant_id'])) {
                    $errors[] = 'AuthorizeNet merchant ID is required';
                }
                if (empty($config['transaction_key'])) {
                    $errors[] = 'AuthorizeNet transaction key is required';
                }
                break;

            case 'fedapay':
                if (empty($config['public_key'])) {
                    $errors[] = 'FedaPay public key is required';
                }
                if (empty($config['secret_key'])) {
                    $errors[] = 'FedaPay secret key is required';
                }
                break;

            case 'payhere':
                if (empty($config['merchant_id'])) {
                    $errors[] = 'PayHere merchant ID is required';
                }
                if (empty($config['merchant_secret'])) {
                    $errors[] = 'PayHere merchant secret is required';
                }
                break;

            case 'cinetpay':
                if (empty($config['site_id'])) {
                    $errors[] = 'CinetPay site ID is required';
                }
                if (empty($config['api_key'])) {
                    $errors[] = 'CinetPay API key is required';
                }
                break;

            case 'paiement':
                if (empty($config['merchant_id'])) {
                    $errors[] = 'Paiement Pro merchant ID is required';
                }
                break;

            case 'nepalste':
                if (empty($config['public_key'])) {
                    $errors[] = 'Nepalste public key is required';
                }
                if (empty($config['secret_key'])) {
                    $errors[] = 'Nepalste secret key is required';
                }
                break;

            case 'yookassa':
                if (empty($config['shop_id'])) {
                    $errors[] = 'YooKassa shop ID is required';
                }
                if (empty($config['secret_key'])) {
                    $errors[] = 'YooKassa secret key is required';
                }
                break;

            case 'midtrans':
                if (empty($config['secret_key'])) {
                    $errors[] = 'Midtrans secret key is required';
                }
                break;

            case 'aamarpay':
                if (empty($config['store_id'])) {
                    $errors[] = 'Aamarpay store ID is required';
                }
                if (empty($config['signature'])) {
                    $errors[] = 'Aamarpay signature is required';
                }
                break;

        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }
}

if (! function_exists('calculatePlanPricing')) {
    function calculatePlanPricing($plan, $couponCode = null, $billingCycle = 'monthly')
    {
        $originalPrice = $plan->getPriceForCycle($billingCycle);
        $discountAmount = 0;
        $finalPrice = $originalPrice;
        $couponId = null;

        if ($couponCode) {
            $coupon = Coupon::where('code', $couponCode)
                ->where('status', 1)
                ->first();

            if ($coupon) {
                if ($coupon->type === 'percentage') {
                    $discountAmount = ($originalPrice * $coupon->discount_amount) / 100;
                } else {
                    $discountAmount = min($coupon->discount_amount, $originalPrice);
                }
                $finalPrice = max(0, $originalPrice - $discountAmount);
                $couponId = $coupon->id;
            }
        }

        return [
            'original_price' => $originalPrice,
            'discount_amount' => $discountAmount,
            'final_price' => $finalPrice,
            'coupon_id' => $couponId
        ];
    }
}

if (! function_exists('createPlanOrder')) {
    function createPlanOrder($data)
    {
        $plan = Plan::findOrFail($data['plan_id']);
        $billingCycle = $data['billing_cycle'] ?? 'monthly';
        $pricing = calculatePlanPricing($plan, $data['coupon_code'] ?? null, $billingCycle);

        return PlanOrder::create([
            'user_id' => $data['user_id'],
            'plan_id' => $plan->id,
            'coupon_id' => $pricing['coupon_id'],
            'billing_cycle' => $billingCycle,
            'payment_method' => $data['payment_method'],
            'coupon_code' => $data['coupon_code'] ?? null,
            'original_price' => $pricing['original_price'],
            'discount_amount' => $pricing['discount_amount'],
            'final_price' => $pricing['final_price'],
            'payment_id' => $data['payment_id'],
            'status' => $data['status'] ?? 'pending',
            'ordered_at' => now(),
            'processed_at' => $data['processed_at'] ?? null,
            'receipt' => $data['receipt'] ?? null,
        ]);
    }
}

if (! function_exists('assignPlanToUser')) {
    function assignPlanToUser($user, $plan, $billingCycle)
    {
        $expiresAt = $billingCycle === 'yearly' ? now()->addYear() : now()->addMonth();

        $updated = $user->update([
            'plan_id' => $plan->id,
            'plan_expire_date' => $expiresAt,
            'plan_is_active' => 1,
            'is_trial' => $user->is_trial == 1 ? 0 : $user->is_trial,
            'trial_expire_date' => null,
            'trial_day' => 0,
        ]);

        return $updated;
    }
}

if (! function_exists('processPaymentSuccess')) {
    function processPaymentSuccess($data)
    {
        try {
            $plan = Plan::findOrFail($data['plan_id']);
            $user = User::findOrFail($data['user_id']);

            $planOrder = createPlanOrder(array_merge($data, ['processed_at' => now(),'status' => 'approved']));

            $assignResult = assignPlanToUser($user, $plan, $data['billing_cycle']);

            // Verify the plan was assigned
            $user->refresh();

            // Create referral record if user was referred
            \App\Http\Controllers\ReferralController::createReferralRecord($user);

            return $planOrder;
        } catch (\Exception $e) {
            throw $e;
        }
    }
}

if (! function_exists('getPaymentGatewaySettings')) {
    function getPaymentGatewaySettings()
    {
        $superAdminId = User::where('type', 'superadmin')->first()?->id;

        return [
            'payment_settings' => PaymentSetting::getUserSettings($superAdminId),
            'general_settings' => Setting::getUserSettings($superAdminId),
            'super_admin_id' => $superAdminId
        ];
    }
}

if (! function_exists('validatePaymentRequest')) {
    function validatePaymentRequest($request, $additionalRules = [])
    {
        $baseRules = [
            'plan_id' => 'required|exists:plans,id',
            'billing_cycle' => 'required|in:monthly,yearly',
            'coupon_code' => 'nullable|string',
        ];

        return $request->validate(array_merge($baseRules, $additionalRules));
    }
}

if (! function_exists('handlePaymentError')) {
    function handlePaymentError($e, $method = 'payment')
    {
        return back()->withErrors(['error' => __('Payment processing failed: :message', ['message' => $e->getMessage()])]);
    }
}

if (! function_exists('defaultSettings')) {
    /**
     * Get default settings for System, Brand, Storage, and Currency configurations
     *
     * @return array
     */
    function defaultSettings()
    {
        return [
            // System Settings
            'defaultLanguage' => 'en',
            'dateFormat' => 'Y-m-d',
            'timeFormat' => 'H:i',
            'calendarStartDay' => 'sunday',
            'defaultTimezone' => 'UTC',
            'emailVerification' => false,
            'landingPageEnabled' => true,
            'registrationEnabled' => true,

            // Brand Settings
            'logoDark' => '/images/logos/logo-dark.png',
            'logoLight' => '/images/logos/logo-light.png',
            'favicon' => '/images/logos/favicon.png',
            'titleText' => 'POS',
            'footerText' => '© 2026 POS. All rights reserved.',
            'themeColor' => 'green',
            'customColor' => '#10b77f',
            'sidebarVariant' => 'inset',
            'sidebarStyle' => 'plain',
            'layoutDirection' => 'left',
            'themeMode' => 'light',

            // Storage Settings
            'storage_type' => 'local',
            'storage_file_types' => 'jpg,png,webp,gif,pdf,doc,docx,txt,csv',
            'storage_max_upload_size' => '2048',
            'aws_access_key_id' => '',
            'aws_secret_access_key' => '',
            'aws_default_region' => 'us-east-1',
            'aws_bucket' => '',
            'aws_url' => '',
            'aws_endpoint' => '',
            'wasabi_access_key' => '',
            'wasabi_secret_key' => '',
            'wasabi_region' => 'us-east-1',
            'wasabi_bucket' => '',
            'wasabi_url' => '',
            'wasabi_root' => '',

            // Currency Settings
            'decimalFormat' => '2',
            'defaultCurrency' => 'USD',
            'decimalSeparator' => '.',
            'thousandsSeparator' => ',',
            'floatNumber' => true,
            'currencySymbolSpace' => false,
            'currencySymbolPosition' => 'before',

            // ReCaptcha Settings
            'recaptchaEnabled' => false,
            'recaptchaVersion' => 'v2',
            'recaptchaSiteKey' => '',
            'recaptchaSecretKey' => '',
        ];
    }
}

if (! function_exists('createDefaultSettings')) {
    /**
     * Create default settings for a user
     *
     * @param int $userId
     * @return void
     */
    function createDefaultSettings($userId)
    {
        $defaults = defaultSettings();
        $settingsData = [];

        foreach ($defaults as $key => $value) {
            $settingsData[] = [
                'user_id' => $userId,
                'key' => $key,
                'value' => is_bool($value) ? ($value ? '1' : '0') : (string)$value,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        Setting::insert($settingsData);
    }
}

if (! function_exists('copySettingsFromSuperAdmin')) {
    /**
     * Copy system and brand settings from superadmin to company user
     *
     * @param int $companyUserId
     * @return void
     */
    function copySettingsFromSuperAdmin($companyUserId)
    {
        $superAdmin = User::where('type', 'superadmin')->first();
        if (!$superAdmin) {
            createDefaultSettings($companyUserId);
            return;
        }

        // Settings to copy from superadmin (system and brand settings only)
        $settingsToCopy = [
            'defaultLanguage',
            'dateFormat',
            'timeFormat',
            'calendarStartDay',
            'defaultTimezone',
            'emailVerification',
            'landingPageEnabled',
            'registrationEnabled',
            'logoDark',
            'logoLight',
            'favicon',
            'titleText',
            'footerText',
            'themeColor',
            'customColor',
            'sidebarVariant',
            'sidebarStyle',
            'layoutDirection',
            'themeMode'
        ];

        $superAdminSettings = Setting::where('user_id', $superAdmin->id)
            ->whereIn('key', $settingsToCopy)
            ->get();

        $settingsData = [];

        // Only copy existing superadmin settings
        foreach ($superAdminSettings as $setting) {
            $settingsData[] = [
                'user_id' => $companyUserId,
                'key' => $setting->key,
                'value' => $setting->value,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Override layoutDirection based on defaultLanguage (ar/he = right, others = left)
        $defaultLanguage = collect($superAdminSettings)->firstWhere('key', 'defaultLanguage');
        $rtlLanguages = ['ar', 'he'];
        $layoutDirection = ($defaultLanguage && in_array($defaultLanguage->value, $rtlLanguages)) ? 'right' : 'left';

        // Replace layoutDirection in settingsData if exists, else add it
        $found = false;
        foreach ($settingsData as &$row) {
            if ($row['key'] === 'layoutDirection') {
                $row['value'] = $layoutDirection;
                $found = true;
                break;
            }
        }
        unset($row);
        if (!$found) {
            $settingsData[] = [
                'user_id' => $companyUserId,
                'key' => 'layoutDirection',
                'value' => $layoutDirection,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        Setting::insertOrIgnore($settingsData);
    }
}

if (! function_exists('createdBy')) {
    function createdBy()
    {
        if (Auth::user()->type == 'superadmin') {
            return Auth::user()->id;
        } else if (Auth::user()->type == 'company') {
            return Auth::user()->id;
        } else {
            return  Auth::user()->created_by;
        }
    }
}

if (! function_exists('isEmailTemplateEnabled')) {
    /**
     * Check if an email template is enabled for a user
     *
     * @param string $templateName
     * @param int|null $userId
     * @return bool
     */
    function isEmailTemplateEnabled($templateName, $userId = null)
    {
        if (is_null($userId)) {
            $userId = createdBy();
        }

        $template = \App\Models\EmailTemplate::where('name', $templateName)->first();
        if (!$template) {
            return false;
        }

        $userTemplate = \App\Models\UserEmailTemplate::where('user_id', $userId)
            ->where('template_id', $template->id)
            ->first();

        return $userTemplate ? $userTemplate->is_active : true; // Default to true if no record exists
    }
}

if (!function_exists('parseBrowserData')) {
    function parseBrowserData(string $userAgent): array
    {
        $browser = 'Unknown';
        $os = 'Unknown';
        $deviceType = 'desktop';

        // Browser detection
        if (preg_match('/Chrome\/([0-9.]+)/', $userAgent)) {
            $browser = 'Chrome';
        } elseif (preg_match('/Firefox\/([0-9.]+)/', $userAgent)) {
            $browser = 'Firefox';
        } elseif (preg_match('/Safari\/([0-9.]+)/', $userAgent) && !preg_match('/Chrome/', $userAgent)) {
            $browser = 'Safari';
        } elseif (preg_match('/Edge\/([0-9.]+)/', $userAgent)) {
            $browser = 'Edge';
        }

        // OS detection
        if (preg_match('/Windows NT/', $userAgent)) {
            $os = 'Windows';
        } elseif (preg_match('/Mac OS X/', $userAgent)) {
            $os = 'macOS';
        } elseif (preg_match('/Linux/', $userAgent)) {
            $os = 'Linux';
        } elseif (preg_match('/Android/', $userAgent)) {
            $os = 'Android';
            $deviceType = 'mobile';
        } elseif (preg_match('/iPhone|iPad/', $userAgent)) {
            $os = 'iOS';
            $deviceType = preg_match('/iPad/', $userAgent) ? 'tablet' : 'mobile';
        }

        return [
            'browser_name' => $browser,
            'os_name' => $os,
            'browser_language' => 'en',
            'device_type' => $deviceType,
        ];
    }
}

if (! function_exists('IsDemo')) {
    function IsDemo()
    {
        if (config('app.is_demo')) {
            return true;
        } else {
            return false;
        }
    }
}

if (! function_exists('getEmailNotificationSettings')) {
    /**
     * Get email notification settings from user_email_templates table
     *
     * @param int|null $userId
     * @return array
     */
    function getEmailNotificationSettings($userId = null)
    {
        if (is_null($userId)) {
            if (auth()->user()->type === 'company') {
                $userId = auth()->id();
            } else {
                $userId = auth()->user()->created_by;
            }
        }

        $templateMap = [
            'New User' => 'email_notification_new_user',
            'New Customer' => 'email_notification_new_customer',
            'New Vendor' => 'email_notification_new_vendor',
            'New Branch' => 'email_notification_new_branch',
            'New Expense' => 'email_notification_new_expense',
            'New Purchase' => 'email_notification_new_purchase',
            'New Purchase Return' => 'email_notification_new_purchase_return',
            'New Quotation' => 'email_notification_new_quotation',
            'New Sale Return' => 'email_notification_new_sale_return'
        ];

        $settings = [];
        foreach ($templateMap as $templateName => $settingKey) {
            $template = \App\Models\EmailTemplate::where('name', $templateName)->first();
            if ($template) {
                $userTemplate = \App\Models\UserEmailTemplate::where('user_id', $userId)
                    ->where('template_id', $template->id)
                    ->first();
                $settings[$settingKey] = $userTemplate ? ($userTemplate->is_active ? '1' : '0') : '0';
            } else {
                $settings[$settingKey] = '0';
            }
        }

        return $settings;
    }
}

if (! function_exists('updateEmailNotificationSettings')) {
    /**
     * Update email notification settings in user_email_templates table
     *
     * @param array $settings
     * @param int|null $userId
     * @return void
     */
    function updateEmailNotificationSettings($settings, $userId = null)
    {
        if (is_null($userId)) {
            if (auth()->user()->type === 'company') {
                $userId = auth()->id();
            } else {
                $userId = auth()->user()->created_by;
            }
        }

        $templateMap = [
            'email_notification_new_user' => 'New User',
            'email_notification_new_customer' => 'New Customer',
            'email_notification_new_vendor' => 'New Vendor',
            'email_notification_new_branch' => 'New Branch',
            'email_notification_new_expense' => 'New Expense',
            'email_notification_new_purchase' => 'New Purchase',
            'email_notification_new_purchase_return' => 'New Purchase Return',
            'email_notification_new_quotation' => 'New Quotation',
            'email_notification_new_sale_return' => 'New Sale Return'
        ];

        foreach ($settings as $settingKey => $value) {
            if (isset($templateMap[$settingKey])) {
                $templateName = $templateMap[$settingKey];
                $template = \App\Models\EmailTemplate::where('name', $templateName)->first();

                if ($template) {
                    \App\Models\UserEmailTemplate::updateOrCreate(
                        [
                            'user_id' => $userId,
                            'template_id' => $template->id
                        ],
                        [
                            'is_active' => $value === '1' || $value === true
                        ]
                    );
                }
            }
        }
    }
}

if (! function_exists('isNotificationTemplateEnabled')) {
    /**
     * Check if a notification template is enabled for a user
     *
     * @param string $templateName
     * @param int|null $userId
     * @param string $type (slack, twilio)
     * @return bool
     */
    function isNotificationTemplateEnabled($templateName, $userId = null, $type)
    {
        if (is_null($userId)) {
            $userId = createdBy();
        }

        $template = \App\Models\NotificationTemplate::where('name', $templateName)
            ->where('type', $type)
            ->first();

        if (!$template) {
            return false;
        }

        $userTemplate = \App\Models\UserNotificationTemplate::where('user_id', $userId)
            ->where('template_id', $template->id)
            ->where('type', $type)
            ->first();

        return $userTemplate ? $userTemplate->is_active : false;
    }
}

if (!function_exists('isNotEditableRoles')) {
    function isNotEditableRoles()
    {
        return [
            'manager',
        ];
    }
}

if (!function_exists('isNotDeletableRoles')) {
    function isNotDeletableRoles()
    {
        return [
            'manager',
        ];
    }
}

if (!function_exists('getDemoCalendarEvents')) {
    function getDemoCalendarEvents()
    {
        $events = [];
        $eventId = 1;

        $posEvents = [
            ['title' => 'Sales Meeting', 'color' => '#3b82f6'],
            ['title' => 'Stock Audit', 'color' => '#f59e0b'],
            ['title' => 'Team Meeting', 'color' => '#10b77f'],
            ['title' => 'Customer Review', 'color' => '#ef4444'],
            ['title' => 'Inventory Check', 'color' => '#06b6d4'],
            ['title' => 'Product Launch', 'color' => '#8b5cf6'],
            ['title' => 'Supplier Meeting', 'color' => '#6366f1'],
            ['title' => 'Staff Training', 'color' => '#f97316'],
            ['title' => 'Sales Training', 'color' => '#84cc16'],
            ['title' => 'System Maintenance', 'color' => '#dc2626']
        ];

        $monthConfig = [
            '2025-12' => [3, 8, 12, 18, 19],
            '2026-01' => [5, 10, 15, 22],
            '2026-02' => [4, 9, 14, 20, 26],
            '2026-03' => [6, 11, 17, 23],
            '2026-04' => [2, 8, 13, 19, 27],
            '2026-05' => [1, 7, 12, 15, 18],
            '2026-06' => [3, 9, 15, 10],
            '2026-07' => [4, 10, 16, 22],
            '2026-08' => [5, 11, 17, 23, 29],
            '2026-09' => [2, 8, 15, 20],
            '2026-10' => [6, 12, 18, 24, 30],
            '2026-11' => [3, 9, 15, 19],
            '2026-12' => [4, 10, 16, 22, 11]
        ];

        $times = ['09:00', '10:30', '14:00', '15:30', '16:00'];

        foreach ($monthConfig as $month => $days) {
            $currentDate = Carbon::createFromFormat('Y-m', $month);

            foreach ($days as $index => $day) {
                $eventDate = $currentDate->copy()->day($day);
                $template = $posEvents[$index % count($posEvents)];

                $startDateTime = $eventDate->copy()->setTimeFromTimeString($times[$index % count($times)]);
                $endDateTime = $startDateTime->copy()->addHours(2);

                $events[] = [
                    'id' => $eventId++,
                    'title' => $template['title'],
                    'start' => $startDateTime->toISOString(),
                    'end' => $endDateTime->toISOString(),
                    'start_date' => $eventDate->format('Y-m-d'),
                    'end_date' => $eventDate->format('Y-m-d'),
                    'date' => $eventDate->format('Y-m-d'),
                    'time' => $times[$index % count($times)],
                    'description' => 'POS project event for business operations',
                    'color' => $template['color'],
                    'status' => $eventDate->isPast() ? 'completed' : 'scheduled',
                    'priority' => ['low', 'medium', 'high'],
                    'duration' => [60, 90, 120],
                    'location' => ['Office', 'Warehouse', 'Conference Room']
                ];
            }
        }

        return $events;
    }
}
// tax report static data for demo

if (!function_exists('getDemoTaxReportData')) {
    function getDemoTaxReportData($chartView = 'daily')
    {
        $taxValues   = [95, 106, 117, 95, 103, 103, 111, 101, 109, 99, 117, 105, 119, 102, 127, 113];
        $salesValues = [950, 1056, 1173, 945, 1026, 1032, 1113, 1007, 1087, 993, 1168, 1045, 1193, 1016, 1273, 1126];
        $variations  = [0.8, 1.2, 0.9, 1.1, 1.3, 0.85, 1.15, 1.25, 0.75, 1.18, 1.05, 1.35, 0.92, 1.08, 1.4, 1.02, 1.15, 0.88, 1.22, 1.12, 0.98, 1.28, 1.18, 1.03, 0.95, 1.32, 1.2, 1.08, 1.13, 1.0, 1.27];
        $dailyData   = [];
        $monthlyData = [];

        for ($m = 15; $m >= 0; $m--) {
            $month       = now()->subMonths($m)->format('Y-m');
            $idx         = 15 - $m;
            $daysInMonth = date('t', strtotime($month . '-01'));
            $monthTax    = 0;
            $monthSales  = 0;
            for ($day = 1; $day <= $daysInMonth; $day++) {
                $v = $variations[($day - 1) % count($variations)];
                $t = round($taxValues[$idx] * $v);
                $s = round($salesValues[$idx] * $v);
                $dailyData[] = [
                    'date'          => $month . '-' . str_pad($day, 2, '0', STR_PAD_LEFT),
                    'tax_collected' => $t,
                    'total_sales'   => $s,
                ];
                $monthTax   += $t;
                $monthSales += $s;
            }
            $monthlyData[] = [
                'date'          => $month,
                'tax_collected' => $monthTax,
                'total_sales'   => $monthSales,
            ];
        }

        return [
            'summary' => [
                'total_tax_collected' => 48575.05,
                'total_sales_amount'  => 485750.50,
                'avg_tax_rate'        => 10.0,
            ],
            'dailyTaxCollection' => $chartView === 'monthly' ? $monthlyData : $dailyData,
            'branches'      => [
                ['id' => 1, 'name' => 'Main Branch'],
                ['id' => 2, 'name' => 'Downtown Store'],
                ['id' => 3, 'name' => 'Mall Location'],
            ],
            'cashRegisters' => [
                ['id' => 1, 'name' => 'Register 1', 'branch' => ['id' => 1, 'name' => 'Main Branch']],
                ['id' => 2, 'name' => 'Register 2', 'branch' => ['id' => 1, 'name' => 'Main Branch']],
                ['id' => 3, 'name' => 'Register 1', 'branch' => ['id' => 2, 'name' => 'Downtown Store']],
            ],
        ];
    }
}
// purchase report static data for demo

if (!function_exists('getDemoPurchaseReportData')) {
    function getDemoPurchaseReportData($chartView = 'daily')
    {
        // Fixed daily data with different values for each day
        $dailyData = [];

        // Base values for different months
        $monthlyValues = [
            '2025-09' => ['amount' => 507, 'count' => 0],
            '2025-10' => ['amount' => 723, 'count' => 0],
            '2025-11' => ['amount' => 630, 'count' => 0],
            '2025-12' => ['amount' => 542, 'count' => 0],
            '2026-01' => ['amount' => 661, 'count' => 0],
            '2026-02' => ['amount' => 525, 'count' => 0],
            '2026-03' => ['amount' => 794, 'count' => 0],
            '2026-04' => ['amount' => 640, 'count' => 0],
            '2026-05' => ['amount' => 735, 'count' => 0],
            '2026-06' => ['amount' => 580, 'count' => 0],
            '2026-07' => ['amount' => 848, 'count' => 0],
            '2026-08' => ['amount' => 677, 'count' => 0],
            '2026-09' => ['amount' => 830, 'count' => 0],
            '2026-10' => ['amount' => 600, 'count' => 0],
            '2026-11' => ['amount' => 950, 'count' => 0],
            '2026-12' => ['amount' => 748, 'count' => 0]
        ];

        // Variation patterns for each day of month
        $variations = [0.8, 1.2, 0.9, 1.1, 1.3, 0.85, 1.15, 1.25, 0.75, 1.18, 1.05, 1.35, 0.92, 1.08, 1.4, 1.02, 1.15, 0.88, 1.22, 1.12, 0.98, 1.28, 1.18, 1.03, 0.95, 1.32, 1.2, 1.08, 1.13, 1.0, 1.27];
        $countVars = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

        foreach ($monthlyValues as $month => $config) {
            $daysInMonth = date('t', strtotime($month . '-01'));
            for ($day = 1; $day <= $daysInMonth; $day++) {
                $varIndex = ($day - 1) % count($variations);
                $dailyData[] = [
                    'month' => $month . '-' . str_pad($day, 2, '0', STR_PAD_LEFT),
                    'purchase_count' => $config['count'] + $countVars[$varIndex],
                    'total_amount' => round($config['amount'] * $variations[$varIndex])
                ];
            }
        }

        return [
            'summary' => [
                'total_purchases' => 156,
                'total_amount' => 290000.00,
                'avg_purchase_value' => 1858.97
            ],
            'purchases' => [
                ['id' => 1, 'purchase_number' => 'PO-2026-001', 'purchase_date' => '2026-12-20', 'total_amount' => 5500, 'status' => 'active', 'notes' => 'Office supplies order', 'vendor' => ['name' => 'ABC Supplies'], 'items' => [['quantity' => [10]],['product' => ['name' => 'Paper']]]],
                ['id' => 2, 'purchase_number' => 'PO-2026-002', 'purchase_date' => '2026-12-18', 'total_amount' => 3200, 'status' => 'inactive', 'notes' => 'Equipment purchase', 'vendor' => ['name' => 'XYZ Corp'], 'items' => [['quantity' => [50]],['product' => ['name' => 'Laptop']]]],
                ['id' => 3, 'purchase_number' => 'PO-2026-003', 'purchase_date' => '2026-12-15', 'total_amount' => 4800, 'status' => 'active', 'notes' => 'Software licenses', 'vendor' => ['name' => 'Tech Solutions'], 'items' => [['quantity' => [20]],['product' => ['name' => 'Software']]]]
            ],
            'monthlyTrend' => $chartView === 'monthly' ? [
                ['month' => '2025-09', 'purchase_count' => 8, 'total_amount' => 15200],
                ['month' => '2025-10', 'purchase_count' => 12, 'total_amount' => 22400],
                ['month' => '2025-11', 'purchase_count' => 10, 'total_amount' => 18900],
                ['month' => '2025-12', 'purchase_count' => 9, 'total_amount' => 16800],
                ['month' => '2026-01', 'purchase_count' => 11, 'total_amount' => 20500],
                ['month' => '2026-02', 'purchase_count' => 8, 'total_amount' => 14700],
                ['month' => '2026-03', 'purchase_count' => 13, 'total_amount' => 24600],
                ['month' => '2026-04', 'purchase_count' => 10, 'total_amount' => 19200],
                ['month' => '2026-05', 'purchase_count' => 12, 'total_amount' => 22800],
                ['month' => '2026-06', 'purchase_count' => 9, 'total_amount' => 17400],
                ['month' => '2026-07', 'purchase_count' => 14, 'total_amount' => 26300],
                ['month' => '2026-08', 'purchase_count' => 11, 'total_amount' => 21000],
                ['month' => '2026-09', 'purchase_count' => 13, 'total_amount' => 24900],
                ['month' => '2026-10', 'purchase_count' => 10, 'total_amount' => 18600],
                ['month' => '2026-11', 'purchase_count' => 15, 'total_amount' => 28500],
                ['month' => '2026-12', 'purchase_count' => 12, 'total_amount' => 23200]
            ] : $dailyData,
            'vendors' => [
                ['id' => 1, 'name' => 'ABC Supplies'],
                ['id' => 2, 'name' => 'XYZ Corp'],
                ['id' => 3, 'name' => 'Tech Solutions']
            ]
        ];
    }
}

// expense report static data for demo

if (!function_exists('getDemoExpenseReportData')) {
    function getDemoExpenseReportData($chartView = 'daily')
    {
        // Fixed daily data with different values for each day
        $dailyData = [];

        // Base values for different months
        $monthlyValues = [
            '2025-09' => ['amount' => 283, 'count' => 0],
            '2025-10' => ['amount' => 361, 'count' => 0],
            '2025-11' => ['amount' => 327, 'count' => 0],
            '2025-12' => ['amount' => 232, 'count' => 0],
            '2026-01' => ['amount' => 310, 'count' => 0],
            '2026-02' => ['amount' => 289, 'count' => 0],
            '2026-03' => ['amount' => 400, 'count' => 0],
            '2026-04' => ['amount' => 330, 'count' => 0],
            '2026-05' => ['amount' => 355, 'count' => 0],
            '2026-06' => ['amount' => 277, 'count' => 0],
            '2026-07' => ['amount' => 445, 'count' => 0],
            '2026-08' => ['amount' => 339, 'count' => 1],
            '2026-09' => ['amount' => 407, 'count' => 0],
            '2026-10' => ['amount' => 303, 'count' => 1],
            '2026-11' => ['amount' => 503, 'count' => 0],
            '2026-12' => ['amount' => 384, 'count' => 1]
        ];

        // Variation patterns for each day of month
        $variations = [1.2, 0.8, 1.5, 0.9, 1.1, 1.3, 0.85, 1.15, 1.25, 0.75, 1.18, 1.05, 1.35, 0.92, 1.08, 1.4, 1.02, 1.15, 0.88, 1.22, 1.12, 0.98, 1.28, 1.18, 1.03, 0.95, 1.32, 1.2, 1.08, 1.13, 1.0];
        $countVars = [0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0];

        foreach ($monthlyValues as $month => $config) {
            $daysInMonth = date('t', strtotime($month . '-01'));
            for ($day = 1; $day <= $daysInMonth; $day++) {
                $varIndex = ($day - 1) % count($variations);
                $dailyData[] = [
                    'month' => $month . '-' . str_pad($day, 2, '0', STR_PAD_LEFT),
                    'expense_count' => $config['count'] + $countVars[$varIndex],
                    'total_amount' => round($config['amount'] * $variations[$varIndex])
                ];
            }
        }

        return [
            'summary' => [
                'total_expenses' => 89,
                'total_amount' => 125000.00,
                'approved_amount' => 98000.00,
                'pending_amount' => 27000.00
            ],
            'expenses' => [
                ['id' => 1, 'title' => 'Office Supplies Purchase', 'expense_date' => '2026-12-20', 'amount' => 2500, 'status' => 'approved', 'description' => 'Monthly office supplies and stationery', 'expense_category' => ['name' => 'Office Supplies'], 'branch' => ['name' => 'Main Branch']],
                ['id' => 2, 'title' => 'Marketing Campaign', 'expense_date' => '2026-12-18', 'amount' => 1800, 'status' => 'pending', 'description' => 'Social media advertising campaign', 'expense_category' => ['name' => 'Marketing'], 'branch' => ['name' => 'Downtown Store']],
                ['id' => 3, 'title' => 'Utility Bills', 'expense_date' => '2026-12-15', 'amount' => 3200, 'status' => 'approved', 'description' => 'Electricity and water bills for December', 'expense_category' => ['name' => 'Utilities'], 'branch' => ['name' => 'Mall Location']]
            ],
            'categoryBreakdown' => [
                ['name' => 'Office Supplies', 'expense_count' => 25, 'total_amount' => 31250],
                ['name' => 'Marketing', 'expense_count' => 18, 'total_amount' => 35000],
                ['name' => 'Utilities', 'expense_count' => 15, 'total_amount' => 18750],
                ['name' => 'Rent', 'expense_count' => 12, 'total_amount' => 30000],
                ['name' => 'Other', 'expense_count' => 19, 'total_amount' => 10000]
            ],
            'monthlyTrend' => $chartView === 'monthly' ? [
                ['month' => '2025-09', 'expense_count' => 6, 'total_amount' => 8500],
                ['month' => '2025-10', 'expense_count' => 8, 'total_amount' => 11200],
                ['month' => '2025-11', 'expense_count' => 7, 'total_amount' => 9800],
                ['month' => '2025-12', 'expense_count' => 5, 'total_amount' => 7200],
                ['month' => '2026-01', 'expense_count' => 7, 'total_amount' => 9600],
                ['month' => '2026-02', 'expense_count' => 6, 'total_amount' => 8100],
                ['month' => '2026-03', 'expense_count' => 9, 'total_amount' => 12400],
                ['month' => '2026-04', 'expense_count' => 7, 'total_amount' => 9900],
                ['month' => '2026-05', 'expense_count' => 8, 'total_amount' => 11000],
                ['month' => '2026-06', 'expense_count' => 6, 'total_amount' => 8300],
                ['month' => '2026-07', 'expense_count' => 10, 'total_amount' => 13800],
                ['month' => '2026-08', 'expense_count' => 8, 'total_amount' => 10500],
                ['month' => '2026-09', 'expense_count' => 9, 'total_amount' => 12200],
                ['month' => '2026-10', 'expense_count' => 7, 'total_amount' => 9400],
                ['month' => '2026-11', 'expense_count' => 11, 'total_amount' => 15100],
                ['month' => '2026-12', 'expense_count' => 8, 'total_amount' => 11200]
            ] : $dailyData,
            'statusBreakdown' => [
                ['status' => 'approved', 'count' => 67, 'total' => 98000],
                ['status' => 'pending', 'count' => 22, 'total' => 27000]
            ],
            'categories' => [
                ['id' => 1, 'name' => 'Office Supplies'],
                ['id' => 2, 'name' => 'Marketing'],
                ['id' => 3, 'name' => 'Utilities']
            ],
            'branches' => [
                ['id' => 1, 'name' => 'Main Branch'],
                ['id' => 2, 'name' => 'Downtown Store'],
                ['id' => 3, 'name' => 'Mall Location']
            ]
        ];
    }
}

// vendor report static data for demo

if (!function_exists('getDemoVendorReportData')) {
    function getDemoVendorReportData($chartView = 'daily')
    {
        // Fixed daily data with different values for each day
        $dailyData = [];

        // Base values for different months
        $monthlyValues = [
            '2025-09' => ['base' => 500, 'orders' => 0],
            '2025-10' => ['base' => 565, 'orders' => 0],
            '2025-11' => ['base' => 630, 'orders' => 0],
            '2025-12' => ['base' => 453, 'orders' => 0],
            '2026-01' => ['base' => 661, 'orders' => 0],
            '2026-02' => ['base' => 525, 'orders' => 0],
            '2026-03' => ['base' => 794, 'orders' => 0],
            '2026-04' => ['base' => 640, 'orders' => 0],
            '2026-05' => ['base' => 735, 'orders' => 0],
            '2026-06' => ['base' => 580, 'orders' => 0],
            '2026-07' => ['base' => 848, 'orders' => 1],
            '2026-08' => ['base' => 677, 'orders' => 0],
            '2026-09' => ['base' => 830, 'orders' => 1],
            '2026-10' => ['base' => 600, 'orders' => 0],
            '2026-11' => ['base' => 950, 'orders' => 1],
            '2026-12' => ['base' => 750, 'orders' => 1]
        ];

        // Variation patterns for each day of month
        $variations = [0.8, 1.2, 0.9, 1.1, 1.3, 0.85, 1.15, 1.25, 0.75, 1.18, 1.05, 1.35, 0.92, 1.08, 1.4, 1.02, 1.15, 0.88, 1.22, 1.12, 0.98, 1.28, 1.18, 1.03, 0.95, 1.32, 1.2, 1.08, 1.13, 1.0, 1.27];
        $orderVars = [0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1];

        foreach ($monthlyValues as $month => $config) {
            $daysInMonth = date('t', strtotime($month . '-01'));
            for ($day = 1; $day <= $daysInMonth; $day++) {
                $varIndex = ($day - 1) % count($variations);
                $dailyData[] = [
                    'period' => $month . '-' . str_pad($day, 2, '0', STR_PAD_LEFT),
                    'total' => round($config['base'] * $variations[$varIndex]),
                    'orders' => $config['orders'] + $orderVars[$varIndex]
                ];
            }
        }

        return [
            'summary' => [
                'total_vendors' => 45,
                'total_purchase_amount' => 290000.00,
                'total_orders' => 156,
                'avg_order_value' => 1858.97
            ],
            'chartData' => $chartView === 'monthly' ? [
                ['period' => '2025-09', 'total' => 15200, 'orders' => 8],
                ['period' => '2025-10', 'total' => 22400, 'orders' => 12],
                ['period' => '2025-11', 'total' => 18900, 'orders' => 10],
                ['period' => '2025-12', 'total' => 16800, 'orders' => 9],
                ['period' => '2026-01', 'total' => 20500, 'orders' => 11],
                ['period' => '2026-02', 'total' => 14700, 'orders' => 8],
                ['period' => '2026-03', 'total' => 24600, 'orders' => 13],
                ['period' => '2026-04', 'total' => 19200, 'orders' => 10],
                ['period' => '2026-05', 'total' => 22800, 'orders' => 12],
                ['period' => '2026-06', 'total' => 17400, 'orders' => 9],
                ['period' => '2026-07', 'total' => 26300, 'orders' => 14],
                ['period' => '2026-08', 'total' => 21000, 'orders' => 11],
                ['period' => '2026-09', 'total' => 24900, 'orders' => 13],
                ['period' => '2026-10', 'total' => 18600, 'orders' => 10],
                ['period' => '2026-11', 'total' => 28500, 'orders' => 15],
                ['period' => '2026-12', 'total' => 23200, 'orders' => 12]
            ] : $dailyData,
            'topVendors' => [
                ['name' => 'ABC Supplies', 'email' => 'contact@abcsupplies.com', 'phone' => '+1234567890', 'total_orders' => 45, 'total_purchase_amount' => 89500, 'avg_order_value' => 1989, 'last_order_date' => '2026-12-20'],
                ['name' => 'XYZ Corp', 'email' => 'sales@xyzcorp.com', 'phone' => '+1234567891', 'total_orders' => 32, 'total_purchase_amount' => 67200, 'avg_order_value' => 2100, 'last_order_date' => '2026-12-18'],
                ['name' => 'Tech Solutions', 'email' => 'info@techsol.com', 'phone' => '+1234567892', 'total_orders' => 28, 'total_purchase_amount' => 58800, 'avg_order_value' => 2100, 'last_order_date' => '2026-12-15'],
                ['name' => 'Global Traders', 'email' => 'orders@globaltraders.com', 'phone' => '+1234567893', 'total_orders' => 25, 'total_purchase_amount' => 48750, 'avg_order_value' => 1950, 'last_order_date' => '2026-12-12'],
                ['name' => 'Prime Vendors', 'email' => 'contact@primevendors.com', 'phone' => '+1234567894', 'total_orders' => 26, 'total_purchase_amount' => 45500, 'avg_order_value' => 1750, 'last_order_date' => '2026-12-10']
            ],
            'vendors' => [
                ['id' => 1, 'name' => 'ABC Supplies'],
                ['id' => 2, 'name' => 'XYZ Corp'],
                ['id' => 3, 'name' => 'Tech Solutions'],
                ['id' => 4, 'name' => 'Global Traders'],
                ['id' => 5, 'name' => 'Prime Vendors']
            ]
        ];
    }
}
// customer analytics report static data for demo

if (!function_exists('getDemoCustomerAnalyticsData')) {
    function getDemoCustomerAnalyticsData($chartView = 'daily')
    {
        // Fixed daily data with different values for each day
        $dailyData = [];

        // Base values for different months
        $monthlyValues = [
            '2025-09' => 50,
            '2025-10' => 56,
            '2025-11' => 53,
            '2025-12' => 47,
            '2026-01' => 50,
            '2026-02' => 52,
            '2026-03' => 55,
            '2026-04' => 50,
            '2026-05' => 53,
            '2026-06' => 48,
            '2026-07' => 58,
            '2026-08' => 52,
            '2026-09' => 57,
            '2026-10' => 50,
            '2026-11' => 63,
            '2026-12' => 56
        ];

        // Variation patterns for each day of month
        $variations = [0.8, 1.2, 0.9, 1.1, 1.3, 0.85, 1.15, 1.25, 0.75, 1.18, 1.05, 1.35, 0.92, 1.08, 1.4, 1.02, 1.15, 0.88, 1.22, 1.12, 0.98, 1.28, 1.18, 1.03, 0.95, 1.32, 1.2, 1.08, 1.13, 1.0, 1.27];

        foreach ($monthlyValues as $month => $baseValue) {
            $daysInMonth = date('t', strtotime($month . '-01'));
            for ($day = 1; $day <= $daysInMonth; $day++) {
                $varIndex = ($day - 1) % count($variations);
                $dailyData[] = [
                    'date' => $month . '-' . str_pad($day, 2, '0', STR_PAD_LEFT),
                    'new_customers' => round($baseValue * $variations[$varIndex])
                ];
            }
        }

        return [
            'summary' => [
                'total_customers' => 1247,
                'new_customers' => 156,
                'repeat_customers' => 89
            ],
            'topCustomers' => [
                ['name' => 'John Smith', 'email' => 'john@example.com', 'phone' => '+1234567890', 'total_orders' => 25, 'total_spent' => 12500, 'avg_order_value' => 500],
                ['name' => 'Sarah Johnson', 'email' => 'sarah@example.com', 'phone' => '+1234567891', 'total_orders' => 18, 'total_spent' => 9800, 'avg_order_value' => 544],
                ['name' => 'Mike Wilson', 'email' => 'mike@example.com', 'phone' => '+1234567892', 'total_orders' => 22, 'total_spent' => 8900, 'avg_order_value' => 405],
                ['name' => 'Emily Davis', 'email' => 'emily@example.com', 'phone' => '+1234567893', 'total_orders' => 15, 'total_spent' => 7500, 'avg_order_value' => 500],
                ['name' => 'David Brown', 'email' => 'david@example.com', 'phone' => '+1234567894', 'total_orders' => 12, 'total_spent' => 6800, 'avg_order_value' => 567]
            ],
            'customerAcquisition' => $chartView === 'monthly' ? [
                ['date' => '2025-09', 'new_customers' => 12],
                ['date' => '2025-10', 'new_customers' => 15],
                ['date' => '2025-11', 'new_customers' => 18],
                ['date' => '2025-12', 'new_customers' => 14],
                ['date' => '2026-01', 'new_customers' => 16],
                ['date' => '2026-02', 'new_customers' => 13],
                ['date' => '2026-03', 'new_customers' => 19],
                ['date' => '2026-04', 'new_customers' => 17],
                ['date' => '2026-05', 'new_customers' => 20],
                ['date' => '2026-06', 'new_customers' => 15],
                ['date' => '2026-07', 'new_customers' => 22],
                ['date' => '2026-08', 'new_customers' => 18],
                ['date' => '2026-09', 'new_customers' => 21],
                ['date' => '2026-10', 'new_customers' => 16],
                ['date' => '2026-11', 'new_customers' => 24],
                ['date' => '2026-12', 'new_customers' => 19]
            ] : $dailyData
        ];
    }
}

// financial report static data for demo

if (!function_exists('getDemoFinancialReportData')) {
    function getDemoFinancialReportData($chartView = 'daily')
    {
        // Fixed daily data with different values for each day
        $dailyData = [];

        // September 2025 - 30 days
        $sep2025 = [950, 1200, 875, 1150, 1320, 980, 1100, 1250, 890, 1180, 1050, 1300, 920, 1080, 1400, 1020, 1150, 850, 1250, 1100, 980, 1350, 1050, 1200, 900, 1180, 1320, 950, 1100, 1250];
        $sepTrans = [3, 4, 2, 3, 4, 3, 3, 4, 2, 3, 3, 4, 3, 3, 4, 3, 3, 2, 4, 3, 3, 4, 3, 4, 2, 3, 4, 3, 3, 4];

        // October 2025 - 31 days
        $oct2025 = [1056, 1200, 980, 1350, 1150, 1020, 1280, 950, 1180, 1320, 1050, 1250, 890, 1150, 1400, 1080, 1200, 950, 1300, 1120, 980, 1250, 1180, 1050, 920, 1350, 1200, 1080, 1150, 1020, 1280];
        $octTrans = [4, 4, 3, 4, 3, 3, 4, 3, 3, 4, 3, 4, 2, 3, 4, 3, 4, 3, 4, 3, 3, 4, 3, 3, 3, 4, 4, 3, 3, 3, 4];

        // November 2025 - 30 days
        $nov2025 = [1173, 1350, 1050, 1280, 950, 1200, 1400, 1080, 1250, 920, 1180, 1320, 1050, 1150, 890, 1300, 1200, 980, 1250, 1120, 1050, 1350, 1180, 950, 1280, 1200, 1080, 1150, 1020, 1250];
        $novTrans = [4, 4, 3, 4, 3, 4, 4, 3, 4, 3, 3, 4, 3, 3, 2, 4, 4, 3, 4, 3, 3, 4, 3, 3, 4, 4, 3, 3, 3, 4];

        // December 2025 - 31 days
        $dec2025 = [945, 1150, 890, 1200, 1320, 980, 1250, 1050, 1180, 920, 1300, 1120, 950, 1280, 1200, 1050, 1350, 890, 1180, 1250, 1020, 1150, 980, 1320, 1200, 1080, 1250, 950, 1180, 1300, 1050];
        $decTrans = [3, 3, 2, 4, 4, 3, 4, 3, 3, 3, 4, 3, 3, 4, 4, 3, 4, 2, 3, 4, 3, 3, 3, 4, 4, 3, 4, 3, 3, 4, 3];

        // 2026 data
        $jan2026 = [1026, 1200, 950, 1350, 1180, 1050, 1280, 920, 1250, 1120, 980, 1300, 1150, 1020, 1400, 1080, 1200, 950, 1250, 1180, 1050, 1320, 1200, 980, 1150, 1280, 1050, 1200, 920, 1350, 1180];
        $janTrans = [3, 4, 3, 4, 3, 3, 4, 3, 4, 3, 3, 4, 3, 3, 4, 3, 4, 3, 4, 3, 3, 4, 4, 3, 3, 4, 3, 4, 3, 4, 3];

        $feb2026 = [1032, 1180, 920, 1300, 1150, 980, 1250, 1080, 1200, 950, 1350, 1120, 1050, 1280, 1200, 980, 1150, 1320, 1050, 1250, 920, 1180, 1300, 1080, 1200, 950, 1250, 1150];
        $febTrans = [3, 3, 3, 4, 3, 3, 4, 3, 4, 3, 4, 3, 3, 4, 4, 3, 3, 4, 3, 4, 3, 3, 4, 3, 4, 3, 4, 3];

        $months = [
            '2025-09' => ['values' => $sep2025, 'trans' => $sepTrans],
            '2025-10' => ['values' => $oct2025, 'trans' => $octTrans],
            '2025-11' => ['values' => $nov2025, 'trans' => $novTrans],
            '2025-12' => ['values' => $dec2025, 'trans' => $decTrans],
            '2026-01' => ['values' => $jan2026, 'trans' => $janTrans],
            '2026-02' => ['values' => $feb2026, 'trans' => $febTrans]
        ];

        // Continue with remaining months using pattern variations
        $baseValues = [1113, 1350, 1080, 1250, 980, 1200, 1400, 1120, 1280, 950, 1180, 1320, 1050, 1250, 920, 1300, 1200, 1080, 1350, 1150, 1020, 1280, 1200, 980, 1250, 1180, 1050, 1320, 1200, 950, 1280];
        $baseTrans = [4, 4, 3, 4, 3, 4, 4, 3, 4, 3, 3, 4, 3, 4, 3, 4, 4, 3, 4, 3, 3, 4, 4, 3, 4, 3, 3, 4, 4, 3, 4];

        $remaining = [
            '2026-03' => ['mult' => 1.0, 'days' => 31],
            '2026-04' => ['mult' => 0.9, 'days' => 30],
            '2026-05' => ['mult' => 1.1, 'days' => 31],
            '2026-06' => ['mult' => 0.95, 'days' => 30],
            '2026-07' => ['mult' => 1.15, 'days' => 31],
            '2026-08' => ['mult' => 1.05, 'days' => 31],
            '2026-09' => ['mult' => 1.2, 'days' => 30],
            '2026-10' => ['mult' => 1.0, 'days' => 31],
            '2026-11' => ['mult' => 1.25, 'days' => 30],
            '2026-12' => ['mult' => 1.1, 'days' => 31]
        ];

        foreach ($remaining as $month => $config) {
            $values = [];
            $trans = [];
            for ($i = 0; $i < $config['days']; $i++) {
                $values[] = round($baseValues[$i] * $config['mult']);
                $trans[] = $baseTrans[$i];
            }
            $months[$month] = ['values' => $values, 'trans' => $trans];
        }

        foreach ($months as $month => $data) {
            foreach ($data['values'] as $index => $value) {
                $day = $index + 1;
                $dailyData[] = [
                    'month' => $month . '-' . str_pad($day, 2, '0', STR_PAD_LEFT),
                    'revenue' => $value,
                    'transactions' => $data['trans'][$index]
                ];
            }
        }

        return [
            'summary' => [
                'total_revenue' => 485750.50,
                'total_expenses' => 125000.00,
                'purchase_costs' => 290000.00,
                'gross_profit' => 195750.50,
                'net_profit' => 70750.50,
                'profit_margin' => 14.57,
                'total_tax' => 48575.05,
                'total_discount' => 24287.53
            ],
            'monthlyData' => $chartView === 'monthly' ? [
                ['month' => '2025-09', 'revenue' => 28500, 'transactions' => 95],
                ['month' => '2025-10', 'revenue' => 32750, 'transactions' => 109],
                ['month' => '2025-11', 'revenue' => 35200, 'transactions' => 117],
                ['month' => '2025-12', 'revenue' => 29300, 'transactions' => 98],
                ['month' => '2026-01', 'revenue' => 31800, 'transactions' => 106],
                ['month' => '2026-02', 'revenue' => 28900, 'transactions' => 96],
                ['month' => '2026-03', 'revenue' => 34500, 'transactions' => 115],
                ['month' => '2026-04', 'revenue' => 30200, 'transactions' => 101],
                ['month' => '2026-05', 'revenue' => 33700, 'transactions' => 112],
                ['month' => '2026-06', 'revenue' => 29800, 'transactions' => 99],
                ['month' => '2026-07', 'revenue' => 36200, 'transactions' => 121],
                ['month' => '2026-08', 'revenue' => 32400, 'transactions' => 108],
                ['month' => '2026-09', 'revenue' => 35800, 'transactions' => 119],
                ['month' => '2026-10', 'revenue' => 31500, 'transactions' => 105],
                ['month' => '2026-11', 'revenue' => 38200, 'transactions' => 127],
                ['month' => '2026-12', 'revenue' => 34900, 'transactions' => 116]
            ] : $dailyData,
            'expensesByCategory' => [
                ['name' => 'Office Supplies', 'total' => 25000.00],
                ['name' => 'Marketing', 'total' => 35000.00],
                ['name' => 'Utilities', 'total' => 15000.00],
                ['name' => 'Rent', 'total' => 30000.00],
                ['name' => 'Other', 'total' => 20000.00]
            ],
            'branches' => [
                ['id' => 1, 'name' => 'Main Branch'],
                ['id' => 2, 'name' => 'Downtown Store'],
                ['id' => 3, 'name' => 'Mall Location']
            ]
        ];
    }
}
// Sale report static data for demo

if (!function_exists('getDemoSalesReportData')) {
    function getDemoSalesReportData($chartView = 'daily')
    {
        // Fixed daily values for each month - these won't change on refresh
        $dailyData = array_merge(
            // September 2025 - 30 days
            [['period' => '2025-09-01', 'total' => 950, 'transactions' => 8], ['period' => '2025-09-02', 'total' => 1200, 'transactions' => 12], ['period' => '2025-09-03', 'total' => 875, 'transactions' => 7], ['period' => '2025-09-04', 'total' => 1150, 'transactions' => 9], ['period' => '2025-09-05', 'total' => 1320, 'transactions' => 11], ['period' => '2025-09-06', 'total' => 980, 'transactions' => 8], ['period' => '2025-09-07', 'total' => 1100, 'transactions' => 10], ['period' => '2025-09-08', 'total' => 1250, 'transactions' => 13], ['period' => '2025-09-09', 'total' => 890, 'transactions' => 6], ['period' => '2025-09-10', 'total' => 1180, 'transactions' => 9], ['period' => '2025-09-11', 'total' => 1050, 'transactions' => 8], ['period' => '2025-09-12', 'total' => 1300, 'transactions' => 14], ['period' => '2025-09-13', 'total' => 920, 'transactions' => 7], ['period' => '2025-09-14', 'total' => 1220, 'transactions' => 11], ['period' => '2025-09-15', 'total' => 1080, 'transactions' => 9], ['period' => '2025-09-16', 'total' => 1350, 'transactions' => 15], ['period' => '2025-09-17', 'total' => 940, 'transactions' => 8], ['period' => '2025-09-18', 'total' => 1160, 'transactions' => 10], ['period' => '2025-09-19', 'total' => 1280, 'transactions' => 12], ['period' => '2025-09-20', 'total' => 1020, 'transactions' => 9], ['period' => '2025-09-21', 'total' => 1190, 'transactions' => 11], ['period' => '2025-09-22', 'total' => 960, 'transactions' => 7], ['period' => '2025-09-23', 'total' => 1240, 'transactions' => 13], ['period' => '2025-09-24', 'total' => 1110, 'transactions' => 10], ['period' => '2025-09-25', 'total' => 1380, 'transactions' => 16], ['period' => '2025-09-26', 'total' => 900, 'transactions' => 6], ['period' => '2025-09-27', 'total' => 1170, 'transactions' => 9], ['period' => '2025-09-28', 'total' => 1260, 'transactions' => 12], ['period' => '2025-09-29', 'total' => 1040, 'transactions' => 8], ['period' => '2025-09-30', 'total' => 1200, 'transactions' => 10]],
            // October 2025 - 31 days
            [['period' => '2025-10-01', 'total' => 1100, 'transactions' => 9], ['period' => '2025-10-02', 'total' => 1350, 'transactions' => 14], ['period' => '2025-10-03', 'total' => 980, 'transactions' => 8], ['period' => '2025-10-04', 'total' => 1250, 'transactions' => 11], ['period' => '2025-10-05', 'total' => 1420, 'transactions' => 15], ['period' => '2025-10-06', 'total' => 1080, 'transactions' => 9], ['period' => '2025-10-07', 'total' => 1200, 'transactions' => 12], ['period' => '2025-10-08', 'total' => 1380, 'transactions' => 16], ['period' => '2025-10-09', 'total' => 950, 'transactions' => 7], ['period' => '2025-10-10', 'total' => 1280, 'transactions' => 13], ['period' => '2025-10-11', 'total' => 1150, 'transactions' => 10], ['period' => '2025-10-12', 'total' => 1400, 'transactions' => 17], ['period' => '2025-10-13', 'total' => 1020, 'transactions' => 8], ['period' => '2025-10-14', 'total' => 1320, 'transactions' => 14], ['period' => '2025-10-15', 'total' => 1180, 'transactions' => 11], ['period' => '2025-10-16', 'total' => 1450, 'transactions' => 18], ['period' => '2025-10-17', 'total' => 1040, 'transactions' => 9], ['period' => '2025-10-18', 'total' => 1260, 'transactions' => 12], ['period' => '2025-10-19', 'total' => 1380, 'transactions' => 15], ['period' => '2025-10-20', 'total' => 1120, 'transactions' => 10], ['period' => '2025-10-21', 'total' => 1290, 'transactions' => 13], ['period' => '2025-10-22', 'total' => 1060, 'transactions' => 8], ['period' => '2025-10-23', 'total' => 1340, 'transactions' => 16], ['period' => '2025-10-24', 'total' => 1210, 'transactions' => 11], ['period' => '2025-10-25', 'total' => 1480, 'transactions' => 19], ['period' => '2025-10-26', 'total' => 1000, 'transactions' => 7], ['period' => '2025-10-27', 'total' => 1270, 'transactions' => 12], ['period' => '2025-10-28', 'total' => 1360, 'transactions' => 14], ['period' => '2025-10-29', 'total' => 1140, 'transactions' => 9], ['period' => '2025-10-30', 'total' => 1300, 'transactions' => 13], ['period' => '2025-10-31', 'total' => 1220, 'transactions' => 10]],
            // November 2025 - 30 days
            [['period' => '2025-11-01', 'total' => 1200, 'transactions' => 10], ['period' => '2025-11-02', 'total' => 1450, 'transactions' => 16], ['period' => '2025-11-03', 'total' => 1080, 'transactions' => 9], ['period' => '2025-11-04', 'total' => 1350, 'transactions' => 13], ['period' => '2025-11-05', 'total' => 1520, 'transactions' => 18], ['period' => '2025-11-06', 'total' => 1180, 'transactions' => 11], ['period' => '2025-11-07', 'total' => 1300, 'transactions' => 14], ['period' => '2025-11-08', 'total' => 1480, 'transactions' => 19], ['period' => '2025-11-09', 'total' => 1050, 'transactions' => 8], ['period' => '2025-11-10', 'total' => 1380, 'transactions' => 15], ['period' => '2025-11-11', 'total' => 1250, 'transactions' => 12], ['period' => '2025-11-12', 'total' => 1500, 'transactions' => 20], ['period' => '2025-11-13', 'total' => 1120, 'transactions' => 9], ['period' => '2025-11-14', 'total' => 1420, 'transactions' => 16], ['period' => '2025-11-15', 'total' => 1280, 'transactions' => 13], ['period' => '2025-11-16', 'total' => 1550, 'transactions' => 21], ['period' => '2025-11-17', 'total' => 1140, 'transactions' => 10], ['period' => '2025-11-18', 'total' => 1360, 'transactions' => 14], ['period' => '2025-11-19', 'total' => 1480, 'transactions' => 17], ['period' => '2025-11-20', 'total' => 1220, 'transactions' => 11], ['period' => '2025-11-21', 'total' => 1390, 'transactions' => 15], ['period' => '2025-11-22', 'total' => 1160, 'transactions' => 9], ['period' => '2025-11-23', 'total' => 1440, 'transactions' => 18], ['period' => '2025-11-24', 'total' => 1310, 'transactions' => 13], ['period' => '2025-11-25', 'total' => 1580, 'transactions' => 22], ['period' => '2025-11-26', 'total' => 1100, 'transactions' => 8], ['period' => '2025-11-27', 'total' => 1370, 'transactions' => 14], ['period' => '2025-11-28', 'total' => 1460, 'transactions' => 16], ['period' => '2025-11-29', 'total' => 1240, 'transactions' => 11], ['period' => '2025-11-30', 'total' => 1400, 'transactions' => 15]],
            // December 2025 - 31 days
            [['period' => '2025-12-01', 'total' => 1050, 'transactions' => 8], ['period' => '2025-12-02', 'total' => 1300, 'transactions' => 12], ['period' => '2025-12-03', 'total' => 980, 'transactions' => 7], ['period' => '2025-12-04', 'total' => 1200, 'transactions' => 10], ['period' => '2025-12-05', 'total' => 1370, 'transactions' => 14], ['period' => '2025-12-06', 'total' => 1030, 'transactions' => 8], ['period' => '2025-12-07', 'total' => 1150, 'transactions' => 11], ['period' => '2025-12-08', 'total' => 1330, 'transactions' => 15], ['period' => '2025-12-09', 'total' => 900, 'transactions' => 6], ['period' => '2025-12-10', 'total' => 1230, 'transactions' => 12], ['period' => '2025-12-11', 'total' => 1100, 'transactions' => 9], ['period' => '2025-12-12', 'total' => 1350, 'transactions' => 16], ['period' => '2025-12-13', 'total' => 970, 'transactions' => 7], ['period' => '2025-12-14', 'total' => 1270, 'transactions' => 13], ['period' => '2025-12-15', 'total' => 1130, 'transactions' => 10], ['period' => '2025-12-16', 'total' => 1400, 'transactions' => 17], ['period' => '2025-12-17', 'total' => 990, 'transactions' => 8], ['period' => '2025-12-18', 'total' => 1210, 'transactions' => 11], ['period' => '2025-12-19', 'total' => 1330, 'transactions' => 14], ['period' => '2025-12-20', 'total' => 1070, 'transactions' => 9], ['period' => '2025-12-21', 'total' => 1240, 'transactions' => 12], ['period' => '2025-12-22', 'total' => 1010, 'transactions' => 7], ['period' => '2025-12-23', 'total' => 1290, 'transactions' => 15], ['period' => '2025-12-24', 'total' => 1160, 'transactions' => 10], ['period' => '2025-12-25', 'total' => 1430, 'transactions' => 18], ['period' => '2025-12-26', 'total' => 950, 'transactions' => 6], ['period' => '2025-12-27', 'total' => 1220, 'transactions' => 11], ['period' => '2025-12-28', 'total' => 1310, 'transactions' => 13], ['period' => '2025-12-29', 'total' => 1090, 'transactions' => 8], ['period' => '2025-12-30', 'total' => 1250, 'transactions' => 12], ['period' => '2025-12-31', 'total' => 1170, 'transactions' => 9]],
            // 2026 data
            array_map(fn($day) => ['period' => "2026-01-" . str_pad($day, 2, '0', STR_PAD_LEFT), 'total' => 1175 + ($day * 15), 'transactions' => 6 + ($day % 8)], range(1, 31)),
            array_map(fn($day) => ['period' => "2026-02-" . str_pad($day, 2, '0', STR_PAD_LEFT), 'total' => 1125 + ($day * 12), 'transactions' => 4 + ($day % 7)], range(1, 28)),
            array_map(fn($day) => ['period' => "2026-03-" . str_pad($day, 2, '0', STR_PAD_LEFT), 'total' => 1275 + ($day * 18), 'transactions' => 5 + ($day % 9)], range(1, 31)),
            array_map(fn($day) => ['period' => "2026-04-" . str_pad($day, 2, '0', STR_PAD_LEFT), 'total' => 1200 + ($day * 14), 'transactions' => 7 + ($day % 6)], range(1, 30)),
            array_map(fn($day) => ['period' => "2026-05-" . str_pad($day, 2, '0', STR_PAD_LEFT), 'total' => 1250 + ($day * 16), 'transactions' => 9 + ($day % 8)], range(1, 31)),
            array_map(fn($day) => ['period' => "2026-06-" . str_pad($day, 2, '0', STR_PAD_LEFT), 'total' => 1175 + ($day * 13), 'transactions' => 4 + ($day % 7)], range(1, 30)),
            array_map(fn($day) => ['period' => "2026-07-" . str_pad($day, 2, '0', STR_PAD_LEFT), 'total' => 1325 + ($day * 17), 'transactions' => 7 + ($day % 9)], range(1, 31)),
            array_map(fn($day) => ['period' => "2026-08-" . str_pad($day, 2, '0', STR_PAD_LEFT), 'total' => 1250 + ($day * 15), 'transactions' => 9 + ($day % 8)], range(1, 31)),
            array_map(fn($day) => ['period' => "2026-09-" . str_pad($day, 2, '0', STR_PAD_LEFT), 'total' => 1300 + ($day * 19), 'transactions' => 8 + ($day % 7)], range(1, 30)),
            array_map(fn($day) => ['period' => "2026-10-" . str_pad($day, 2, '0', STR_PAD_LEFT), 'total' => 1225 + ($day * 14), 'transactions' => 1 + ($day % 10)], range(1, 31)),
            array_map(fn($day) => ['period' => "2026-11-" . str_pad($day, 2, '0', STR_PAD_LEFT), 'total' => 1375 + ($day * 20), 'transactions' => 9 + ($day % 8)], range(1, 30)),
            array_map(fn($day) => ['period' => "2026-12-" . str_pad($day, 2, '0', STR_PAD_LEFT), 'total' => 1300 + ($day * 16), 'transactions' => 2 + ($day % 9)], range(1, 31))
        );

        return [
            'summary' => [
                'total_sales' => 485750.50,
                'total_transactions' => 1247,
                'avg_transaction_value' => 389.64
            ],
            'chartData' => $chartView === 'monthly' ? [
                ['period' => '2025-09', 'total' => 28500, 'transactions' => 95],
                ['period' => '2025-10', 'total' => 32750, 'transactions' => 109],
                ['period' => '2025-11', 'total' => 35200, 'transactions' => 117],
                ['period' => '2025-12', 'total' => 29300, 'transactions' => 98],
                ['period' => '2026-01', 'total' => 31800, 'transactions' => 106],
                ['period' => '2026-02', 'total' => 28900, 'transactions' => 96],
                ['period' => '2026-03', 'total' => 34500, 'transactions' => 115],
                ['period' => '2026-04', 'total' => 30200, 'transactions' => 101],
                ['period' => '2026-05', 'total' => 33700, 'transactions' => 112],
                ['period' => '2026-06', 'total' => 29800, 'transactions' => 99],
                ['period' => '2026-07', 'total' => 36200, 'transactions' => 121],
                ['period' => '2026-08', 'total' => 32400, 'transactions' => 108],
                ['period' => '2026-09', 'total' => 35800, 'transactions' => 119],
                ['period' => '2026-10', 'total' => 31500, 'transactions' => 105],
                ['period' => '2026-11', 'total' => 38200, 'transactions' => 127],
                ['period' => '2026-12', 'total' => 34900, 'transactions' => 116]
            ] : $dailyData,
            'topProducts' => [
                ['name' => 'Wireless Headphones', 'total_quantity' => 145, 'total_revenue' => 43500],
                ['name' => 'Smartphone Case', 'total_quantity' => 278, 'total_revenue' => 8340],
                ['name' => 'Bluetooth Speaker', 'total_quantity' => 132, 'total_revenue' => 39600],
                ['name' => 'USB Cable', 'total_quantity' => 456, 'total_revenue' => 4560],
                ['name' => 'Power Bank', 'total_quantity' => 128, 'total_revenue' => 38400]
            ],
            'branches' => [
                ['id' => 1, 'name' => 'Main Branch'],
                ['id' => 2, 'name' => 'Downtown Store'],
                ['id' => 3, 'name' => 'Mall Location']
            ],
            'cashRegisters' => [
                ['id' => 1, 'name' => 'Register 1', 'branch' => ['id' => 1, 'name' => 'Main Branch']],
                ['id' => 2, 'name' => 'Register 2', 'branch' => ['id' => 1, 'name' => 'Main Branch']],
                ['id' => 3, 'name' => 'Register 1', 'branch' => ['id' => 2, 'name' => 'Downtown Store']]
            ],
            'customers' => [
                ['id' => 1, 'name' => 'John Smith'],
                ['id' => 2, 'name' => 'Sarah Johnson'],
                ['id' => 3, 'name' => 'Mike Wilson']
            ]
        ];
    }
}

if (! function_exists('getDemoInventoryReportData')) {
    function getDemoInventoryReportData()
    {
        return [
            'summary' => [
                'total_products'      => 120,
                'total_stock_value'   => 184500.00,
                'low_stock_items'     => 14,
                'out_of_stock_items'  => 6,
            ],
            'products' => [
                ['name' => 'Wireless Headphones', 'sku' => 'SKU-001', 'stock_quantity' => 45,  'min_stock_level' => 10, 'purchase_price' => 120.00, 'category' => ['name' => 'Electronics'],  'brand' => ['name' => 'TechPro'],   'unit' => ['name' => 'pcs']],
                ['name' => 'Bluetooth Speaker',   'sku' => 'SKU-002', 'stock_quantity' => 30,  'min_stock_level' => 8,  'purchase_price' => 95.00,  'category' => ['name' => 'Electronics'],  'brand' => ['name' => 'SoundMax'],  'unit' => ['name' => 'pcs']],
                ['name' => 'Power Bank',          'sku' => 'SKU-003', 'stock_quantity' => 60,  'min_stock_level' => 15, 'purchase_price' => 85.00,  'category' => ['name' => 'Accessories'], 'brand' => ['name' => 'PowerEdge'], 'unit' => ['name' => 'pcs']],
                ['name' => 'Smart Watch',         'sku' => 'SKU-004', 'stock_quantity' => 20,  'min_stock_level' => 5,  'purchase_price' => 150.00, 'category' => ['name' => 'Electronics'],  'brand' => ['name' => 'TechPro'],   'unit' => ['name' => 'pcs']],
                ['name' => 'USB-C Hub',           'sku' => 'SKU-005', 'stock_quantity' => 8,   'min_stock_level' => 10, 'purchase_price' => 35.00,  'category' => ['name' => 'Accessories'], 'brand' => ['name' => 'TechPro'],   'unit' => ['name' => 'pcs']],
                ['name' => 'Laptop Stand',        'sku' => 'SKU-006', 'stock_quantity' => 55,  'min_stock_level' => 10, 'purchase_price' => 45.00,  'category' => ['name' => 'Peripherals'], 'brand' => ['name' => 'PowerEdge'], 'unit' => ['name' => 'pcs']],
                ['name' => 'Mechanical Keyboard', 'sku' => 'SKU-007', 'stock_quantity' => 35,  'min_stock_level' => 8,  'purchase_price' => 75.00,  'category' => ['name' => 'Peripherals'], 'brand' => ['name' => 'TechPro'],   'unit' => ['name' => 'pcs']],
                ['name' => 'Webcam HD',           'sku' => 'SKU-008', 'stock_quantity' => 0,   'min_stock_level' => 5,  'purchase_price' => 60.00,  'category' => ['name' => 'Peripherals'], 'brand' => ['name' => 'SoundMax'],  'unit' => ['name' => 'pcs']],
                ['name' => 'Smartphone Case',     'sku' => 'SKU-009', 'stock_quantity' => 120, 'min_stock_level' => 20, 'purchase_price' => 12.00,  'category' => ['name' => 'Accessories'], 'brand' => ['name' => 'PowerEdge'], 'unit' => ['name' => 'pcs']],
                ['name' => 'USB Cable',           'sku' => 'SKU-010', 'stock_quantity' => 200, 'min_stock_level' => 30, 'purchase_price' => 5.00,   'category' => ['name' => 'Accessories'], 'brand' => ['name' => 'TechPro'],   'unit' => ['name' => 'pcs']],
                ['name' => 'Noise Cancelling Earbuds', 'sku' => 'SKU-011', 'stock_quantity' => 0, 'min_stock_level' => 8, 'purchase_price' => 110.00, 'category' => ['name' => 'Electronics'], 'brand' => ['name' => 'SoundMax'], 'unit' => ['name' => 'pcs']],
                ['name' => 'Monitor Arm',         'sku' => 'SKU-012', 'stock_quantity' => 5,   'min_stock_level' => 6,  'purchase_price' => 55.00,  'category' => ['name' => 'Peripherals'], 'brand' => ['name' => 'PowerEdge'], 'unit' => ['name' => 'pcs']],
            ],
            'topSellingProducts' => [
                ['name' => 'Wireless Headphones', 'sku' => 'SKU-001', 'total_sold' => 145, 'total_revenue' => 43500],
                ['name' => 'Bluetooth Speaker',   'sku' => 'SKU-002', 'total_sold' => 132, 'total_revenue' => 39600],
                ['name' => 'Power Bank',          'sku' => 'SKU-003', 'total_sold' => 128, 'total_revenue' => 38400],
                ['name' => 'Smart Watch',         'sku' => 'SKU-004', 'total_sold' => 115, 'total_revenue' => 34500],
                ['name' => 'USB-C Hub',           'sku' => 'SKU-005', 'total_sold' => 310, 'total_revenue' => 15500],
                ['name' => 'Laptop Stand',        'sku' => 'SKU-006', 'total_sold' => 98,  'total_revenue' => 14700],
                ['name' => 'Mechanical Keyboard', 'sku' => 'SKU-007', 'total_sold' => 87,  'total_revenue' => 13050],
                ['name' => 'Webcam HD',           'sku' => 'SKU-008', 'total_sold' => 76,  'total_revenue' => 11400],
                ['name' => 'Smartphone Case',     'sku' => 'SKU-009', 'total_sold' => 278, 'total_revenue' => 8340],
                ['name' => 'USB Cable',           'sku' => 'SKU-010', 'total_sold' => 456, 'total_revenue' => 4560],
            ],
            'categories' => [
                ['id' => 1, 'name' => 'Electronics'],
                ['id' => 2, 'name' => 'Accessories'],
                ['id' => 3, 'name' => 'Peripherals'],
            ],
            'brands' => [
                ['id' => 1, 'name' => 'TechPro'],
                ['id' => 2, 'name' => 'SoundMax'],
                ['id' => 3, 'name' => 'PowerEdge'],
            ],
        ];
    }
}

if (! function_exists('getAdminAllSetting')) {
    function getAdminAllSetting()
    {
        // Laravel cache
        return Cache::rememberForever('admin_settings', function () {
            $superAdmin = User::where('type', 'superadmin')->first();
            $settings = [];
            if ($superAdmin) {
                $settings = Setting::where('user_id', $superAdmin->id)->pluck('value', 'key')->toArray();
            }

            return $settings;
        });
    }
}
    if (! function_exists('upload_file')) {
    function upload_file($request, $key_name, $name, $path, $custom_validation = [])
    {
        try {
            $storage_settings = getAdminAllSetting();

            if (isset($storage_settings['storage_type'])) {
                if ($storage_settings['storage_type'] == 'wasabi') {
                    config(
                        [
                            'filesystems.disks.wasabi.driver' => 's3',
                            'filesystems.disks.wasabi.key' => $storage_settings['wasabi_access_key'],
                            'filesystems.disks.wasabi.secret' => $storage_settings['wasabi_secret_key'],
                            'filesystems.disks.wasabi.region' => $storage_settings['wasabi_region'] ?? 'us-east-1',
                            'filesystems.disks.wasabi.bucket' => $storage_settings['wasabi_bucket'],
                            'filesystems.disks.wasabi.endpoint' => $storage_settings['wasabi_url'],
                            'filesystems.disks.wasabi.root' => $storage_settings['wasabi_root'],
                            'filesystems.disks.use_path_style_endpoint' => false,
                            'filesystems.disks.wasabi.visibility' => 'public',
                        ]
                    );
                    $max_size = ! empty($storage_settings['storage_max_upload_size']) ? $storage_settings['storage_max_upload_size'] : '2048';
                    $mimes = ! empty($storage_settings['storage_file_types']) ? $storage_settings['storage_file_types'] : 'jpeg,jpg,png,svg,zip,txt,gif,docx';
                } elseif ($storage_settings['storage_type'] == 'aws_s3') {
                    config(
                        [
                            'filesystems.disks.s3.driver' => 's3',
                            'filesystems.disks.s3.key' => $storage_settings['aws_access_key_id'],
                            'filesystems.disks.s3.secret' => $storage_settings['aws_secret_access_key'],
                            'filesystems.disks.s3.region' => $storage_settings['aws_default_region'] ?? 'us-east-1',
                            'filesystems.disks.s3.bucket' => $storage_settings['aws_bucket'],
                            'filesystems.disks.s3.url' => $storage_settings['aws_url'],
                            'filesystems.disks.s3.endpoint' => $storage_settings['aws_endpoint'],
                            'filesystems.disks.s3.use_path_style_endpoint' => false,
                            'filesystems.disks.s3.visibility' => 'public',
                        ]
                    );
                    $max_size = ! empty($storage_settings['storage_max_upload_size']) ? $storage_settings['storage_max_upload_size'] : '2048';
                    $mimes = ! empty($storage_settings['storage_file_types']) ? $storage_settings['storage_file_types'] : 'jpeg,jpg,png,svg,zip,txt,gif,docx';
                } else {
                    $max_size = ! empty($storage_settings['storage_max_upload_size']) ? $storage_settings['storage_max_upload_size'] : '2048';
                    $mimes = ! empty($storage_settings['storage_file_types']) ? $storage_settings['storage_file_types'] : 'jpeg,jpg,png,svg,zip,txt,gif,docx';
                }
                $file = $request->$key_name;

                $extension = strtolower($file->getClientOriginalExtension());
                $allowed_extensions = explode(',', $mimes);

                if (empty($extension) || ! in_array($extension, $allowed_extensions)) {
                    return [
                        'status' => false,
                        'msg' => 'The '.$key_name.' must be a file of type: '.implode(', ', $allowed_extensions).'.',
                    ];
                }

                if (count($custom_validation) > 0) {
                    $validation = $custom_validation;
                } else {
                    $validation = [
                        'mimes:'.$mimes,
                        'max:'.$max_size,
                    ];
                }
                $validator = Validator::make($request->all(), [
                    $key_name => $validation,
                ]);
                if ($validator->fails()) {
                    $res = [
                        'status' => false,
                        'msg' => $validator->messages()->first(),
                    ];

                    return $res;
                } else {
                    $storageType = $settings['storage_type'] ?? 'local';
                    $diskName = match ($storageType) {
                        'local' => 'public',
                        'aws_s3' => 's3',
                        'wasabi' => 'wasabi',
                        default => 'public'
                    };

                    // Store file directly to storage
                    $file->storeAs('media/'.$path, $name, $diskName);

                    $res = [
                        'status' => true,
                        'msg' => 'success',
                        'url' => $path.'/'.$name,
                    ];

                    return $res;
                }
            } else {
                $res = [
                    'status' => false,
                    'msg' => __('Not set configurations'),
                ];

                return $res;
            }
        } catch (\Exception $e) {
            $res = [
                'status' => false,
                'msg' => $e->getMessage(),
            ];

            return $res;
        }
    }
}

if (! function_exists('check_file')) {
    function check_file($path)
    {
        try {
            if (empty($path)) {
                return false;
            }
            $storage_settings = getAdminAllSetting();
            if (! isset($storage_settings['storage_type'])) {
                return false;
            }

            $storageType = $storage_settings['storage_type'];

            // Handle local storage
            if ($storageType === 'local' || $storageType === null) {
                // Check in public storage path
                $publicPath = storage_path('app/public/media/'.ltrim($path, '/'));
                if (file_exists($publicPath)) {
                    return true;
                }

                // Check in base path as fallback
                $basePath = base_path($path);

                return file_exists($basePath);
            }

            // Handle AWS S3 storage
            if ($storageType === 'aws_s3') {
                if (empty($storage_settings['aws_access_key_id']) ||
                    empty($storage_settings['aws_secret_access_key']) ||
                    empty($storage_settings['aws_default_region']) ||
                    empty($storage_settings['aws_bucket'])) {
                    return false;
                }

                config([
                    'filesystems.disks.s3.key' => $storage_settings['aws_access_key_id'],
                    'filesystems.disks.s3.secret' => $storage_settings['aws_secret_access_key'],
                    'filesystems.disks.s3.region' => $storage_settings['aws_default_region'] ?? 'us-east-1',
                    'filesystems.disks.s3.bucket' => $storage_settings['aws_bucket'],
                ]);

                // Normalize path for S3
                $s3Path = 'media/'.ltrim($path, '/');

                return Storage::disk('s3')->exists($s3Path);
            }

            // Handle Wasabi storage
            if ($storageType === 'wasabi') {
                if (empty($storage_settings['wasabi_access_key']) ||
                    empty($storage_settings['wasabi_secret_key']) ||
                    empty($storage_settings['wasabi_region']) ||
                    empty($storage_settings['wasabi_bucket']) ||
                    empty($storage_settings['wasabi_url']) ||
                    empty($storage_settings['wasabi_root'])) {
                    return false;
                }

                config([
                    'filesystems.disks.wasabi.key' => $storage_settings['wasabi_access_key'],
                    'filesystems.disks.wasabi.secret' => $storage_settings['wasabi_secret_key'],
                    'filesystems.disks.wasabi.region' => $storage_settings['wasabi_region'] ?? 'us-east-1',
                    'filesystems.disks.wasabi.bucket' => $storage_settings['wasabi_bucket'],
                    'filesystems.disks.wasabi.endpoint' => $storage_settings['wasabi_url'] ?? null,
                    'filesystems.disks.wasabi.root' => $storage_settings['wasabi_root'] ?? '',
                ]);

                // Normalize path for Wasabi
                $wasabiPath = 'media/'.ltrim($path, '/');

                return Storage::disk('wasabi')->exists($wasabiPath);
            }

            // Unknown storage type
            return false;

        } catch (\Exception $e) {
            // Log error for debugging
            Log::error('check_file error: '.$e->getMessage(), [
                'path' => $path,
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }
}

if (! function_exists('get_file')) {
    function get_file($path)
    {
        try {
            // Return empty string if path is empty
            if (empty($path)) {
                return '';
            }

            $storage_settings = getAdminAllSetting();

            // Check if storage settings exist, fallback to local
            if (!isset($storage_settings['storage_type'])) {
                return url('storage/media/' . ltrim($path, '/'));
            }

            $storageType = $storage_settings['storage_type'];

            // Handle AWS S3 storage
            if ($storageType === 'aws_s3' || $storageType === 's3') {
                if (empty($storage_settings['s3_key']) || 
                    empty($storage_settings['s3_secret']) || 
                    empty($storage_settings['s3_region']) ||
                    empty($storage_settings['s3_bucket'])) {
                    return url('storage/media/' . ltrim($path, '/'));
                }

                config([
                    'filesystems.disks.s3.key' => $storage_settings['s3_key'],
                    'filesystems.disks.s3.secret' => $storage_settings['s3_secret'],
                    'filesystems.disks.s3.region' => $storage_settings['s3_region'],
                    'filesystems.disks.s3.bucket' => $storage_settings['s3_bucket'],
                ]);

                // Normalize path for S3
                $s3Path = 'media/' . ltrim($path, '/');
                return Storage::disk('s3')->url($s3Path);
            }

            // Handle Wasabi storage
            if ($storageType === 'wasabi') {
                if (empty($storage_settings['wasabi_key']) || 
                    empty($storage_settings['wasabi_secret']) || 
                    empty($storage_settings['wasabi_region']) ||
                    empty($storage_settings['wasabi_bucket']) ||
                    empty($storage_settings['wasabi_root']) ||
                    empty($storage_settings['wasabi_url'])) {
                    return url('storage/media/' . ltrim($path, '/'));
                }

                config([
                    'filesystems.disks.wasabi.key' => $storage_settings['wasabi_key'],
                    'filesystems.disks.wasabi.secret' => $storage_settings['wasabi_secret'],
                    'filesystems.disks.wasabi.region' => $storage_settings['wasabi_region'],
                    'filesystems.disks.wasabi.bucket' => $storage_settings['wasabi_bucket'],
                    'filesystems.disks.wasabi.root' => $storage_settings['wasabi_root'],
                    'filesystems.disks.wasabi.endpoint' => $storage_settings['wasabi_url'],
                ]);

                // Normalize path for Wasabi
                $wasabiPath = 'media/' . ltrim($path, '/');
                return Storage::disk('wasabi')->url($wasabiPath);
            }

            // Handle local storage (default)
            return url('storage/media/' . ltrim($path, '/'));

        } catch (\Exception $e) {
            // Log error for debugging
            Log::error('get_file error: ' . $e->getMessage(), [
                'path' => $path,
                'trace' => $e->getTraceAsString()
            ]);
            // Return asset path as fallback
            return asset($path);
        }
    }
}

if (! function_exists('delete_file')) {
    function delete_file($path)
    {
        try {
            // Return false if path is empty
            if (empty($path)) {
                return false;
            }

            // Check if file exists first
            if (!check_file($path)) {
                return false;
            }

            $storage_settings = getAdminAllSetting();

            // Check if storage settings exist
            if (!isset($storage_settings['storage_type'])) {
                return false;
            }

            $storageType = $storage_settings['storage_type'];

            // Handle local storage
            if ($storageType === 'local' || $storageType === null) {
                $publicPath = storage_path('app/public/media/' . ltrim($path, '/'));
                if (file_exists($publicPath)) {
                    return unlink($publicPath);
                }
                return false;
            }

            // Handle AWS S3 storage
            if ($storageType === 'aws_s3' || $storageType === 's3') {
                if (empty($storage_settings['s3_key']) ||
                    empty($storage_settings['s3_secret']) ||
                    empty($storage_settings['s3_region']) ||
                    empty($storage_settings['s3_bucket'])) {
                    return false;
                }

                config([
                    'filesystems.disks.s3.key' => $storage_settings['s3_key'],
                    'filesystems.disks.s3.secret' => $storage_settings['s3_secret'],
                    'filesystems.disks.s3.region' => $storage_settings['s3_region'],
                    'filesystems.disks.s3.bucket' => $storage_settings['s3_bucket'],
                ]);

                // Normalize path for S3
                $s3Path = 'media/' . ltrim($path, '/');
                return Storage::disk('s3')->delete($s3Path);
            }

            // Handle Wasabi storage
            if ($storageType === 'wasabi') {
                if (empty($storage_settings['wasabi_key']) ||
                    empty($storage_settings['wasabi_secret']) ||
                    empty($storage_settings['wasabi_region']) ||
                    empty($storage_settings['wasabi_bucket']) ||
                    empty($storage_settings['wasabi_root']) ||
                    empty($storage_settings['wasabi_url'])) {
                    return false;
                }

                config([
                    'filesystems.disks.wasabi.key' => $storage_settings['wasabi_key'],
                    'filesystems.disks.wasabi.secret' => $storage_settings['wasabi_secret'],
                    'filesystems.disks.wasabi.region' => $storage_settings['wasabi_region'],
                    'filesystems.disks.wasabi.bucket' => $storage_settings['wasabi_bucket'],
                    'filesystems.disks.wasabi.root' => $storage_settings['wasabi_root'],
                    'filesystems.disks.wasabi.endpoint' => $storage_settings['wasabi_url'],
                ]);

                // Normalize path for Wasabi
                $wasabiPath = 'media/' . ltrim($path, '/');
                return Storage::disk('wasabi')->delete($wasabiPath);
            }

            // Unknown storage type
            return false;

        } catch (\Exception $e) {
            // Log error for debugging
            Log::error('delete_file error: ' . $e->getMessage(), [
                'path' => $path,
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    if (!function_exists('get_seo_setting')) {
        function get_seo_setting()
        {
            // Fetch Superadmin User ID
            $superAdmin = \App\Models\User::where('type', 'superadmin')->first();
            $superAdminId = $superAdmin ? $superAdmin->id : null;

            // Get Superadmin SEO settings using getSetting helper
            $settings = settings($superAdminId);
            $superAdminTitle       = $settings['metaTitle'] ?? $settings['titleText'] ?? config('app.name', 'POS SaaS');
            $superAdminDescription = $settings['metaDescription'] ?? '';
            $superAdminKeywords    = $settings['metaKeywords'] ?? '';
            $superAdminImagePath   = $settings['metaImage'] ?? '';
            $superAdminImage       = !empty($superAdminImagePath) ? get_file($superAdminImagePath) : '';

            // Get Landing Page SEO settings
            $landingSetting = \App\Models\LandingPageSetting::getSettings();
            $landingSeo = [];
            if ($landingSetting && isset($landingSetting->config_sections['seo'])) {
                $landingSeo = $landingSetting->config_sections['seo'];
            }

            $landingTitle       = $landingSeo['meta_title'] ?? '';
            $landingDescription = $landingSeo['meta_description'] ?? '';

            // Declare individual variables initialized empty
            $seotitle       = '';
            $seodescription = '';
            $seokeyword     = $superAdminKeywords;
            $seoImage       = $superAdminImage;

            // Resolve Request route context
            $request   = request();
            $routeName = $request->route() ? $request->route()->getName() : '';
            $slug      = $request->route('slug');

            switch (true) {

                // 1. Custom Page
                case (
                ($routeName === 'custom-page.show' || $request->is('page/*'))
                && $slug
                ):
                    $customPage = \App\Models\LandingPageCustomPage::where('slug', $slug)
                        ->where('is_active', 1)
                        ->first();

                    if ($customPage) {
                        $seotitle = $customPage->meta_title
                            ?: ($landingTitle ?: $superAdminTitle);

                        $seodescription = $customPage->meta_description
                            ?: ($landingDescription ?: $superAdminDescription);
                    }

                    break;

                // 2. Landing / Home Page
                case (
                $request->is('/')
                || $routeName === 'home'
                ):
                    $seotitle = $landingTitle ?: $superAdminTitle;

                    $seodescription = $landingDescription
                        ?: $superAdminDescription;

                    break;

                // 3. Login / Register
                case (
                $routeName === 'login'
                || $routeName === 'register'
                ):
                    $seotitle = $superAdminTitle;
                    $seodescription = $superAdminDescription;

                    break;

                // 4. Other pages
                default:
                    $seotitle = $superAdminTitle;
                    $seodescription = $superAdminDescription;

                    break;
            }

            return [
                'meta_title'       => $seotitle,
                'meta_description' => $seodescription,
                'meta_keywords'    => $seokeyword,
                'meta_image'       => $seoImage,
            ];
        }
    }
}


