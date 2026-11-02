<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\EmailSettingController;
use App\Http\Controllers\Settings\TwilioSettingController;
use App\Http\Controllers\Settings\SlackSettingController;
use App\Http\Controllers\Settings\CompanySettingController;
use App\Http\Controllers\Settings\SettingsController;
use App\Http\Controllers\Settings\SystemSettingsController;
use App\Http\Controllers\Settings\CurrencySettingController;
use App\Http\Controllers\PlanOrderController;
use App\Http\Controllers\Settings\PaymentSettingController;
use App\Models\NotificationTemplate;
use App\Models\Setting;


use App\Http\Controllers\StripePaymentController;
use App\Http\Controllers\PayPalPaymentController;
use App\Http\Controllers\BankPaymentController;
use App\Http\Controllers\Settings\GoogleCalendarSettingController;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Settings Routes
|--------------------------------------------------------------------------
|
| Here are the routes for settings management
|
*/

// Payment routes accessible without plan check
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/payment-methods', [PaymentSettingController::class, 'getPaymentMethods'])->name('payment.methods');
    Route::get('/enabled-payment-methods', [PaymentSettingController::class, 'getEnabledMethods'])->name('payment.enabled-methods');
    Route::post('/plan-orders', [PlanOrderController::class, 'create'])->name('plan-orders.create');
    Route::post('/stripe-payment', [StripePaymentController::class, 'processPayment'])->name('settings.stripe.payment');
});

Route::middleware(['auth', 'verified', 'plan.access'])->group(function () {
    // Payment Settings (admin only)
    Route::post('/payment-settings', [PaymentSettingController::class, 'store'])->name('payment.settings');

    // Profile settings page with profile and password sections
    Route::get('profile', function () {
        return Inertia::render('settings/profile-settings');
    })->name('profile');

    // Routes for form submissions
    Route::patch('profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('profile', [ProfileController::class, 'update']); // For file uploads with method spoofing
    Route::delete('profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::put('profile/password', [PasswordController::class, 'update'])->name('password.update');

    // Email settings page
    Route::get('settings/email', function () {
        return Inertia::render('settings/components/email-settings');
    })->name('settings.email');

    // Email settings routes
    Route::get('settings/email/get', [EmailSettingController::class, 'getEmailSettings'])->name('settings.email.get');
    Route::post('settings/email/update', [EmailSettingController::class, 'updateEmailSettings'])->name('settings.email.update');
    Route::post('settings/email/test', [EmailSettingController::class, 'sendTestEmail'])->name('settings.email.test');

    // Company Settings routes
    Route::post('settings/company', [CompanySettingController::class, 'update'])->name('settings.company.update');

    // General settings page with system and company settings
    Route::get('settings', [SettingsController::class, 'index'])->name('settings');

    // System Settings routes
    Route::post('settings/system', [SystemSettingsController::class, 'update'])->name('settings.system.update');
    Route::post('settings/brand', [SystemSettingsController::class, 'updateBrand'])
        ->name('settings.brand.update')
        ->withoutMiddleware([\App\Http\Middleware\DemoModeMiddleware::class]);
    Route::post('settings/storage', [SystemSettingsController::class, 'updateStorage'])->name('settings.storage.update');
    Route::post('settings/recaptcha', [SystemSettingsController::class, 'updateRecaptcha'])->name('settings.recaptcha.update');
    Route::post('settings/chatgpt', [SystemSettingsController::class, 'updateChatgpt'])->name('settings.chatgpt.update');
    Route::post('settings/cookie', [SystemSettingsController::class, 'updateCookie'])->name('settings.cookie.update');
    Route::post('settings/cookie', [SystemSettingsController::class, 'updateCookie'])->name('settings.cookie.update');
    Route::post('settings/seo', [SystemSettingsController::class, 'updateSeo'])->name('settings.seo.update');
    Route::post('settings/cache/clear', [SystemSettingsController::class, 'clearCache'])->name('settings.cache.clear');

    // Currency Settings routes
    Route::post('settings/currency', [CurrencySettingController::class, 'update'])->name('settings.currency.update');

    // Email Notification Settings routes
    Route::post('settings/email-notifications', [SettingsController::class, 'updateEmailNotifications'])->name('settings.email-notifications.update');

    // Slack Settings routes
    Route::get('settings/slack-config/get', [SlackSettingController::class, 'getConfig'])->name('settings.slack-config.get');
    Route::get('settings/slack-notifications/get', [SlackSettingController::class, 'getNotifications'])->name('settings.slack-notifications.get');
    Route::get('settings/slack-notifications/available', [SlackSettingController::class, 'getAvailableNotifications'])->name('settings.slack-notifications.available');
    Route::post('settings/slack-notifications/update', [SlackSettingController::class, 'update'])->name('settings.slack-notifications.update');
    Route::post('slack/test-webhook', [SlackSettingController::class, 'testWebhook'])->name('slack.test-webhook');

    // Twilio Settings routes
    Route::get('settings/twilio-notifications/get', [TwilioSettingController::class, 'getNotifications'])->name('settings.twilio-notifications.get');
    Route::get('settings/twilio-notifications/available', [TwilioSettingController::class, 'getAvailableNotifications'])->name('settings.twilio-notifications.available');
    Route::post('settings/twilio/update', [TwilioSettingController::class, 'update'])->name('settings.twilio.update');
    Route::post('settings/twilio/test', [TwilioSettingController::class, 'test'])->name('settings.twilio.test');

    // Zoom Settings routes
    Route::post('settings/zoom', [\App\Http\Controllers\Settings\ZoomSettingsController::class, 'update'])->name('settings.zoom.update');

    // Google Calendar settings routes
    Route::post('settings/google-calendar', [GoogleCalendarSettingController::class, 'update'])->name('settings.google-calendar.update');
    Route::post('settings/google-calendar/sync',[GoogleCalendarSettingController::class, 'syncGoogleCalendar'])->name('settings.google-calendar.sync');

    // Purchase Invoice settings routes
    Route::post('settings/quotation-invoice', [\App\Http\Controllers\Settings\QuotationInvoiceSettingController::class, 'store'])->name('settings.quotation-invoice.store');
    Route::post('settings/aliaddo', [\App\Http\Controllers\Settings\AliaddoSettingController::class, 'store'])->name('settings.aliaddo.store');

    // Settings API route
    Route::get('settings/get-settings', [SettingsController::class, 'getSettings'])->name('settings.getSettings');

});
