<?php

namespace App\Listeners;

use App\Events\CustomerCreated;
use App\Services\EmailTemplateService;
use Exception;

class SendCustomerCreatedEmail
{
    private static array $processedCustomers = [];

    public function __construct(
        private EmailTemplateService $emailService
    ) {
    }

    public function handle(CustomerCreated $event): void
    {
        $customer = $event->customer;

        $customerKey = $customer->id . '_' . ($customer->updated_at ? $customer->updated_at->timestamp : time());
        if (in_array($customerKey, self::$processedCustomers)) {
            return;
        }

        self::$processedCustomers[] = $customerKey;

        // Trigger webhook regardless of email settings
        try {
            $webhookService = app(\App\Services\WebhookService::class);
            $webhookService->triggerWebhooks('New Customer', $customer->toArray(), $customer->created_by);
        } catch (\Exception $e) {
            \Log::error('Customer webhook failed: ' . $e->getMessage());
        }

        if (!$customer->email) {
            return;
        }

        $userId = $customer->created_by;
        $setting = getSetting('email_notification_new_customer', $userId);

        if ($setting !== '1' && $setting !== true) {
            return;
        }

        $variables = [
            '{customer_name}' => $customer->name,
            '{customer_email}' => $customer->email,
            '{company_name}' => auth()->user()->name ?? 'Company',
            '{created_date}' => $customer->created_at->format('Y-m-d H:i:s'),
        ];

        try {
            // Get customer's language or fallback to creator's language
            $userLanguage = auth()->user()->lang ?? 'en';
            $this->emailService->sendTemplateEmailWithLanguage(
                templateName: 'New Customer',
                variables: $variables,
                toEmail: $customer->email,
                toName: $customer->name,
                language: $userLanguage
            );

        } catch (Exception $e) {
            \Log::error('Customer email failed: ' . $e->getMessage());
        }
    }
}
