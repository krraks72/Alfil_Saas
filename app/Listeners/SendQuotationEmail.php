<?php

namespace App\Listeners;

use App\Events\SendQuotation;
use App\Services\EmailTemplateService;
use Exception;

class SendQuotationEmail
{
    private static array $processedQuotations = [];

    public function __construct(
        private EmailTemplateService $emailService
    ) {}

    public function handle(SendQuotation $event): void
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
            $webhookService->triggerWebhooks('Send Quotation', $quotation->toArray(), $quotation->created_by);
        } catch (\Exception $e) {
            \Log::error('Quotation webhook failed: ' . $e->getMessage());
        }

        if (!$quotation->customer->email) {
            return;
        }

        // $userId = $quotation->created_by;
        // $setting = getSetting('email_notification_new_quotation', $userId);

        // if ($setting !== '1' && $setting !== true) {
        //     return;
        // }

        // Generate share URL
        $shareUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'public.quotations.show',
            now()->addDays(30),
            ['id' => $quotation->id]
        );

        $variables = [
            '{quotation_number}' => $quotation->quotation_number,
            '{customer_name}' => $quotation->customer->name,
            '{customer_email}' => $quotation->customer->email,
            '{quotation_date}' => $quotation->quotation_date->format('Y-m-d'),
            '{valid_until}' => $quotation->valid_until->format('Y-m-d'),
            '{total_amount}' => number_format($quotation->total_amount, 2),
            '{company_name}' => auth()->user()->name ?? 'Company',
            '{created_date}' => $quotation->created_at->format('Y-m-d H:i:s'),
            '{sent_date}' => $quotation->sent_at
        ];

        try {
            $userLanguage = auth()->user()->lang ?? 'en';

            $this->emailService->sendTemplateEmailWithLanguage(
                templateName: 'Send Quotation',
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
