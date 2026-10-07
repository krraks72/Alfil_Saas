<?php

namespace App\Listeners;

use App\Events\PurchaseReturnCreated;
use App\Services\EmailTemplateService;
use Exception;

class SendPurchaseReturnCreatedEmail
{
    private static array $processedPurchaseReturns = [];

    public function __construct(
        private EmailTemplateService $emailService
    ) {
    }

    public function handle(PurchaseReturnCreated $event): void
    {
        $purchaseReturn = $event->purchaseReturn;

        $returnKey = $purchaseReturn->id . '_' . ($purchaseReturn->updated_at ? $purchaseReturn->updated_at->timestamp : time());
        if (in_array($returnKey, self::$processedPurchaseReturns)) {
            return;
        }

        self::$processedPurchaseReturns[] = $returnKey;

        // Trigger webhook regardless of email settings
        try {
            $webhookService = app(\App\Services\WebhookService::class);
            $webhookService->triggerWebhooks('New Purchase Return', $purchaseReturn->toArray(), $purchaseReturn->created_by);
        } catch (\Exception $e) {
            \Log::error('Purchase return webhook failed: ' . $e->getMessage());
        }

        // Get vendor from purchase relationship
        $vendor = $purchaseReturn->purchase->vendor;

        if (!$vendor->email) {
            return;
        }

        $userId = $purchaseReturn->created_by;
        $setting = getSetting('email_notification_new_purchase_return', $userId);

        if ($setting !== '1' && $setting !== true) {
            return;
        }

        $variables = [
            '{return_number}' => $purchaseReturn->return_number,
            '{purchase_number}' => $purchaseReturn->purchase->purchase_number,
            '{vendor_name}' => $vendor->name,
            '{vendor_email}' => $vendor->email,
            '{return_date}' => $purchaseReturn->return_date->format('Y-m-d'),
            '{total_amount}' => number_format($purchaseReturn->grand_total, 2),
            '{reason}' => $purchaseReturn->reason ?: 'Not specified',
            '{company_name}' => auth()->user()->name ?? 'Company',
            '{created_date}' => $purchaseReturn->created_at->format('Y-m-d H:i:s'),
        ];

        try {
            // Get company's current language
                   $userLanguage = auth()->user()->lang ?? 'en';

            $this->emailService->sendTemplateEmailWithLanguage(
                templateName: 'New Purchase Return',
                variables: $variables,
                toEmail: $vendor->email,
                toName: $vendor->name,
                language: $userLanguage
            );

        } catch (Exception $e) {
            \Log::error('Purchase return email failed: ' . $e->getMessage());
        }
    }
}
