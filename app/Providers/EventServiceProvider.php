<?php

namespace App\Providers;

use App\Events\BranchCreated;
use App\Events\CustomerCreated;
use App\Events\ExpenseCreated;
use App\Events\PurchaseCreate;
use App\Events\PurchaseCreated;
use App\Events\PurchaseReturnCreated;
use App\Events\QuotationCreated;
use App\Events\SaleCreate;
use App\Events\SaleReturnCreated;
use App\Events\SendQuotation;
use App\Events\UserCreated;
use App\Events\VendorCreate;
use App\Events\VendorCreated;
use App\Listeners\SendBranchCreatedEmail;
use App\Listeners\SendCustomerCreatedEmail;
use App\Listeners\SendExpenseCreatedEmail;
use App\Listeners\SendPurchaseCreatedEmail;
use App\Listeners\SendPurchaseReturnCreatedEmail;
use App\Listeners\SendQuotationCreatedEmail;
use App\Listeners\SendQuotationEmail;
use App\Listeners\SendSaleReturnCreatedEmail;
use App\Listeners\SendUserCreatedEmail;
use App\Listeners\SendVendorCreatedEmail;
use App\Listeners\SlackCustomerCreateListener;
use App\Listeners\SlackPurchaseCreateListener;
use App\Listeners\SlackSaleCreateListener;
use App\Listeners\SlackExpenseCreateListener;
use App\Listeners\SlackQuotationCreateListener;
use App\Listeners\SlackSendQuotationListener;
use App\Listeners\SlackVendorCreateListener;
use App\Listeners\TwilioCustomerCreateListener;
use App\Listeners\TwilioPurchaseCreateListener;
use App\Listeners\TwilioQuotationCreateListener;
use App\Listeners\TwilioSaleCreateListener;
use App\Listeners\TwilioSendQuotationListener;
use App\Listeners\TwilioVendorCreateListener;
use App\Models\Customer;
use App\Models\Vendor;
use App\Models\Quotation;
use App\Models\Purchase;
use App\Models\Sale;
use App\Services\NotificationTemplateService;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        UserCreated::class => [
            SendUserCreatedEmail::class,
            \App\Listeners\SeedNotificationTemplatesForNewCompany::class,
        ],
        VendorCreated::class => [
            SendVendorCreatedEmail::class,
            SlackVendorCreateListener::class,
            TwilioVendorCreateListener::class,
        ],
        SaleCreate::class => [
            SlackSaleCreateListener::class,
            TwilioSaleCreateListener::class,
        ],
        PurchaseCreated::class => [
            SlackPurchaseCreateListener::class,
            SendPurchaseCreatedEmail::class,
            TwilioPurchaseCreateListener::class,
        ],
        CustomerCreated::class => [
            SendCustomerCreatedEmail::class,
            SlackCustomerCreateListener::class,
            TwilioCustomerCreateListener::class,
        ],
        BranchCreated::class => [
            SendBranchCreatedEmail::class,
        ],
        PurchaseCreated::class => [
            SendPurchaseCreatedEmail::class,
        ],
        PurchaseReturnCreated::class => [
            SendPurchaseReturnCreatedEmail::class,
        ],
        QuotationCreated::class => [
            SendQuotationCreatedEmail::class,
            SlackQuotationCreateListener::class,
            TwilioQuotationCreateListener::class,
        ],
        SendQuotation::class => [
            SendQuotationEmail::class,
            SlackSendQuotationListener::class,
            TwilioSendQuotationListener::class,
        ],
        SaleReturnCreated::class => [
            SendSaleReturnCreatedEmail::class,
        ],
        ExpenseCreated::class => [
            SendExpenseCreatedEmail::class,
            SlackExpenseCreateListener::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        // // SMS Notifications with error handling
        // Customer::created(function($customer) {
        //     try {
        //         \App\Services\NotificationTemplateService::sendSMS('new_customer', $customer);
        //     } catch (\Exception $e) {
        //         \Log::error('SMS notification failed for customer: ' . $e->getMessage());
        //     }
        // });

        // Vendor::created(function($vendor) {
        //     try {
        //         \App\Services\NotificationTemplateService::sendSMS('new_vendor', $vendor);
        //     } catch (\Exception $e) {
        //         \Log::error('SMS notification failed for vendor: ' . $e->getMessage());
        //     }
        // });

        // Quotation::created(function($quotation) {
        //     try {
        //         \App\Services\NotificationTemplateService::sendSMS('new_quotation', $quotation->load('customer'));
        //     } catch (\Exception $e) {
        //         \Log::error('SMS notification failed for quotation: ' . $e->getMessage());
        //     }
        // });

        // Purchase::created(function($purchase) {
        //     try {
        //         \App\Services\NotificationTemplateService::sendSMS('new_purchase', $purchase->load('vendor'));
        //     } catch (\Exception $e) {
        //         \Log::error('SMS notification failed for purchase: ' . $e->getMessage());
        //     }
        // });

        // Sale::created(function($sale) {
        //     try {
        //         \App\Services\NotificationTemplateService::sendSMS('new_sales', $sale->load('customer'));
        //     } catch (\Exception $e) {
        //         \Log::error('SMS notification failed for sale: ' . $e->getMessage());
        //     }
        // });

        // Webhook integrations
        \App\Models\Quotation::created(function ($quotation) {
            try {
                $webhookService = app(\App\Services\WebhookService::class);
                $webhookService->triggerWebhooks('New Quote', $quotation->toArray(), $quotation->created_by);
            } catch (\Exception $e) {
                \Log::error('Quotation webhook failed: ' . $e->getMessage());
                // Don't let webhook failures break the application
            }
        });
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
