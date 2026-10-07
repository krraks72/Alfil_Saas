<?php

namespace App\Listeners;

use App\Events\SaleCreate;
use App\Models\User;
use App\Services\SlackService;
use Exception;

class SlackSaleCreateListener
{
    public function __construct(
        private SlackService $slackService
    ) {
        //
    }

    public function handle(SaleCreate $event): void
    {
        $sale = $event->sale;

        // Check if Slack is enabled
        $slackEnabled = getSetting('slack_enabled', '0', createdBy());
        if ($slackEnabled !== '1') {
            return;
        }

        if (isNotificationTemplateEnabled('New Sale', createdBy(), 'slack')) {
            $variables = [
                '{sale_number}' => $sale->sale_number ?? '-',
                '{customer_name}' => $sale->customer->name ?? '-',
                '{total_amount}' => $sale->total_amount ?? '-',
                '{created_by}' => $sale->creator->name ?? '-',
            ];

            try {
                session()->forget('slack_error');

                $slackWebhookUrl = getSetting('slack_webhook_url', '', createdBy());

                if (filled($slackWebhookUrl)) {
                    $createdByUser = User::find(createdBy());
                    $userLanguage = $createdByUser->lang ?? 'en';
                    $this->slackService->sendTemplateMessageWithLanguage(
                        templateName: 'New Sale',
                        variables: $variables,
                        webhookUrl: $slackWebhookUrl,
                        language: $userLanguage
                    );
                } else {
                    session()->flash('slack_error', 'Slack webhook URL is not set.');
                }
            } catch (Exception $e) {
                session()->flash('slack_error', 'Failed to send sale create notification: ' . $e->getMessage());
            }
        }
    }
}
