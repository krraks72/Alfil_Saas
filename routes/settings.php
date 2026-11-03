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
    Route::post('/payment-settings', [PaymentSettingController::class, 'store'])->name('payment.settings')->middleware('permission:manage-payment-settings');

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
    })->name('settings.email')->middleware('permission:manage-email-settings');

    // Email settings routes
    Route::get('settings/email/get', [EmailSettingController::class, 'getEmailSettings'])->name('settings.email.get')->middleware('permission:manage-email-settings');
    Route::post('settings/email/update', [EmailSettingController::class, 'updateEmailSettings'])->name('settings.email.update')->middleware('permission:manage-email-settings');
    Route::post('settings/email/test', [EmailSettingController::class, 'sendTestEmail'])->name('settings.email.test')->middleware('permission:manage-email-settings');

    // Company Settings routes
    Route::post('settings/company', [CompanySettingController::class, 'update'])->name('settings.company.update')->middleware('permission:manage-company-settings');

    // General settings page with system and company settings
    Route::get('settings', [SettingsController::class, 'index'])->name('settings');

    // System Settings routes
    Route::post('settings/system', [SystemSettingsController::class, 'update'])->name('settings.system.update')->middleware('permission:manage-system-settings');
    Route::post('settings/brand', [SystemSettingsController::class, 'updateBrand'])
        ->name('settings.brand.update')
        ->middleware('permission:manage-brand-settings')
        ->withoutMiddleware([\App\Http\Middleware\DemoModeMiddleware::class]);
    Route::post('settings/storage', [SystemSettingsController::class, 'updateStorage'])->name('settings.storage.update')->middleware('permission:manage-storage-settings');
    Route::post('settings/recaptcha', [SystemSettingsController::class, 'updateRecaptcha'])->name('settings.recaptcha.update')->middleware('permission:manage-recaptcha-settings');
    Route::post('settings/chatgpt', [SystemSettingsController::class, 'updateChatgpt'])->name('settings.chatgpt.update')->middleware('permission:manage-chatgpt-settings');
    Route::post('settings/cookie', [SystemSettingsController::class, 'updateCookie'])->name('settings.cookie.update')->middleware('permission:manage-cookie-settings');
    Route::post('settings/cookie', [SystemSettingsController::class, 'updateCookie'])->name('settings.cookie.update')->middleware('permission:manage-cookie-settings');
    Route::post('settings/seo', [SystemSettingsController::class, 'updateSeo'])->name('settings.seo.update')->middleware('permission:manage-seo-settings');
    Route::post('settings/cache/clear', [SystemSettingsController::class, 'clearCache'])->name('settings.cache.clear')->middleware('permission:manage-cache-settings');

    // Currency Settings routes
    Route::post('settings/currency', [CurrencySettingController::class, 'update'])->name('settings.currency.update')->middleware('permission:manage-currency-settings');

    // Email Notification Settings routes
    Route::post('settings/email-notifications', [SettingsController::class, 'updateEmailNotifications'])->name('settings.email-notifications.update')->middleware('permission:manage-email-notification-settings');

    // Slack Settings routes
    Route::get('settings/slack-config/get', [SlackSettingController::class, 'getConfig'])->name('settings.slack-config.get')->middleware('permission:manage-slack-settings');
    Route::get('settings/slack-notifications/get', [SlackSettingController::class, 'getNotifications'])->name('settings.slack-notifications.get')->middleware('permission:manage-slack-settings');
    Route::get('settings/slack-notifications/available', [SlackSettingController::class, 'getAvailableNotifications'])->name('settings.slack-notifications.available')->middleware('permission:manage-slack-settings');
    Route::post('settings/slack-notifications/update', [SlackSettingController::class, 'update'])->name('settings.slack-notifications.update')->middleware('permission:manage-slack-settings');
    Route::post('slack/test-webhook', [SlackSettingController::class, 'testWebhook'])->name('slack.test-webhook')->middleware('permission:manage-slack-settings');

    // Twilio Settings routes
    Route::get('settings/twilio-notifications/get', [TwilioSettingController::class, 'getNotifications'])->name('settings.twilio-notifications.get')->middleware('permission:manage-twilio-settings');
    Route::get('settings/twilio-notifications/available', [TwilioSettingController::class, 'getAvailableNotifications'])->name('settings.twilio-notifications.available')->middleware('permission:manage-twilio-settings');
    Route::post('settings/twilio/update', [TwilioSettingController::class, 'update'])->name('settings.twilio.update')->middleware('permission:manage-twilio-settings');
    Route::post('settings/twilio/test', [TwilioSettingController::class, 'test'])->name('settings.twilio.test')->middleware('permission:manage-twilio-settings');

    // Zoom Settings routes
    Route::post('settings/zoom', [\App\Http\Controllers\Settings\ZoomSettingsController::class, 'update'])->name('settings.zoom.update');

    // Google Calendar settings routes
    Route::post('settings/google-calendar', [GoogleCalendarSettingController::class, 'update'])->name('settings.google-calendar.update')->middleware('permission:manage-google-calendar-settings');
    Route::post('settings/google-calendar/sync',[GoogleCalendarSettingController::class, 'syncGoogleCalendar'])->name('settings.google-calendar.sync')->middleware('permission:manage-google-calendar-settings');

    // Purchase Invoice settings routes
    Route::post('settings/quotation-invoice', [\App\Http\Controllers\Settings\QuotationInvoiceSettingController::class, 'store'])->name('settings.quotation-invoice.store')->middleware('permission:manage-quotation-invoice-settings');
    Route::post('settings/aliaddo', [\App\Http\Controllers\Settings\AliaddoSettingController::class, 'store'])->name('settings.aliaddo.store')->middleware('permission:manage-aliaddo-settings');

    // Settings API route
    Route::get('settings/get-settings', [SettingsController::class, 'getSettings'])->name('settings.getSettings');

});
