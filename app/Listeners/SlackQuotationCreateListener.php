<?php

namespace App\Listeners;

use App\Events\QuotationCreated;
use App\Models\User;
use App\Services\SlackService;
use Exception;

class SlackQuotationCreateListener
{
    public function __construct(
        private SlackService $slackService
    ) {
        //
    }

    public function handle(QuotationCreated $event): void
    {
        $quotation = $event->quotation;

        // Check if Slack is enabled
        $slackEnabled = getSetting('slack_enabled', '0', createdBy());
        if ($slackEnabled !== '1') {
            return;
        }

        if (isNotificationTemplateEnabled('New Quotation', createdBy(), 'slack')) {
            $variables = [
                '{quotation_number}' => $quotation->quotation_number ?? '-',
                '{customer_name}' => $quotation->customer->name ?? '-',
                '{total_amount}' => $quotation->total_amount ?? '-',
                '{created_by}' => $quotation->creator->name ?? '-',
            ];

            try {
                session()->forget('slack_error');

                $slackWebhookUrl = getSetting('slack_webhook_url', '', createdBy());

                if (filled($slackWebhookUrl)) {
                    $createdByUser = User::find(createdBy());
                    $userLanguage = $createdByUser->lang ?? 'en';
                    $this->slackService->sendTemplateMessageWithLanguage(
                        templateName: 'New Quotation',
                        variables: $variables,
                        webhookUrl: $slackWebhookUrl,
                        language: $userLanguage
                    );
                } else {
                    session()->flash('slack_error', 'Slack webhook URL is not set.');
                }
            } catch (Exception $e) {
                session()->flash('slack_error', 'Failed to send quotation create notification: ' . $e->getMessage());
            }
        }
    }
}