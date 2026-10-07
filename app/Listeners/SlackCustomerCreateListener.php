<?php

namespace App\Listeners;

use App\Events\CustomerCreated;
use App\Models\User;
use App\Services\SlackService;
use Exception;

class SlackCustomerCreateListener
{
    public function __construct(
        private SlackService $slackService
    ) {
        //
    }

    public function handle(CustomerCreated $event): void
    {
        $customer = $event->customer;

        // Check if Slack is enabled
        $slackEnabled = getSetting('slack_enabled', '0', createdBy());
        if ($slackEnabled !== '1') {
            return;
        }

        if (isNotificationTemplateEnabled('New Customer', createdBy(), 'slack')) {
            $variables = [
                '{customer_name}' => $customer->name ?? '-',
                '{customer_email}' => $customer->email ?? '-',
                '{customer_phone}' => $customer->phone ?? '-',
                '{created_by}' => $customer->creator->name ?? '-',
            ];

            try {
                // Clear any existing slack error
                session()->forget('slack_error');

                $slackWebhookUrl = getSetting('slack_webhook_url', '', createdBy());

                if (filled($slackWebhookUrl)) {
                    $createdByUser = User::find(createdBy());
                    $userLanguage = $createdByUser->lang ?? 'en';
                    $this->slackService->sendTemplateMessageWithLanguage(
                        templateName: 'New Customer',
                        variables: $variables,
                        webhookUrl: $slackWebhookUrl,
                        language: $userLanguage
                    );
                } else {
                    session()->flash('slack_error', 'Slack webhook URL is not set.');
                }
            } catch (Exception $e) {
                // Store error in session for frontend notification
                session()->flash('slack_error', 'Failed to send customer create notification: ' . $e->getMessage());
            }
        }
    }
}
