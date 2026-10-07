<?php

namespace App\Listeners;

use App\Events\PurchaseCreated;
use App\Models\User;
use App\Services\SlackService;
use Exception;

class SlackPurchaseCreateListener
{
    public function __construct(
        private SlackService $slackService
    ) {
        //
    }

    public function handle(PurchaseCreated $event): void
    {
        $purchase = $event->purchase;

        // Check if Slack is enabled
        $slackEnabled = getSetting('slack_enabled', '0', createdBy());
        if ($slackEnabled !== '1') {
            return;
        }

        if (isNotificationTemplateEnabled('New Purchase', createdBy(), 'slack')) {
            $variables = [
                '{purchase_number}' => $purchase->purchase_number ?? '-',
                '{vendor_name}' => $purchase->vendor->name ?? '-',
                '{total_amount}' => $purchase->total_amount ?? '-',
                '{created_by}' => $purchase->creator->name ?? '-',
            ];

            try {
                session()->forget('slack_error');

                $slackWebhookUrl = getSetting('slack_webhook_url', '', createdBy());

                if (filled($slackWebhookUrl)) {
                    $createdByUser = User::find(createdBy());
                    $userLanguage = $createdByUser->lang ?? 'en';
                    $this->slackService->sendTemplateMessageWithLanguage(
                        templateName: 'New Purchase',
                        variables: $variables,
                        webhookUrl: $slackWebhookUrl,
                        language: $userLanguage
                    );
                } else {
                    session()->flash('slack_error', 'Slack webhook URL is not set.');
                }
            } catch (Exception $e) {
                session()->flash('slack_error', 'Failed to send purchase create notification: ' . $e->getMessage());
            }
        }
    }
}
