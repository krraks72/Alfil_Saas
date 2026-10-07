<?php

namespace App\Listeners;

use App\Events\BranchCreated;
use App\Services\EmailTemplateService;
use Exception;

class SendBranchCreatedEmail
{
    private static array $processedBranches = [];

    public function __construct(
        private EmailTemplateService $emailService
    ) {
    }

    public function handle(BranchCreated $event): void
    {
        $branch = $event->branch;

        $branchKey = $branch->id . '_' . ($branch->updated_at ? $branch->updated_at->timestamp : time());
        if (in_array($branchKey, self::$processedBranches)) {
            return;
        }

        self::$processedBranches[] = $branchKey;

        // Trigger webhook regardless of email settings
        try {
            $webhookService = app(\App\Services\WebhookService::class);
            $webhookService->triggerWebhooks('New Branch', $branch->toArray(), $branch->created_by);
        } catch (\Exception $e) {
            \Log::error('Branch webhook failed: ' . $e->getMessage());
        }

        $userId = $branch->created_by;
        $setting = getSetting('email_notification_new_branch', $userId);

        if ($setting !== '1' && $setting !== true) {
            return;
        }

        // Determine email recipient: branch email or system user email
        $toEmail = $branch->email ?: $branch->creator->email;
        $toName = $branch->email ? $branch->name : $branch->creator->name;

        if (!$toEmail) {
            return;
        }

        $managerName = $branch->manager ? $branch->manager->name : 'Not Assigned';

        $variables = [
            '{branch_name}' => $branch->name,
            '{branch_email}' => $branch->email ?: 'Not provided',
            '{branch_address}' => $branch->address,
            '{branch_phone}' => $branch->phone ?: 'Not provided',
            '{manager_name}' => $managerName,
            '{company_name}' => auth()->user()->name ?? 'Company',
            '{created_date}' => $branch->created_at->format('Y-m-d H:i:s'),
        ];

        try {
            // Get company's current language
                      $userLanguage = auth()->user()->lang ?? 'en';


            $this->emailService->sendTemplateEmailWithLanguage(
                templateName: 'New Branch',
                variables: $variables,
                toEmail: $toEmail,
                toName: $toName,
                language: $userLanguage
            );

        } catch (Exception $e) {
            \Log::error('Branch email failed: ' . $e->getMessage());
        }
    }
}
