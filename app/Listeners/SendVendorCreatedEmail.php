<?php

namespace App\Listeners;

use App\Events\VendorCreated;
use App\Services\EmailTemplateService;
use Exception;

class SendVendorCreatedEmail
{
    private static array $processedVendors = [];

    public function __construct(
        private EmailTemplateService $emailService
    ) {
    }

    public function handle(VendorCreated $event): void
    {
        $vendor = $event->vendor;

        $vendorKey = $vendor->id . '_' . ($vendor->updated_at ? $vendor->updated_at->timestamp : time());
        if (in_array($vendorKey, self::$processedVendors)) {
            return;
        }

        self::$processedVendors[] = $vendorKey;

        // Check if notification is enabled
        $userId = $vendor->created_by;
        $settingKey = 'email_notification_new_vendor';
        $setting = getSetting($settingKey, $userId);

        // Trigger webhook
        try {
            $webhookService = app(\App\Services\WebhookService::class);
            $webhookService->triggerWebhooks('New Vendor', $vendor->toArray(), $vendor->created_by);
        } catch (\Exception $e) {
            \Log::error('Vendor webhook failed: ' . $e->getMessage());
        }

        if ($setting !== '1' && $setting !== true) {
            return;
        }

        // Only send email if vendor has email address
        if (!$vendor->email) {
            return;
        }

        // Prepare email variables
        $variables = [
            '{app_url}' => config('app.url'),
            '{vendor_name}' => $vendor->name,
            '{vendor_email}' => $vendor->email,
            '{app_name}' => config('app.name'),
            '{created_date}' => $vendor->created_at->format('Y-m-d H:i:s'),
            '{company_name}' => $vendor->name,
        ];

        try {
            $userLanguage = auth()->user()->lang ?? 'en';

            // Send email to the vendor
            $this->emailService->sendTemplateEmailWithLanguage(
                templateName: 'New Vendor',
                variables: $variables,
                toEmail: $vendor->email,
                toName: $vendor->name,
                language: $userLanguage
            );
        } catch (\Exception $e) {
            \Log::error('Failed to send vendor email: ' . $e->getMessage());
            session()->flash('email_error', 'Failed to send vendor email: ' . $e->getMessage());
        }
    }
}
