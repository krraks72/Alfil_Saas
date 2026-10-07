<?php

namespace App\Listeners;

use App\Events\SaleReturnCreated;
use App\Services\EmailTemplateService;
use Exception;

class SendSaleReturnCreatedEmail
{
    private static array $processedSaleReturns = [];

    public function __construct(
        private EmailTemplateService $emailService
    ) {
    }

    public function handle(SaleReturnCreated $event): void
    {
        $saleReturn = $event->saleReturn;

        $returnKey = $saleReturn->id . '_' . ($saleReturn->updated_at ? $saleReturn->updated_at->timestamp : time());
        if (in_array($returnKey, self::$processedSaleReturns)) {
            return;
        }

        self::$processedSaleReturns[] = $returnKey;

        // Trigger webhook regardless of email settings
        try {
            $webhookService = app(\App\Services\WebhookService::class);
            $webhookService->triggerWebhooks('New Sale Return', $saleReturn->toArray(), $saleReturn->created_by);
        } catch (\Exception $e) {
            \Log::error('Sale return webhook failed: ' . $e->getMessage());
        }

        // Get customer from sale relationship
        $customer = $saleReturn->sale->customer;

        if (!$customer->email) {
            return;
        }

        $userId = $saleReturn->created_by;
        $setting = getSetting('email_notification_new_sale_return', $userId);

        if ($setting !== '1' && $setting !== true) {
            return;
        }

        $variables = [
            '{return_number}' => $saleReturn->return_number,
            '{sale_number}' => $saleReturn->sale->sale_number,
            '{customer_name}' => $customer->name,
            '{customer_email}' => $customer->email,
            '{return_date}' => $saleReturn->return_date->format('Y-m-d'),
            '{total_amount}' => number_format($saleReturn->total_amount, 2),
            '{reason}' => $saleReturn->reason ?: 'Not specified',
            '{company_name}' => auth()->user()->name ?? 'Company',
            '{created_date}' => $saleReturn->created_at->format('Y-m-d H:i:s'),
        ];

        try {
                        $userLanguage = auth()->user()->lang ?? 'en';

            $this->emailService->sendTemplateEmailWithLanguage(
                templateName: 'New Sale Return',
                variables: $variables,
                toEmail: $customer->email,
                toName: $customer->name,
                language: $userLanguage
            );

        } catch (Exception $e) {
            \Log::error('Sale return email failed: ' . $e->getMessage());
        }
    }
}
