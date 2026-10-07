<?php

namespace App\Listeners;

use App\Events\VendorCreated;
use App\Models\User;
use App\Services\SlackService;
use Exception;

class SlackVendorCreateListener
{
    public function __construct(
        private SlackService $slackService
    ) {
        //
    }

    public function handle(VendorCreated $event): void
    {
        $vendor = $event->vendor;

        // Check if Slack is enabled
        $slackEnabled = getSetting('slack_enabled', '0', createdBy());
        if ($slackEnabled !== '1') {
            return;
        }

        if (isNotificationTemplateEnabled('New Vendor', createdBy(), 'slack')) {
            $variables = [
                '{vendor_name}' => $vendor->name ?? '-',
                '{vendor_email}' => $vendor->email ?? '-',
                '{vendor_phone}' => $vendor->phone ?? '-',
                '{created_by}' => $vendor->creator->name ?? '-',
            ];

            try {
                session()->forget('slack_error');

                $slackWebhookUrl = getSetting('slack_webhook_url', '', createdBy());

                if (filled($slackWebhookUrl)) {
                    $createdByUser = User::find(createdBy());
                    $userLanguage = $createdByUser->lang ?? 'en';
                    $this->slackService->sendTemplateMessageWithLanguage(
                        templateName: 'New Vendor',
                        variables: $variables,
                        webhookUrl: $slackWebhookUrl,
                        language: $userLanguage
                    );
                } else {
                    session()->flash('slack_error', 'Slack webhook URL is not set.');
                }
            } catch (Exception $e) {
                session()->flash('slack_error', 'Failed to send vendor create notification: ' . $e->getMessage());
            }
        }
    }
}
