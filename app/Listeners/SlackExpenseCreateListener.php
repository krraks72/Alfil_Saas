<?php

namespace App\Listeners;

use App\Events\ExpenseCreated;
use App\Models\User;
use App\Services\SlackService;
use Exception;

class SlackExpenseCreateListener
{
    public function __construct(
        private SlackService $slackService
    ) {
        //
    }

    public function handle(ExpenseCreated $event): void
    {
        $expense = $event->expense;

        // Check if Slack is enabled
        $slackEnabled = getSetting('slack_enabled', '0', createdBy());
        if ($slackEnabled !== '1') {
            return;
        }

        if (isNotificationTemplateEnabled('New Expense', createdBy(), 'slack')) {
            $variables = [
                '{expense_title}' => $expense->title ?? '-',
                '{amount}' => $expense->amount ?? '-',
                '{category}' => $expense->expenseCategory->name ?? '-',
                '{created_by}' => $expense->creator->name ?? '-',
            ];

            try {
                session()->forget('slack_error');

                $slackWebhookUrl = getSetting('slack_webhook_url', '', createdBy());

                if (filled($slackWebhookUrl)) {
                    $createdByUser = User::find(createdBy());
                    $userLanguage = $createdByUser->lang ?? 'en';
                    $this->slackService->sendTemplateMessageWithLanguage(
                        templateName: 'New Expense',
                        variables: $variables,
                        webhookUrl: $slackWebhookUrl,
                        language: $userLanguage
                    );
                } else {
                    session()->flash('slack_error', 'Slack webhook URL is not set.');
                }
            } catch (Exception $e) {
                session()->flash('slack_error', 'Failed to send expense create notification: ' . $e->getMessage());
            }
        }
    }
}
