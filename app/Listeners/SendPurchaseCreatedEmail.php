<?php

namespace App\Listeners;

use App\Events\PurchaseCreated;
use App\Services\EmailTemplateService;
use Exception;

class SendPurchaseCreatedEmail
{
    private static array $processedPurchases = [];

    public function __construct(
        private EmailTemplateService $emailService
    ) {
    }

    public function handle(PurchaseCreated $event): void
    {
        $purchase = $event->purchase;

        $purchaseKey = $purchase->id . '_' . ($purchase->updated_at ? $purchase->updated_at->timestamp : time());
        if (in_array($purchaseKey, self::$processedPurchases)) {
            return;
        }

        self::$processedPurchases[] = $purchaseKey;

        // Trigger webhook regardless of email settings
        try {
            $webhookService = app(\App\Services\WebhookService::class);
            $webhookService->triggerWebhooks('New Purchase', $purchase->toArray(), $purchase->created_by);
        } catch (\Exception $e) {
            \Log::error('Purchase webhook failed: ' . $e->getMessage());
        }

        if (!$purchase->vendor->email) {
            return;
        }

        $userId = $purchase->created_by;
        $setting = getSetting('email_notification_new_purchase', $userId);

        if ($setting !== '1' && $setting !== true) {
            return;
        }

        $variables = [
            '{purchase_number}' => $purchase->purchase_number,
            '{vendor_name}' => $purchase->vendor->name,
            '{vendor_email}' => $purchase->vendor->email,
            '{purchase_date}' => $purchase->purchase_date->format('Y-m-d'),
            '{total_amount}' => number_format($purchase->total_amount, 2),
            '{company_name}' => auth()->user()->name ?? 'Company',
            '{created_date}' => $purchase->created_at->format('Y-m-d H:i:s'),
        ];

        try {
            // Get company's current language
                       $userLanguage = auth()->user()->lang ?? 'en';

            $this->emailService->sendTemplateEmailWithLanguage(
                templateName: 'New Purchase',
                variables: $variables,
                toEmail: $purchase->vendor->email,
                toName: $purchase->vendor->name,
                language: $userLanguage
            );

        } catch (Exception $e) {
            \Log::error('Purchase email failed: ' . $e->getMessage());
        }
    }
}
