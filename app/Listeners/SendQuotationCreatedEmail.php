<?php

namespace App\Listeners;

use App\Events\QuotationCreated;
use App\Services\EmailTemplateService;
use Exception;

class SendQuotationCreatedEmail
{
    private static array $processedQuotations = [];

    public function __construct(
        private EmailTemplateService $emailService
    ) {
    }

    public function handle(QuotationCreated $event): void
    {
        $quotation = $event->quotation;

        $quotationKey = $quotation->id . '_' . ($quotation->updated_at ? $quotation->updated_at->timestamp : time());
        if (in_array($quotationKey, self::$processedQuotations)) {
            return;
        }

        self::$processedQuotations[] = $quotationKey;

        // Trigger webhook regardless of email settings
        try {
            $webhookService = app(\App\Services\WebhookService::class);
            $webhookService->triggerWebhooks('New Quotation', $quotation->toArray(), $quotation->created_by);
        } catch (\Exception $e) {
            \Log::error('Quotation webhook failed: ' . $e->getMessage());
        }

        if (!$quotation->customer->email) {
            return;
        }

        $userId = $quotation->created_by;
        $setting = getSetting('email_notification_new_quotation', $userId);

        if ($setting !== '1' && $setting !== true) {
            return;
        }

        $variables = [
            '{quotation_number}' => $quotation->quotation_number,
            '{customer_name}' => $quotation->customer->name,
            '{customer_email}' => $quotation->customer->email,
            '{quotation_date}' => $quotation->quotation_date->format('Y-m-d'),
            '{valid_until}' => $quotation->valid_until->format('Y-m-d'),
            '{total_amount}' => number_format($quotation->total_amount, 2),
            '{company_name}' => auth()->user()->name ?? 'Company',
            '{created_date}' => $quotation->created_at->format('Y-m-d H:i:s'),
        ];

        try {
                      $userLanguage = auth()->user()->lang ?? 'en';

            $this->emailService->sendTemplateEmailWithLanguage(
                templateName: 'New Quotation',
                variables: $variables,
                toEmail: $quotation->customer->email,
                toName: $quotation->customer->name,
                language: $userLanguage
            );

        } catch (Exception $e) {
            \Log::error('Quotation email failed: ' . $e->getMessage());
        }
    }
}
