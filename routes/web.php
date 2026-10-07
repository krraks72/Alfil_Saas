<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\PlanOrderController;
use App\Http\Controllers\PlanRequestController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\ReferralController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\CouponController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\ImpersonateController;
use App\Http\Controllers\TranslationController;
use App\Http\Controllers\LandingPageController;
use App\Http\Controllers\LandingPage\CustomPageController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\NotificationTemplateController;
use App\Http\Controllers\RazorpayController;
use App\Http\Controllers\MercadoPagoController;
use App\Http\Controllers\StripePaymentController;
use App\Http\Controllers\PayPalPaymentController;
use App\Http\Controllers\BankPaymentController;
use App\Http\Controllers\PaystackPaymentController;
use App\Http\Controllers\FlutterwavePaymentController;
use App\Http\Controllers\PayTabsPaymentController;
use App\Http\Controllers\SkrillPaymentController;
use App\Http\Controllers\CoinGatePaymentController;
use App\Http\Controllers\PayfastPaymentController;
use App\Http\Controllers\TapPaymentController;
use App\Http\Controllers\XenditPaymentController;
use App\Http\Controllers\PayTRPaymentController;
use App\Http\Controllers\MolliePaymentController;
use App\Http\Controllers\ToyyibPayPaymentController;
use App\Http\Controllers\CashfreeController;
use App\Http\Controllers\IyzipayPaymentController;
use App\Http\Controllers\BenefitPaymentController;
use App\Http\Controllers\OzowPaymentController;
use App\Http\Controllers\EasebuzzPaymentController;
use App\Http\Controllers\KhaltiPaymentController;
use App\Http\Controllers\AuthorizeNetPaymentController;
use App\Http\Controllers\FedaPayPaymentController;
use App\Http\Controllers\PayHerePaymentController;
use App\Http\Controllers\CinetPayPaymentController;
use App\Http\Controllers\PaiementPaymentController;
use App\Http\Controllers\NepalstePaymentController;
use App\Http\Controllers\YooKassaPaymentController;
use App\Http\Controllers\AamarpayPaymentController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\MidtransPaymentController;
use App\Http\Controllers\PublicFormController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [LandingPageController::class, 'show'])->name('home');

// Public Quotation routes (no CSRF)
Route::get('quotations/public/{id}', [\App\Http\Controllers\PublicQuotationController::class, 'show'])->name('public.quotations.show');
Route::post('quotations/public/{id}/approve', [\App\Http\Controllers\PublicQuotationController::class, 'approve'])->name('public.quotations.approve');
Route::post('quotations/public/{id}/reject', [\App\Http\Controllers\PublicQuotationController::class, 'reject'])->name('public.quotations.reject');

// Public form submission routes

// Cashfree webhook (public route)
Route::post('cashfree/webhook', [CashfreeController::class, 'webhook'])->name('cashfree.webhook');

// Benefit webhook (public route)
Route::post('benefit/webhook', [BenefitPaymentController::class, 'webhook'])->name('benefit.webhook');
Route::get('payments/benefit/success', [BenefitPaymentController::class, 'success'])->name('benefit.success');
Route::post('payments/benefit/callback', [BenefitPaymentController::class, 'callback'])->name('benefit.callback');

// FedaPay callback (public route)
Route::match(['GET', 'POST'], 'payments/fedapay/callback', [FedaPayPaymentController::class, 'callback'])->name('fedapay.callback');

// YooKassa success/callback (public routes)
Route::get('payments/yookassa/success', [YooKassaPaymentController::class, 'success'])->name('yookassa.success');
Route::post('payments/yookassa/callback', [YooKassaPaymentController::class, 'callback'])->name('yookassa.callback');

// Nepalste success/callback (public routes)
Route::get('payments/nepalste/success', [NepalstePaymentController::class, 'success'])->name('nepalste.success');
Route::post('payments/nepalste/callback', [NepalstePaymentController::class, 'callback'])->name('nepalste.callback');

// PayTR callback (public route)
Route::post('payments/paytr/callback', [PayTRPaymentController::class, 'callback'])->name('paytr.callback');

// PayTabs callback (public route)
Route::match(['GET', 'POST'], 'payments/paytabs/callback', [PayTabsPaymentController::class, 'callback'])->name('paytabs.callback');
Route::get('payments/paytabs/success', [PayTabsPaymentController::class, 'success'])->name('paytabs.success');

// Tap payment routes (public routes)
Route::get('payments/tap/success', [TapPaymentController::class, 'success'])->name('tap.success');
Route::post('payments/tap/callback', [TapPaymentController::class, 'callback'])->name('tap.callback');

// Aamarpay payment routes (public routes)
Route::match(['GET', 'POST'], 'payments/aamarpay/success', [AamarpayPaymentController::class, 'success'])->name('aamarpay.success');
Route::post('payments/aamarpay/callback', [AamarpayPaymentController::class, 'callback'])->name('aamarpay.callback');


// PayFast payment routes (public routes)
Route::get('payments/payfast/success', [PayfastPaymentController::class, 'success'])->name('payfast.success');
Route::post('payments/payfast/callback', [PayfastPaymentController::class, 'callback'])->name('payfast.callback');

// CoinGate callback (public route)
Route::match(['GET', 'POST'], 'payments/coingate/callback', [CoinGatePaymentController::class, 'callback'])->name('coingate.callback');

// Xendit payment routes (public routes)
Route::get('payments/xendit/success', [XenditPaymentController::class, 'success'])->name('xendit.success');
Route::post('payments/xendit/callback', [XenditPaymentController::class, 'callback'])->name('xendit.callback');

// CinetPay payment routes (public routes)
Route::get('payments/cinetpay/success', [CinetPayPaymentController::class, 'success'])->name('cinetpay.success');
Route::post('payments/cinetpay/callback', [CinetPayPaymentController::class, 'callback'])->name('cinetpay.callback');

// PWA Manifest routes removed
Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/landing-page', [LandingPageController::class, 'settings'])->name('landing-page');
    // Email Templates routes (no middleware for testing)
    Route::get('email-templates', [\App\Http\Controllers\EmailTemplateController::class, 'index'])->name('email-templates.index');
    Route::get('email-templates/{emailTemplate}', [\App\Http\Controllers\EmailTemplateController::class, 'show'])->name('email-templates.show');
    Route::put('email-templates/{emailTemplate}/settings', [\App\Http\Controllers\EmailTemplateController::class, 'updateSettings'])->name('email-templates.update-settings');
    Route::put('email-templates/{emailTemplate}/content', [\App\Http\Controllers\EmailTemplateController::class, 'updateContent'])->name('email-templates.update-content');
});
Route::post('/landing-page/contact', [LandingPageController::class, 'submitContact'])->name('landing-page.contact');
Route::post('/landing-page/subscribe', [LandingPageController::class, 'subscribe'])->name('landing-page.subscribe');
Route::post('newsletter/subscribe', [\App\Http\Controllers\NewsletterSubscriptionController::class, 'subscribe'])->name('newsletter.subscribe');
Route::get('newsletter/unsubscribe/{email}', [\App\Http\Controllers\NewsletterSubscriptionController::class, 'unsubscribe'])->name('newsletter.unsubscribe');
Route::get('/page/{slug}', [CustomPageController::class, 'show'])->name('custom-page.show');
Route::get('/translations/{locale}', [TranslationController::class, 'getTranslations'])->name('translations');
Route::get('/refresh-language/{locale}', [TranslationController::class, 'refreshLanguage'])->name('refresh-language');
Route::get('/initial-locale', [TranslationController::class, 'getInitialLocale'])->name('initial-locale');

Route::middleware(['auth', 'verified'])->group(function () {
    // Plans routes - accessible without plan check
    Route::get('plans', [PlanController::class, 'index'])->name('plans.index');
    Route::post('plans/request', [PlanController::class, 'requestPlan'])->name('plans.request');
    Route::post('plans/cancel-request', [PlanController::class, 'cancelRequest'])->name('plans.cancel-request');
    Route::post('plans/trial', [PlanController::class, 'startTrial'])->name('plans.trial');
    Route::post('plans/subscribe', [PlanController::class, 'subscribe'])->name('plans.subscribe');
    Route::post('plans/coupons/validate', [CouponController::class, 'validate'])->name('coupons.validate');

    // Payment methods route
    Route::get('payment/methods', [\App\Http\Controllers\Settings\PaymentSettingController::class, 'getPaymentMethods'])->name('payment.methods');

    // Payment routes - accessible without plan check
    Route::post('payments/stripe', [StripePaymentController::class, 'processPayment'])->name('stripe.payment');
    Route::post('payments/paypal', [PayPalPaymentController::class, 'processPayment'])->name('paypal.payment');
    Route::post('payments/bank', [BankPaymentController::class, 'processPayment'])->name('bank.payment');
    Route::post('payments/paystack', [PaystackPaymentController::class, 'processPayment'])->name('paystack.payment');
    Route::post('payments/flutterwave', [FlutterwavePaymentController::class, 'processPayment'])->name('flutterwave.payment');
    Route::post('payments/paytabs', [PayTabsPaymentController::class, 'processPayment'])->name('paytabs.payment');
    Route::post('payments/skrill', [SkrillPaymentController::class, 'processPayment'])->name('skrill.payment');
    Route::post('payments/coingate', [CoinGatePaymentController::class, 'processPayment'])->name('coingate.payment');
    Route::post('payments/payfast', [PayfastPaymentController::class, 'processPayment'])->name('payfast.payment');
    Route::post('payments/mollie', [MolliePaymentController::class, 'processPayment'])->name('mollie.payment');
    Route::post('payments/toyyibpay', [ToyyibPayPaymentController::class, 'processPayment'])->name('toyyibpay.payment');
    Route::post('payments/iyzipay', [IyzipayPaymentController::class, 'processPayment'])->name('iyzipay.payment');
    Route::post('payments/benefit', [BenefitPaymentController::class, 'processPayment'])->name('benefit.payment');
    Route::post('payments/ozow', [OzowPaymentController::class, 'processPayment'])->name('ozow.payment');
    Route::post('payments/easebuzz', [EasebuzzPaymentController::class, 'processPayment'])->name('easebuzz.payment');
    Route::post('payments/khalti', [KhaltiPaymentController::class, 'processPayment'])->name('khalti.payment');
    Route::post('payments/authorizenet', [AuthorizeNetPaymentController::class, 'processPayment'])->name('authorizenet.payment');
    Route::post('payments/fedapay', [FedaPayPaymentController::class, 'processPayment'])->name('fedapay.payment');
    Route::post('payments/payhere', [PayHerePaymentController::class, 'processPayment'])->name('payhere.payment');
    Route::post('payments/cinetpay', [CinetPayPaymentController::class, 'processPayment'])->name('cinetpay.payment');
    Route::post('payments/paiement', [PaiementPaymentController::class, 'processPayment'])->name('paiement.payment');
    Route::post('payments/nepalste', [NepalstePaymentController::class, 'processPayment'])->name('nepalste.payment');
    Route::post('payments/yookassa', [YooKassaPaymentController::class, 'processPayment'])->name('yookassa.payment');
    Route::post('payments/aamarpay', [AamarpayPaymentController::class, 'processPayment'])->name('aamarpay.payment');
    Route::post('payments/midtrans', [MidtransPaymentController::class, 'processPayment'])->name('midtrans.payment');

    // Payment gateway specific routes
    Route::post('razorpay/create-order', [RazorpayController::class, 'createOrder'])->name('razorpay.create-order');
    Route::post('razorpay/verify-payment', [RazorpayController::class, 'verifyPayment'])->name('razorpay.verify-payment');
    Route::post('cashfree/create-session', [CashfreeController::class, 'createPaymentSession'])->name('cashfree.create-session');
    Route::post('cashfree/verify-payment', [CashfreeController::class, 'verifyPayment'])->name('cashfree.verify-payment');
    Route::post('mercadopago/create-preference', [MercadoPagoController::class, 'createPreference'])->name('mercadopago.create-preference');
    Route::post('mercadopago/process-payment', [MercadoPagoController::class, 'processPayment'])->name('mercadopago.process-payment');

    // Other payment creation routes
    Route::post('tap/create-payment', [TapPaymentController::class, 'createPayment'])->name('tap.create-payment');
    Route::post('xendit/create-payment', [XenditPaymentController::class, 'createPayment'])->name('xendit.create-payment');
    Route::post('payments/paytr/create-token', [PayTRPaymentController::class, 'createPaymentToken'])->name('paytr.create-token');
    Route::post('iyzipay/create-form', [IyzipayPaymentController::class, 'createPaymentForm'])->name('iyzipay.create-form');
    Route::post('benefit/create-session', [BenefitPaymentController::class, 'createPaymentSession'])->name('benefit.create-session');
    Route::post('ozow/create-payment', [OzowPaymentController::class, 'createPayment'])->name('ozow.create-payment');
    Route::post('easebuzz/create-payment', [EasebuzzPaymentController::class, 'createPayment'])->name('easebuzz.create-payment');
    Route::post('khalti/create-payment', [KhaltiPaymentController::class, 'createPayment'])->name('khalti.create-payment');
    Route::post('authorizenet/create-form', [AuthorizeNetPaymentController::class, 'createPaymentForm'])->name('authorizenet.create-form');
    Route::post('fedapay/create-payment', [FedaPayPaymentController::class, 'createPayment'])->name('fedapay.create-payment');
    Route::post('payhere/create-payment', [PayHerePaymentController::class, 'createPayment'])->name('payhere.create-payment');
    Route::post('cinetpay/create-payment', [CinetPayPaymentController::class, 'createPayment'])->name('cinetpay.create-payment');
    Route::post('paiement/create-payment', [PaiementPaymentController::class, 'createPayment'])->name('paiement.create-payment');
    Route::post('nepalste/create-payment', [NepalstePaymentController::class, 'createPayment'])->name('nepalste.create-payment');
    Route::post('yookassa/create-payment', [YooKassaPaymentController::class, 'createPayment'])->name('yookassa.create-payment');
    Route::post('aamarpay/create-payment', [AamarpayPaymentController::class, 'createPayment'])->name('aamarpay.create-payment');
    Route::post('midtrans/create-payment', [MidtransPaymentController::class, 'createPayment'])->name('midtrans.create-payment');

    // Payment success/callback routes
    Route::post('payments/skrill/callback', [SkrillPaymentController::class, 'callback'])->name('skrill.callback');
    Route::get('payments/paytr/success', [PayTRPaymentController::class, 'success'])->name('paytr.success');
    Route::get('payments/paytr/failure', [PayTRPaymentController::class, 'failure'])->name('paytr.failure');
    Route::get('payments/mollie/success', [MolliePaymentController::class, 'success'])->name('mollie.success');
    Route::post('payments/mollie/callback', [MolliePaymentController::class, 'callback'])->name('mollie.callback');
    Route::match(['GET', 'POST'], 'payments/toyyibpay/success', [ToyyibPayPaymentController::class, 'success'])->name('toyyibpay.success');
    Route::post('payments/toyyibpay/callback', [ToyyibPayPaymentController::class, 'callback'])->name('toyyibpay.callback');
    Route::post('payments/iyzipay/callback', [IyzipayPaymentController::class, 'callback'])->name('iyzipay.callback');
    Route::get('payments/ozow/success', [OzowPaymentController::class, 'success'])->name('ozow.success');
    Route::post('payments/ozow/callback', [OzowPaymentController::class, 'callback'])->name('ozow.callback');
    Route::get('payments/payhere/success', [PayHerePaymentController::class, 'success'])->name('payhere.success');
    Route::post('payments/payhere/callback', [PayHerePaymentController::class, 'callback'])->name('payhere.callback');
    Route::get('payments/cinetpay/success', [CinetPayPaymentController::class, 'success'])->name('cinetpay.success');
    Route::post('payments/cinetpay/callback', [CinetPayPaymentController::class, 'callback'])->name('cinetpay.callback');
    Route::get('payments/paiement/success', [PaiementPaymentController::class, 'success'])->name('paiement.success');
    Route::post('payments/paiement/callback', [PaiementPaymentController::class, 'callback'])->name('paiement.callback');
    Route::post('payments/midtrans/callback', [MidtransPaymentController::class, 'callback'])->name('midtrans.callback');
    Route::get('mercadopago/success', [MercadoPagoController::class, 'success'])->name('mercadopago.success');
    Route::get('mercadopago/failure', [MercadoPagoController::class, 'failure'])->name('mercadopago.failure');
    Route::get('mercadopago/pending', [MercadoPagoController::class, 'pending'])->name('mercadopago.pending');
    Route::post('mercadopago/webhook', [MercadoPagoController::class, 'webhook'])->name('mercadopago.webhook');
    Route::post('authorizenet/test-connection', [AuthorizeNetPaymentController::class, 'testConnection'])->name('authorizenet.test-connection');

    // All other routes require plan access check
    Route::middleware(['plan.access', 'App\Http\Middleware\DemoModeMiddleware'])->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('dashboard/redirect', [DashboardController::class, 'redirectToFirstAvailablePage'])->name('dashboard.redirect');

        Route::get('media-library', function () {
            return Inertia::render('media-library');
        })->name('media-library');

        // Calendar routes
        Route::get('calendar', [CalendarController::class, 'index'])->name('calendar.index');
        Route::post('calendar/events', [CalendarController::class, 'store'])->name('calendar.events.store');
        Route::put('calendar/events/{event}', [CalendarController::class, 'update'])->name('calendar.events.update');
        Route::delete('calendar/events/{event}', [CalendarController::class, 'destroy'])->name('calendar.events.destroy');

        // Google Calendar routes
        Route::post('api/google-calendar/sync', [\App\Http\Controllers\GoogleCalendarController::class, 'syncEvents'])->name('google-calendar.sync');



        // Media Library API routes
        Route::get('api/media', [MediaController::class, 'index'])->middleware('permission:manage-media')->name('api.media.index');
        Route::post('api/media/batch', [MediaController::class, 'batchStore'])->middleware('permission:create-media')->name('api.media.batch');
        Route::get('api/media/{id}/download', [MediaController::class, 'download'])->middleware('permission:download-media')->name('api.media.download');
        Route::delete('api/media/{id}', [MediaController::class, 'destroy'])->middleware('permission:delete-media')->name('api.media.destroy');

        // Permissions routes with granular permissions
        Route::middleware('permission:manage-permissions')->group(function () {
            Route::get('permissions', [PermissionController::class, 'index'])->middleware('permission:manage-permissions')->name('permissions.index');
            Route::get('permissions/create', [PermissionController::class, 'create'])->middleware('permission:create-permissions')->name('permissions.create');
            Route::post('permissions', [PermissionController::class, 'store'])->middleware('permission:create-permissions')->name('permissions.store');
            Route::get('permissions/{permission}', [PermissionController::class, 'show'])->middleware('permission:view-permissions')->name('permissions.show');
            Route::get('permissions/{permission}/edit', [PermissionController::class, 'edit'])->middleware('permission:edit-permissions')->name('permissions.edit');
            Route::put('permissions/{permission}', [PermissionController::class, 'update'])->middleware('permission:edit-permissions')->name('permissions.update');
            Route::patch('permissions/{permission}', [PermissionController::class, 'update'])->middleware('permission:edit-permissions');
            Route::delete('permissions/{permission}', [PermissionController::class, 'destroy'])->middleware('permission:delete-permissions')->name('permissions.destroy');
        });

        // Roles routes with granular permissions
        Route::middleware('permission:manage-roles')->group(function () {
            Route::get('roles', [RoleController::class, 'index'])->middleware('permission:manage-roles')->name('roles.index');
            Route::get('roles/create', [RoleController::class, 'create'])->middleware('permission:create-roles')->name('roles.create');
            Route::post('roles', [RoleController::class, 'store'])->middleware('permission:create-roles')->name('roles.store');
            Route::get('roles/{role}', [RoleController::class, 'show'])->middleware('permission:view-roles')->name('roles.show');
            Route::get('roles/{role}/edit', [RoleController::class, 'edit'])->middleware('permission:edit-roles')->name('roles.edit');
            Route::put('roles/{role}', [RoleController::class, 'update'])->middleware('permission:edit-roles')->name('roles.update');
            Route::patch('roles/{role}', [RoleController::class, 'update'])->middleware('permission:edit-roles');
            Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:delete-roles')->name('roles.destroy');
        });

        // Users routes with granular permissions
        Route::middleware('permission:manage-users')->group(function () {
            Route::get('users', [UserController::class, 'index'])->middleware('permission:manage-users')->name('users.index');
            Route::get('users/create', [UserController::class, 'create'])->middleware('permission:create-users')->name('users.create');
            Route::post('users', [UserController::class, 'store'])->middleware('permission:create-users')->name('users.store');
            Route::get('users/{user}', [UserController::class, 'show'])->middleware('permission:view-users')->name('users.show');
            Route::get('users/{user}/edit', [UserController::class, 'edit'])->middleware('permission:edit-users')->name('users.edit');
            Route::put('users/{user}', [UserController::class, 'update'])->middleware('permission:edit-users')->name('users.update');
            Route::patch('users/{user}', [UserController::class, 'update'])->middleware('permission:edit-users');
            Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('permission:delete-users')->name('users.destroy');

            // Additional user routes
            Route::put('users/{user}/reset-password', [UserController::class, 'resetPassword'])->middleware('permission:reset-password-users')->name('users.reset-password');
            Route::put('users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->middleware('permission:toggle-status-users')->name('users.toggle-status');
            // Route::get('users-logs', [UserController::class, 'allUserLogs'])->middleware('permission:view-users')->name('users.all-logs');
        });
        Route::middleware('permission:manage-login-history')->group(function () {
            Route::get('login-history', [UserController::class, 'allUserLogs'])->middleware('permission:show-login-history')->name('users.all-logs');
            Route::delete('login-history/{loginHistory}', [UserController::class, 'destroyLoginHistory'])->middleware('permission:delete-login-history')->name('login-history.destroy');
        });

        // Plans management routes (admin only)
        Route::middleware('permission:manage-plans')->group(function () {
            Route::get('plans/create', [PlanController::class, 'create'])->middleware('permission:create-plans')->name('plans.create');
            Route::post('plans', [PlanController::class, 'store'])->middleware('permission:create-plans')->name('plans.store');
            Route::get('plans/{plan}/edit', [PlanController::class, 'edit'])->middleware('permission:edit-plans')->name('plans.edit');
            Route::put('plans/{plan}', [PlanController::class, 'update'])->middleware('permission:edit-plans')->name('plans.update');
            Route::delete('plans/{plan}', [PlanController::class, 'destroy'])->middleware('permission:delete-plans')->name('plans.destroy');
            Route::post('plans/{plan}/toggle-status', [PlanController::class, 'toggleStatus'])->name('plans.toggle-status');
        });


        // Plan Orders routes
        Route::middleware('permission:manage-plan-orders')->group(function () {
            Route::get('plan-orders', [PlanOrderController::class, 'index'])->middleware('permission:manage-plan-orders')->name('plan-orders.index');
            Route::post('plan-orders/{planOrder}/approve', [PlanOrderController::class, 'approve'])->middleware('permission:approve-plan-orders')->name('plan-orders.approve');
            Route::post('plan-orders/{planOrder}/reject', [PlanOrderController::class, 'reject'])->middleware('permission:reject-plan-orders')->name('plan-orders.reject');
        });

        // Plan Requests routes (placeholder)
        Route::get('plan-requests', function () {
            return Inertia::render('plans/plan-requests');
        })->name('plan-requests.index');

        // Companies routes
        Route::middleware('permission:manage-companies')->group(function () {
            Route::get('companies', [CompanyController::class, 'index'])->middleware('permission:manage-companies')->name('companies.index');
            Route::post('companies', [CompanyController::class, 'store'])->middleware('permission:create-companies')->name('companies.store');
            Route::put('companies/{company}', [CompanyController::class, 'update'])->middleware('permission:edit-companies')->name('companies.update');
            Route::delete('companies/{company}', [CompanyController::class, 'destroy'])->middleware('permission:delete-companies')->name('companies.destroy');
            Route::put('companies/{company}/reset-password', [CompanyController::class, 'resetPassword'])->middleware('permission:reset-password-companies')->name('companies.reset-password');
            Route::put('companies/{company}/toggle-status', [CompanyController::class, 'toggleStatus'])->middleware('permission:toggle-status-companies')->name('companies.toggle-status');
            Route::get('companies/{company}/plans', [CompanyController::class, 'getPlans'])->middleware('permission:manage-plans-companies')->name('companies.plans');
            Route::put('companies/{company}/upgrade-plan', [CompanyController::class, 'upgradePlan'])->middleware('permission:upgrade-plan-companies')->name('companies.upgrade-plan');
        });


        // Coupons routes
        Route::middleware('permission:manage-coupons')->group(function () {
            Route::get('coupons', [CouponController::class, 'index'])->middleware('permission:manage-coupons')->name('coupons.index');
            Route::get('coupons/{coupon}', [CouponController::class, 'show'])->middleware('permission:view-coupons')->name('coupons.show');
            Route::post('coupons', [CouponController::class, 'store'])->middleware('permission:create-coupons')->name('coupons.store');
            Route::put('coupons/{coupon}', [CouponController::class, 'update'])->middleware('permission:edit-coupons')->name('coupons.update');
            Route::match(['PUT', 'POST'], 'coupons/{coupon}/toggle-status', [CouponController::class, 'toggleStatus'])->middleware('permission:toggle-status-coupons')->name('coupons.toggle-status');
            Route::delete('coupons/{coupon}', [CouponController::class, 'destroy'])->middleware('permission:delete-coupons')->name('coupons.destroy');
        });

        // Plan Requests routes
        Route::middleware('permission:manage-plan-requests')->group(function () {
            Route::get('plan-requests', [PlanRequestController::class, 'index'])->middleware('permission:manage-plan-requests')->name('plan-requests.index');
            Route::post('plan-requests/{planRequest}/approve', [PlanRequestController::class, 'approve'])->middleware('permission:approve-plan-requests')->name('plan-requests.approve');
            Route::post('plan-requests/{planRequest}/reject', [PlanRequestController::class, 'reject'])->middleware('permission:reject-plan-requests')->name('plan-requests.reject');
            Route::delete('plan-requests/{planRequest}', [PlanRequestController::class, 'destroy'])->middleware('permission:delete-plan-requests')->name('plan-requests.destroy');
        });



        // Referral routes
        Route::middleware('permission:manage-referral')->group(function () {
            Route::get('referral', [ReferralController::class, 'index'])->middleware('permission:manage-referral')->name('referral.index');
            Route::get('referral/referred-users', [ReferralController::class, 'getReferredUsers'])->middleware('permission:manage-users-referral')->name('referral.referred-users');
            Route::post('referral/settings', [ReferralController::class, 'updateSettings'])->middleware('permission:manage-setting-referral')->name('referral.settings.update');
            Route::post('referral/payout-request', [ReferralController::class, 'createPayoutRequest'])->middleware('permission:manage-payout-referral')->name('referral.payout-request.create');
            Route::post('referral/payout-request/{payoutRequest}/approve', [ReferralController::class, 'approvePayoutRequest'])->middleware('permission:approve-payout-referral')->name('referral.payout-request.approve');
            Route::post('referral/payout-request/{payoutRequest}/reject', [ReferralController::class, 'rejectPayoutRequest'])->middleware('permission:reject-payout-referral')->name('referral.payout-request.reject');
        });

        // Currencies routes
        Route::middleware('permission:manage-currencies')->group(function () {
            Route::get('currencies', [CurrencyController::class, 'index'])->middleware('permission:manage-currencies')->name('currencies.index');
            Route::post('currencies', [CurrencyController::class, 'store'])->middleware('permission:create-currencies')->name('currencies.store');
            Route::put('currencies/{currency}', [CurrencyController::class, 'update'])->middleware('permission:edit-currencies')->name('currencies.update');
            Route::delete('currencies/{currency}', [CurrencyController::class, 'destroy'])->middleware('permission:delete-currencies')->name('currencies.destroy');
        });

        // ChatGPT routes
        Route::post('api/chatgpt/generate', [\App\Http\Controllers\ChatGptController::class, 'generate'])->name('chatgpt.generate');

        // Language management
        Route::get('manage-language/{lang?}', [LanguageController::class, 'managePage'])->middleware('permission:manage-language')->name('manage-language');
        Route::get('language/load', [LanguageController::class, 'load'])->name('language.load');
        Route::match(['POST', 'PATCH'], 'language/save', [LanguageController::class, 'save'])->middleware('permission:edit-language')->name('language.save');
        Route::post('language/create', [LanguageController::class, 'createLanguage'])->middleware('permission:manage-language')->name('language.create');
        Route::delete('languages/{languageCode}', [LanguageController::class, 'deleteLanguage'])->middleware('permission:manage-language')->name('languages.delete');
        Route::patch('languages/{languageCode}/toggle', [LanguageController::class, 'toggleLanguageStatus'])->middleware('permission:manage-language')->name('languages.toggle');
        Route::post('languages/change', [LanguageController::class, 'changeLanguage'])->name('languages.change');

        // Landing Page content management (Super Admin only)
        Route::middleware('App\Http\Middleware\SuperAdminMiddleware')->group(function () {
            Route::get('landing-page/settings', [LandingPageController::class, 'settings'])->name('landing-page.settings');
            Route::post('landing-page/settings', [LandingPageController::class, 'updateSettings'])->name('landing-page.settings.update');

            Route::resource('custom-pages', CustomPageController::class)->names([
                'index' => 'landing-page.custom-pages.index',
                'create' => 'landing-page.custom-pages.create',
                'store' => 'landing-page.custom-pages.store',
                'edit' => 'landing-page.custom-pages.edit',
                'update' => 'landing-page.custom-pages.update',
                'destroy' => 'landing-page.custom-pages.destroy'
            ]);

            // Contact Messages Management
            Route::get('contacts', [\App\Http\Controllers\ContactController::class, 'index'])->name('contacts.index');
            Route::get('contacts/{contact}', [\App\Http\Controllers\ContactController::class, 'show'])->name('contacts.show');
            Route::delete('contacts/{contact}', [\App\Http\Controllers\ContactController::class, 'destroy'])->name('contacts.destroy');

            // Newsletter Subscribers Management
            Route::get('newsletter-subscribers', [\App\Http\Controllers\NewsletterSubscriptionController::class, 'index'])->name('newsletter-subscribers.index');
            Route::post('newsletter-subscribers/send', [\App\Http\Controllers\NewsletterSubscriptionController::class, 'send'])->name('newsletter-subscribers.send');
            Route::delete('newsletter-subscribers/{newsletterSubscription}', [\App\Http\Controllers\NewsletterSubscriptionController::class, 'destroy'])->name('newsletter-subscribers.destroy');
        });

        // Branch Management routes
        Route::middleware(['auth', 'permission:view-branches'])->group(function () {
            Route::get('/branches', [\App\Http\Controllers\BranchController::class, 'index'])->name('branches.index');
            Route::post('/branches', [\App\Http\Controllers\BranchController::class, 'store'])->name('branches.store')->middleware('permission:create-branches');
            Route::put('/branches/{branch}', [\App\Http\Controllers\BranchController::class, 'update'])->name('branches.update')->middleware('permission:edit-branches');
            Route::delete('/branches/{branch}', [\App\Http\Controllers\BranchController::class, 'destroy'])->name('branches.destroy')->middleware('permission:delete-branches');
            Route::put('/branches/{branch}/toggle-status', [\App\Http\Controllers\BranchController::class, 'toggleStatus'])->name('branches.toggle-status')->middleware('permission:manage-branch-status');
        });

        // Cash Register Management routes
        Route::middleware(['auth', 'permission:view-cash-registers'])->group(function () {
            Route::get('/cash-registers', [\App\Http\Controllers\CashRegisterController::class, 'index'])->name('cash-registers.index');
            Route::post('/cash-registers', [\App\Http\Controllers\CashRegisterController::class, 'store'])->name('cash-registers.store')->middleware('permission:create-cash-registers');
            Route::put('/cash-registers/{cashRegister}', [\App\Http\Controllers\CashRegisterController::class, 'update'])->name('cash-registers.update')->middleware('permission:edit-cash-registers');
            Route::delete('/cash-registers/{cashRegister}', [\App\Http\Controllers\CashRegisterController::class, 'destroy'])->name('cash-registers.destroy')->middleware('permission:delete-cash-registers');
            Route::put('/cash-registers/{cashRegister}/toggle-status', [\App\Http\Controllers\CashRegisterController::class, 'toggleStatus'])->name('cash-registers.toggle-status')->middleware('permission:manage-cash-register-status');
            Route::put('/cash-registers/{cashRegister}/balance', [\App\Http\Controllers\CashRegisterController::class, 'updateBalance'])->name('cash-registers.update-balance')->middleware('permission:manage-cash-register-balance');
        });

        // Customer Management routes
        Route::middleware(['auth', 'permission:view-customers'])->group(function () {
            Route::get('/customers', [\App\Http\Controllers\CustomerController::class, 'index'])->name('customers.index');
            Route::get('/customers/create', [\App\Http\Controllers\CustomerController::class, 'create'])->name('customers.create')->middleware('permission:create-customers');
            Route::get('/customers/{customer}/edit', [\App\Http\Controllers\CustomerController::class, 'edit'])->name('customers.edit')->middleware('permission:edit-customers');
            Route::post('/customers', [\App\Http\Controllers\CustomerController::class, 'store'])->name('customers.store')->middleware('permission:create-customers');
            Route::put('/customers/{customer}', [\App\Http\Controllers\CustomerController::class, 'update'])->name('customers.update')->middleware('permission:edit-customers');
            Route::delete('/customers/{customer}', [\App\Http\Controllers\CustomerController::class, 'destroy'])->name('customers.destroy')->middleware('permission:delete-customers');
            Route::put('/customers/{customer}/toggle-status', [\App\Http\Controllers\CustomerController::class, 'toggleStatus'])->name('customers.toggle-status')->middleware('permission:manage-customer-status');

            // Import/Export routes
            Route::get('/customers/export', [\App\Http\Controllers\CustomerController::class, 'export'])->name('customers.export')->middleware('permission:export-customers');
            Route::get('/customers/download/template', [\App\Http\Controllers\CustomerController::class, 'downloadTemplate'])->name('customer.download.template');

            // New import routes
            Route::post('/customers/parse', [\App\Http\Controllers\CustomerController::class, 'parseFile'])->name('customers.parse')->middleware('permission:import-customers');
            Route::post('/customers/import-data', [\App\Http\Controllers\CustomerController::class, 'importData'])->name('customers.import-data')->middleware('permission:import-customers');
        });

        // Vendor Management routes
        Route::middleware(['auth', 'permission:view-vendors'])->group(function () {
            Route::get('/vendors', [\App\Http\Controllers\VendorController::class, 'index'])->name('vendors.index');
            Route::get('/vendors/create', [\App\Http\Controllers\VendorController::class, 'create'])->name('vendors.create')->middleware('permission:create-vendors');
            Route::get('/vendors/{vendor}/edit', [\App\Http\Controllers\VendorController::class, 'edit'])->name('vendors.edit')->middleware('permission:edit-vendors');
            Route::post('/vendors', [\App\Http\Controllers\VendorController::class, 'store'])->name('vendors.store')->middleware('permission:create-vendors');
            Route::put('/vendors/{vendor}', [\App\Http\Controllers\VendorController::class, 'update'])->name('vendors.update')->middleware('permission:edit-vendors');
            Route::delete('/vendors/{vendor}', [\App\Http\Controllers\VendorController::class, 'destroy'])->name('vendors.destroy')->middleware('permission:delete-vendors');
            Route::put('/vendors/{vendor}/toggle-status', [\App\Http\Controllers\VendorController::class, 'toggleStatus'])->name('vendors.toggle-status')->middleware('permission:manage-vendor-status');

            Route::get('/vendors/export', [\App\Http\Controllers\VendorController::class, 'export'])->name('vendors.export')->middleware('permission:export-vendors');
            Route::get('/vendors/download/template', [\App\Http\Controllers\VendorController::class, 'downloadTemplate'])->name('vendor.download.template');

            // New import routes
            Route::post('/vendors/parse', [\App\Http\Controllers\VendorController::class, 'parseFile'])->name('vendors.parse')->middleware('permission:import-vendors');
            Route::post('/vendors/import-data', [\App\Http\Controllers\VendorController::class, 'importData'])->name('vendors.import-data')->middleware('permission:import-vendors');
        });

        // Brand Management routes
        Route::middleware(['auth', 'permission:view-brands'])->group(function () {
            Route::get('/brands', [\App\Http\Controllers\BrandController::class, 'index'])->name('brands.index');
            Route::post('/brands', [\App\Http\Controllers\BrandController::class, 'store'])->name('brands.store')->middleware('permission:create-brands');
            Route::put('/brands/{brand}', [\App\Http\Controllers\BrandController::class, 'update'])->name('brands.update')->middleware('permission:edit-brands');
            Route::delete('/brands/{brand}', [\App\Http\Controllers\BrandController::class, 'destroy'])->name('brands.destroy')->middleware('permission:delete-brands');
            Route::put('/brands/{brand}/toggle-status', [\App\Http\Controllers\BrandController::class, 'toggleStatus'])->name('brands.toggle-status')->middleware('permission:manage-brand-status');
        });

        // Category Management routes
        Route::middleware(['auth', 'permission:view-categories'])->group(function () {
            Route::get('/categories', [\App\Http\Controllers\CategoryController::class, 'index'])->name('categories.index');
            Route::post('/categories', [\App\Http\Controllers\CategoryController::class, 'store'])->name('categories.store')->middleware('permission:create-categories');
            Route::put('/categories/{category}', [\App\Http\Controllers\CategoryController::class, 'update'])->name('categories.update')->middleware('permission:edit-categories');
            Route::delete('/categories/{category}', [\App\Http\Controllers\CategoryController::class, 'destroy'])->name('categories.destroy')->middleware('permission:delete-categories');
            Route::put('/categories/{category}/toggle-status', [\App\Http\Controllers\CategoryController::class, 'toggleStatus'])->name('categories.toggle-status')->middleware('permission:manage-category-status');
        });

        // Tax Management routes
        Route::middleware(['auth', 'permission:view-taxes'])->group(function () {
            Route::get('/taxes', [\App\Http\Controllers\TaxController::class, 'index'])->name('taxes.index');
            Route::post('/taxes', [\App\Http\Controllers\TaxController::class, 'store'])->name('taxes.store')->middleware('permission:create-taxes');
            Route::put('/taxes/{tax}', [\App\Http\Controllers\TaxController::class, 'update'])->name('taxes.update')->middleware('permission:edit-taxes');
            Route::delete('/taxes/{tax}', [\App\Http\Controllers\TaxController::class, 'destroy'])->name('taxes.destroy')->middleware('permission:delete-taxes');
            Route::put('/taxes/{tax}/toggle-status', [\App\Http\Controllers\TaxController::class, 'toggleStatus'])->name('taxes.toggle-status')->middleware('permission:manage-tax-status');
        });

        // Unit Management routes
        Route::middleware(['auth', 'permission:view-units'])->group(function () {
            Route::get('/units', [\App\Http\Controllers\UnitController::class, 'index'])->name('units.index');
            Route::post('/units', [\App\Http\Controllers\UnitController::class, 'store'])->name('units.store')->middleware('permission:create-units');
            Route::put('/units/{unit}', [\App\Http\Controllers\UnitController::class, 'update'])->name('units.update')->middleware('permission:edit-units');
            Route::delete('/units/{unit}', [\App\Http\Controllers\UnitController::class, 'destroy'])->name('units.destroy')->middleware('permission:delete-units');
            Route::put('/units/{unit}/toggle-status', [\App\Http\Controllers\UnitController::class, 'toggleStatus'])->name('units.toggle-status')->middleware('permission:manage-unit-status');
        });

        // Product Management routes
        Route::middleware(['auth', 'permission:view-products'])->group(function () {
            Route::get('/products', [\App\Http\Controllers\ProductController::class, 'index'])->name('products.index');
            Route::get('/products/create', [\App\Http\Controllers\ProductController::class, 'create'])->name('products.create')->middleware('permission:create-products');
            Route::get('/products/{product}/edit', [\App\Http\Controllers\ProductController::class, 'edit'])->name('products.edit')->middleware('permission:edit-products');
            Route::post('/products', [\App\Http\Controllers\ProductController::class, 'store'])->name('products.store')->middleware('permission:create-products');
            Route::put('/products/{product}', [\App\Http\Controllers\ProductController::class, 'update'])->name('products.update')->middleware('permission:edit-products');
            Route::delete('/products/{product}', [\App\Http\Controllers\ProductController::class, 'destroy'])->name('products.destroy')->middleware('permission:delete-products');
            Route::put('/products/{product}/toggle-status', [\App\Http\Controllers\ProductController::class, 'toggleStatus'])->name('products.toggle-status')->middleware('permission:manage-product-status');
            Route::get('/products/file/export', [\App\Http\Controllers\ProductController::class, 'fileExport'])->name('product.export')->middleware('permission:export-products');
            Route::get('/products/export', [\App\Http\Controllers\ProductController::class, 'export'])->name('products.export')->middleware('permission:export-products');
            Route::post('/products/import', [\App\Http\Controllers\ProductController::class, 'import'])->name('products.import')->middleware('permission:import-products');
            Route::get('/products/{product}', [\App\Http\Controllers\ProductController::class, 'show'])->name('products.show');
        });

        // Barcode Print routes
        Route::middleware(['auth', 'permission:view-products'])->group(function () {
            Route::get('/barcode-print', [\App\Http\Controllers\BarcodePrintController::class, 'index'])->name('barcode-print.index');
        });

        // Expense Category Management routes
        Route::middleware(['auth', 'permission:view-expense-categories'])->group(function () {
            Route::get('/expense-categories', [\App\Http\Controllers\ExpenseCategoryController::class, 'index'])->name('expense-categories.index');
            Route::post('/expense-categories', [\App\Http\Controllers\ExpenseCategoryController::class, 'store'])->name('expense-categories.store')->middleware('permission:create-expense-categories');
            Route::put('/expense-categories/{expenseCategory}', [\App\Http\Controllers\ExpenseCategoryController::class, 'update'])->name('expense-categories.update')->middleware('permission:edit-expense-categories');
            Route::delete('/expense-categories/{expenseCategory}', [\App\Http\Controllers\ExpenseCategoryController::class, 'destroy'])->name('expense-categories.destroy')->middleware('permission:delete-expense-categories');
            Route::put('/expense-categories/{expenseCategory}/toggle-status', [\App\Http\Controllers\ExpenseCategoryController::class, 'toggleStatus'])->name('expense-categories.toggle-status')->middleware('permission:manage-expense-category-status');
        });

        // Expense Management routes
        Route::middleware(['auth', 'permission:view-expenses'])->group(function () {
            Route::get('/expenses', [\App\Http\Controllers\ExpenseController::class, 'index'])->name('expenses.index');
            Route::post('/expenses', [\App\Http\Controllers\ExpenseController::class, 'store'])->name('expenses.store')->middleware('permission:create-expenses');
            Route::put('/expenses/{expense}', [\App\Http\Controllers\ExpenseController::class, 'update'])->name('expenses.update')->middleware('permission:edit-expenses');
            Route::delete('/expenses/{expense}', [\App\Http\Controllers\ExpenseController::class, 'destroy'])->name('expenses.destroy')->middleware('permission:delete-expenses');
            Route::put('/expenses/{expense}/approve', [\App\Http\Controllers\ExpenseController::class, 'approve'])->name('expenses.approve')->middleware('permission:approve-expenses');
            Route::put('/expenses/{expense}/reject', [\App\Http\Controllers\ExpenseController::class, 'reject'])->name('expenses.reject')->middleware('permission:reject-expenses');
            Route::get('/expenses/file/export', [\App\Http\Controllers\ExpenseController::class, 'fileExport'])->name('expense.export')->middleware('permission:export-expenses');
            Route::get('/expenses/export', [\App\Http\Controllers\ExpenseController::class, 'export'])->name('expenses.export')->middleware('permission:export-expenses');
            Route::post('/expenses/import', [\App\Http\Controllers\ExpenseController::class, 'import'])->name('expenses.import')->middleware('permission:import-expenses');
        });

        // POS Management routes
        Route::middleware(['auth', 'permission:view-pos'])->group(function () {
            Route::get('/pos', [\App\Http\Controllers\PosController::class, 'index'])->name('pos.index');
            Route::get('/api/pos/products', [\App\Http\Controllers\PosController::class, 'getProducts'])->name('pos.products');
            Route::get('/api/pos/customers', [\App\Http\Controllers\PosController::class, 'getCustomers'])->name('pos.customers');
            Route::get('/api/pos/filters', [\App\Http\Controllers\PosController::class, 'getFilters'])->name('pos.filters');

            Route::post('/api/pos/sales', [\App\Http\Controllers\SaleController::class, 'store'])->name('pos.sales.store')->middleware('permission:create-sales');

            // POS Cart routes
            Route::post('/api/pos/cart', [\App\Http\Controllers\PosCartController::class, 'getOrCreate'])->name('pos.cart.get-or-create');
            Route::post('/api/pos/cart/{cart}/items', [\App\Http\Controllers\PosCartController::class, 'upsertItem'])->name('pos.cart.upsert-item');
            Route::delete('/api/pos/cart/{cart}/items/{item}', [\App\Http\Controllers\PosCartController::class, 'removeItem'])->name('pos.cart.remove-item');
            Route::patch('/api/pos/cart/{cart}', [\App\Http\Controllers\PosCartController::class, 'update'])->name('pos.cart.update');
            Route::post('/api/pos/cart/{cart}/customer', [\App\Http\Controllers\PosCartController::class, 'update'])->name('pos.cart.set-customer');
            Route::delete('/api/pos/cart/{cart}/items', [\App\Http\Controllers\PosCartController::class, 'clearItems'])->name('pos.cart.clear');

            Route::post('/api/pos/sessions', [\App\Http\Controllers\PosSessionController::class, 'store'])->name('pos.sessions.store')->middleware('permission:manage-pos-sessions');
            Route::put('/api/pos/sessions/{session}/close', [\App\Http\Controllers\PosSessionController::class, 'close'])->name('pos.sessions.close')->middleware('permission:manage-pos-sessions');
            Route::delete('/api/pos/sessions/{session}', [\App\Http\Controllers\PosSessionController::class, 'destroy'])->name('pos.sessions.destroy')->middleware('permission:manage-pos-sessions');
            Route::get('/api/pos/sessions', [\App\Http\Controllers\PosSessionController::class, 'index'])->name('pos.sessions.index')->middleware('permission:manage-pos-sessions');
            Route::get('/api/pos/sessions/{session}', [\App\Http\Controllers\PosSessionController::class, 'show'])->name('pos.sessions.show')->middleware('permission:manage-pos-sessions');
        });

        // Sales Management routes
        Route::middleware(['auth', 'permission:view-sales'])->group(function () {
            Route::get('/sales', [\App\Http\Controllers\SaleController::class, 'index'])->name('sales.index');
            Route::get('/sales/{sale}', [\App\Http\Controllers\SaleController::class, 'show'])->name('sales.show')->middleware('permission:view-sales');
            Route::get('/sales/file/export', [\App\Http\Controllers\SaleController::class, 'fileExport'])->name('sale.export')->middleware('permission:export-sales');
        });

        // Purchase Management routes
        Route::middleware(['auth', 'permission:view-purchases'])->group(function () {
            Route::get('/purchases', [\App\Http\Controllers\PurchaseController::class, 'index'])->name('purchases.index');
            Route::get('/purchases/create', [\App\Http\Controllers\PurchaseController::class, 'create'])->name('purchases.create')->middleware('permission:create-purchases');
            Route::get('/purchases/file/export', [\App\Http\Controllers\PurchaseController::class, 'fileExport'])->name('purchase.export')->middleware('permission:export-purchases');
            Route::get('/purchases/export', [\App\Http\Controllers\PurchaseController::class, 'export'])->name('purchases.export')->middleware('permission:export-purchases');
            Route::get('/purchases/{purchase}', [\App\Http\Controllers\PurchaseController::class, 'show'])->name('purchases.show')->middleware('permission:view-purchases');
            Route::get('/purchases/{purchase}/edit', [\App\Http\Controllers\PurchaseController::class, 'edit'])->name('purchases.edit')->middleware('permission:edit-purchases');
            Route::post('/purchases', [\App\Http\Controllers\PurchaseController::class, 'store'])->name('purchases.store')->middleware('permission:create-purchases');
            Route::put('/purchases/{purchase}', [\App\Http\Controllers\PurchaseController::class, 'update'])->name('purchases.update')->middleware('permission:edit-purchases');
            Route::delete('/purchases/{purchase}', [\App\Http\Controllers\PurchaseController::class, 'destroy'])->name('purchases.destroy')->middleware('permission:delete-purchases');
            Route::put('/purchases/{purchase}/toggle-status', [\App\Http\Controllers\PurchaseController::class, 'toggleStatus'])->name('purchases.toggle-status')->middleware('permission:manage-purchase-status');
        });

        // Purchase Return Management routes
        Route::middleware(['auth', 'permission:view-purchase-returns'])->group(function () {
            Route::get('/purchase-returns', [\App\Http\Controllers\PurchaseReturnController::class, 'index'])->name('purchase-returns.index');
            Route::get('/purchase-returns/create', [\App\Http\Controllers\PurchaseReturnController::class, 'create'])->name('purchase-returns.create')->middleware('permission:create-purchase-returns');
            Route::post('/purchase-returns', [\App\Http\Controllers\PurchaseReturnController::class, 'store'])->name('purchase-returns.store')->middleware('permission:create-purchase-returns');
            Route::get('/purchase-returns/{purchaseReturn}', [\App\Http\Controllers\PurchaseReturnController::class, 'show'])->name('purchase-returns.show')->middleware('permission:view-purchase-returns');
            Route::get('/purchase-returns/{purchaseReturn}/edit', [\App\Http\Controllers\PurchaseReturnController::class, 'edit'])->name('purchase-returns.edit')->middleware('permission:edit-purchase-returns');
            Route::put('/purchase-returns/{purchaseReturn}', [\App\Http\Controllers\PurchaseReturnController::class, 'update'])->name('purchase-returns.update')->middleware('permission:edit-purchase-returns');
            Route::delete('/purchase-returns/{purchaseReturn}', [\App\Http\Controllers\PurchaseReturnController::class, 'destroy'])->name('purchase-returns.destroy')->middleware('permission:delete-purchase-returns');
            Route::post('/purchase-returns/{purchaseReturn}/approve', [\App\Http\Controllers\PurchaseReturnController::class, 'approve'])->name('purchase-returns.approve')->middleware(['permission:approve-purchase-returns', \App\Http\Middleware\DemoModeMiddleware::class]);
            Route::post('/purchase-returns/{purchaseReturn}/reject', [\App\Http\Controllers\PurchaseReturnController::class, 'reject'])->name('purchase-returns.reject')->middleware('permission:reject-purchase-returns');
        });

        // Sale Return Management routes
        Route::middleware(['auth', 'permission:view-sale-returns'])->group(function () {
            Route::get('/sale-returns', [\App\Http\Controllers\SaleReturnController::class, 'index'])->name('sale-returns.index');
            Route::get('/sale-returns/create', [\App\Http\Controllers\SaleReturnController::class, 'create'])->name('sale-returns.create')->middleware('permission:create-sale-returns');
            Route::post('/sale-returns', [\App\Http\Controllers\SaleReturnController::class, 'store'])->name('sale-returns.store')->middleware('permission:create-sale-returns');
            Route::get('/sale-returns/{saleReturn}', [\App\Http\Controllers\SaleReturnController::class, 'show'])->name('sale-returns.show')->middleware('permission:view-sale-returns');
            Route::get('/sale-returns/{saleReturn}/edit', [\App\Http\Controllers\SaleReturnController::class, 'edit'])->name('sale-returns.edit')->middleware('permission:edit-sale-returns');
            Route::put('/sale-returns/{saleReturn}', [\App\Http\Controllers\SaleReturnController::class, 'update'])->name('sale-returns.update')->middleware('permission:edit-sale-returns');
            Route::delete('/sale-returns/{saleReturn}', [\App\Http\Controllers\SaleReturnController::class, 'destroy'])->name('sale-returns.destroy')->middleware('permission:delete-sale-returns');
            Route::post('/sale-returns/{saleReturn}/approve', [\App\Http\Controllers\SaleReturnController::class, 'approve'])->name('sale-returns.approve')->middleware(['permission:approve-sale-returns', \App\Http\Middleware\DemoModeMiddleware::class]);
            Route::post('/sale-returns/{saleReturn}/reject', [\App\Http\Controllers\SaleReturnController::class, 'reject'])->name('sale-returns.reject')->middleware('permission:reject-sale-returns');
            Route::get('/sale-returns/file/export', [\App\Http\Controllers\SaleReturnController::class, 'fileExport'])->name('sale-return.export')->middleware('permission:export-sale-returns');
        });

        // Quotation Management routes
        Route::middleware(['auth', 'permission:view-quotations'])->group(function () {
            Route::get('/quotations', [\App\Http\Controllers\QuotationController::class, 'index'])->name('quotations.index');
            Route::get('/quotations/create', [\App\Http\Controllers\QuotationController::class, 'create'])->name('quotations.create')->middleware('permission:create-quotations');
            Route::post('/quotations', [\App\Http\Controllers\QuotationController::class, 'store'])->name('quotations.store')->middleware('permission:create-quotations');
            Route::get('/quotations/{quotation}', [\App\Http\Controllers\QuotationController::class, 'show'])->name('quotations.show')->middleware('permission:view-quotations');
            Route::get('/quotations/{quotation}/edit', [\App\Http\Controllers\QuotationController::class, 'edit'])->name('quotations.edit')->middleware('permission:edit-quotations');
            Route::put('/quotations/{quotation}', [\App\Http\Controllers\QuotationController::class, 'update'])->name('quotations.update')->middleware('permission:edit-quotations');
            Route::delete('/quotations/{quotation}', [\App\Http\Controllers\QuotationController::class, 'destroy'])->name('quotations.destroy')->middleware('permission:delete-quotations');
            Route::post('/quotations/{quotation}/approve', [\App\Http\Controllers\QuotationController::class, 'approve'])->name('quotations.approve')->middleware('permission:approve-quotations');
            Route::post('/quotations/{quotation}/reject', [\App\Http\Controllers\QuotationController::class, 'reject'])->name('quotations.reject')->middleware('permission:reject-quotations');
            Route::post('/quotations/{quotation}/send', [\App\Http\Controllers\QuotationController::class, 'send'])->name('quotations.send')->middleware('permission:send-quotations');
            Route::post('/quotations/{quotation}/convert-to-sale', [\App\Http\Controllers\QuotationController::class, 'convertToSale'])->name('quotations.convert-to-sale')->middleware('permission:convert-quotations');
            Route::post('/quotations/{quotation}/share', [\App\Http\Controllers\QuotationController::class, 'share'])->name('quotations.share');
            Route::get('/quotations/file/export', [\App\Http\Controllers\QuotationController::class, 'fileExport'])->name('quotation.export')->middleware('permission:export-quotations');
            // Route::get('/quotations/export', [\App\Http\Controllers\QuotationController::class, 'export'])->name('quotations.export')->middleware('permission:export-quotations');
        });

        // Reports routes
        Route::middleware(['auth', 'permission:view-reports'])->group(function () {
            Route::get('/reports/sales', [\App\Http\Controllers\ReportController::class, 'salesReport'])->name('reports.sales');
            Route::get('/reports/financial', [\App\Http\Controllers\ReportController::class, 'financialReport'])->name('reports.financial');
            Route::get('/reports/inventory', [\App\Http\Controllers\ReportController::class, 'inventoryReport'])->name('reports.inventory');
            Route::get('/reports/customer-analytics', [\App\Http\Controllers\ReportController::class, 'customerAnalytics'])->name('reports.customer-analytics');
            Route::get('/reports/tax', [\App\Http\Controllers\ReportController::class, 'taxReport'])->name('reports.tax');
            Route::get('/reports/purchase', [\App\Http\Controllers\ReportController::class, 'purchaseReport'])->name('reports.purchase');
            Route::get('/reports/expense', [\App\Http\Controllers\ReportController::class, 'expenseReport'])->name('reports.expense');
            Route::get('/reports/vendor', [\App\Http\Controllers\ReportController::class, 'vendorReport'])->name('reports.vendor');

            // Export routes
            Route::get('/reports/sales/export', [\App\Http\Controllers\ReportController::class, 'exportSalesReport'])->name('reports.sales.export')->middleware('permission:export-reports');
            Route::get('/reports/financial/export', [\App\Http\Controllers\ReportController::class, 'exportFinancialReport'])->name('reports.financial.export')->middleware('permission:export-reports');
            Route::get('/reports/inventory/export', [\App\Http\Controllers\ReportController::class, 'exportInventoryReport'])->name('reports.inventory.export')->middleware('permission:export-reports');
            Route::get('/reports/customer-analytics/export', [\App\Http\Controllers\ReportController::class, 'exportCustomerAnalytics'])->name('reports.customer-analytics.export')->middleware('permission:export-reports');
            Route::get('/reports/tax/export', [\App\Http\Controllers\ReportController::class, 'exportTaxReport'])->name('reports.tax.export')->middleware('permission:export-reports');
            Route::get('/reports/purchase/export', [\App\Http\Controllers\ReportController::class, 'exportPurchaseReport'])->name('reports.purchase.export')->middleware('permission:export-reports');
            Route::get('/reports/expense/export', [\App\Http\Controllers\ReportController::class, 'exportExpenseReport'])->name('reports.expense.export')->middleware('permission:export-reports');
            Route::get('/reports/vendor/export', [\App\Http\Controllers\ReportController::class, 'exportVendorReport'])->name('reports.vendor.export')->middleware('permission:export-reports');
        });

        // Export/Import routes - moved to individual controllers
        // Route::middleware(['auth'])->group(function () {
        //     Route::get('/export/{type}', [\App\Http\Controllers\ExportImportController::class, 'export'])->name('export');
        //     Route::post('/import/{type}', [\App\Http\Controllers\ExportImportController::class, 'import'])->name('import');
        //     Route::get('/template/{type}', [\App\Http\Controllers\ExportImportController::class, 'getTemplate'])->name('template');

        //     // Two-step import routes (old Laravel style)
        //     Route::post('csv/import', [\App\Http\Controllers\ExportImportController::class, 'fileImport'])->name('csv.import');
        //     Route::get('import/csv/modal/', [\App\Http\Controllers\ExportImportController::class, 'fileImportModal'])->name('csv.import.modal');
        //     Route::post('/import/process', [\App\Http\Controllers\ExportImportController::class, 'processImport'])->name('import.process');
        //     Route::post('/customers/import/data', [\App\Http\Controllers\ExportImportController::class, 'importData'])->name('customers.import.data');
        //     Route::post('/products/import/data', [\App\Http\Controllers\ExportImportController::class, 'importData'])->name('products.import.data');
        //     Route::post('/vendors/import/data', [\App\Http\Controllers\ExportImportController::class, 'importData'])->name('vendors.import.data');

        //     // Sample data management routes
        //     Route::get('/sample-data/{action?}', [\App\Http\Controllers\ExportImportController::class, 'manageSampleData'])->name('sample-data.manage');
        //     Route::post('/sample-data/{action}', [\App\Http\Controllers\ExportImportController::class, 'manageSampleData'])->name('sample-data.action');
        // });

        // Notification Management routes
        Route::middleware(['auth', 'permission:view-notifications'])->group(function () {
            Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.index');
            Route::get('/notifications/create', [\App\Http\Controllers\NotificationController::class, 'create'])->name('notifications.create')->middleware('permission:create-notifications');
            Route::post('/notifications', [\App\Http\Controllers\NotificationController::class, 'store'])->name('notifications.store')->middleware('permission:create-notifications');
            Route::get('/notifications/{notification}', [\App\Http\Controllers\NotificationController::class, 'show'])->name('notifications.show')->middleware('permission:view-notifications');
            Route::get('/notifications/{notification}/edit', [\App\Http\Controllers\NotificationController::class, 'edit'])->name('notifications.edit')->middleware('permission:edit-notifications');
            Route::put('/notifications/{notification}', [\App\Http\Controllers\NotificationController::class, 'update'])->name('notifications.update')->middleware('permission:edit-notifications');
            Route::delete('/notifications/{notification}', [\App\Http\Controllers\NotificationController::class, 'destroy'])->name('notifications.destroy')->middleware('permission:delete-notifications');
            Route::put('/notifications/{notification}/toggle-status', [\App\Http\Controllers\NotificationController::class, 'toggleStatus'])->name('notifications.toggle-status')->middleware('permission:manage-notification-status');
        });

        // Notification Template routes
        Route::middleware(['auth', 'permission:view-notification-templates'])->group(function () {
            Route::get('/notification-templates', [NotificationTemplateController::class, 'index'])->name('notification-templates.index');
            Route::get('/notification-templates/{notificationTemplate}', [NotificationTemplateController::class, 'show'])->name('notification-templates.show');
            Route::put('/notification-templates/{notificationTemplate}/settings', [NotificationTemplateController::class, 'updateSettings'])->name('notification-templates.update-settings')->middleware('permission:manage-notification-template-settings');
            Route::put('/notification-templates/{notificationTemplate}/content', [NotificationTemplateController::class, 'updateContent'])->name('notification-templates.update-content')->middleware('permission:edit-notification-templates');
        });

        // Branch Sales Target Management routes
        Route::middleware(['auth', 'permission:manage_branch_sales_target'])->group(function () {
            Route::get('/branch-sales-targets', [\App\Http\Controllers\BranchSalesTargetController::class, 'index'])->name('branch-sales-targets.index');
            Route::post('/branch-sales-targets', [\App\Http\Controllers\BranchSalesTargetController::class, 'store'])->name('branch-sales-targets.store')->middleware('permission:create_branch_sales_target');
            Route::put('/branch-sales-targets/{targetId}', [\App\Http\Controllers\BranchSalesTargetController::class, 'update'])->name('branch-sales-targets.update')->middleware('permission:edit_branch_sales_target');
            Route::delete('/branch-sales-targets/{targetId}', [\App\Http\Controllers\BranchSalesTargetController::class, 'destroy'])->name('branch-sales-targets.destroy')->middleware('permission:delete_branch_sales_target');
        });

        // Impersonation routes
        Route::middleware('App\Http\Middleware\SuperAdminMiddleware')->group(function () {
            Route::get('impersonate/{userId}', [ImpersonateController::class, 'start'])->name('impersonate.start');
        });
    });

    // End plan.access middleware group
    Route::post('impersonate/leave', [ImpersonateController::class, 'leave'])->name('impersonate.leave');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';

// Webhook routes
Route::middleware(['auth', 'verified', 'plan.access'])->group(function () {
    Route::get('settings/webhooks', [\App\Http\Controllers\WebhookController::class, 'index'])->name('settings.webhooks.index');
    Route::post('settings/webhooks', [\App\Http\Controllers\WebhookController::class, 'store'])->name('settings.webhooks.store');
    Route::put('settings/webhooks/{webhook}', [\App\Http\Controllers\WebhookController::class, 'update'])->name('settings.webhooks.update');
    Route::delete('settings/webhooks/{webhook}', [\App\Http\Controllers\WebhookController::class, 'destroy'])->name('settings.webhooks.destroy');
});

Route::match(['GET', 'POST'], 'payments/easebuzz/success', [EasebuzzPaymentController::class, 'success'])->name('easebuzz.success');
Route::post('payments/easebuzz/callback', [EasebuzzPaymentController::class, 'callback'])->name('easebuzz.callback');

// Cookie consent routes
Route::post('cookie/consent', [\App\Http\Controllers\CookieConsentController::class, 'store'])->name('cookie.consent.store');
Route::middleware(['auth', 'verified', 'plan.access'])->group(function () {
    Route::get('cookie/consent/download', [\App\Http\Controllers\CookieConsentController::class, 'download'])->name('cookie.consent.download');
});



