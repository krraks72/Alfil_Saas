<?php

namespace App\Listeners;

use App\Events\ExpenseCreated;
use App\Services\EmailTemplateService;
use Exception;

class SendExpenseCreatedEmail
{
    public function __construct(
        private EmailTemplateService $emailService
    ) {
    }

    public function handle(ExpenseCreated $event): void
    {
        $expense = $event->expense->load(['branch', 'expenseCategory', 'creator']);

        $recipientEmail = $expense->branch->email ?? null;
        if (!$recipientEmail) {
            return;
        }

        $userId = $expense->created_by;
        $setting = getSetting('email_notification_new_expense', $userId);

        if ($setting !== '1' && $setting !== true) {
            return;
        }

        $variables = [
            '{expense_title}' => $expense->title,
            '{expense_amount}' => number_format($expense->amount, 2),
            '{expense_date}' => $expense->expense_date?->format('Y-m-d') ?? '',
            '{expense_description}' => $expense->description ?? '',
            '{expense_status}' => $expense->status,
            '{branch_name}' => $expense->branch->name,
            '{expense_category}' => $expense->expenseCategory->name,
            '{created_by}' => $expense->creator->name,
            '{company_name}' => auth()->user()->name ?? 'Company',
        ];

        try {
            // Get company's current language
                      $userLanguage = auth()->user()->lang ?? 'en';

            $this->emailService->sendTemplateEmailWithLanguage(
                templateName: 'New Expense',
                variables: $variables,
                toEmail: $recipientEmail,
                toName: $expense->branch->name,
                language: $userLanguage
            );

        } catch (Exception $e) {
            \Log::error('Expense email failed: ' . $e->getMessage());
        }
    }
}
