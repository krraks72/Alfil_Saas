<?php

namespace App\Listeners;

use App\Events\UserCreated;
use App\Services\EmailTemplateService;

use Exception;

class SendUserCreatedEmail
{
    private static array $processedUsers = [];

    public function __construct(
        private EmailTemplateService $emailService,
    ) {
    }

    public function handle(UserCreated $event): void
    {
        $user = $event->user;
        $plainPassword = $event->plainPassword;

        // Prevent duplicate processing
        $userKey = $user->id . '_' . ($user->updated_at ? $user->updated_at->timestamp : time());
        if (in_array($userKey, self::$processedUsers)) {
            return;
        }

        self::$processedUsers[] = $userKey;
        // Check if notification is enabled
        $userId = $user->created_by;
        $settingKey = 'email_notification_new_user';
        $setting = getSetting($settingKey, $userId);

        // Trigger webhook regardless of email settings (skip for company users without created_by)
        if ($user->created_by) {
            try {
                $webhookService = app(\App\Services\WebhookService::class);
                $webhookService->triggerWebhooks('New User', $user->toArray(), $user->created_by);
            } catch (\Exception $e) {
                \Log::error('User webhook failed: ' . $e->getMessage());
            }
        }



        if ($setting !== '1' && $setting !== true) {
            return;
        }

        // Prepare email variables
        $variables = [
            '{app_url}' => config('app.url'),
            '{user_name}' => $user->name,
            '{user_email}' => $user->email,
            '{user_password}' => $plainPassword ?: 'Password set by user',
            '{user_type}' => ucfirst($user->type),
            '{app_name}' => config('app.name'),
            '{created_date}' => $user->created_at->format('Y-m-d H:i:s'),
            '{company_name}' => $user->name,
            '{company_email}' => $user->email,
            '{company_password}' => $plainPassword ?: 'Password set by user',
        ];
        try {
            // Send welcome email to the newly created user in their language
            $userLanguage = auth()->user()->lang ?? 'en';
            $this->emailService->sendTemplateEmailWithLanguage(
                templateName: 'New User',
                variables: $variables,
                toEmail: $user->email,
                toName: $user->name,
                language: $userLanguage
            );

        } catch (\Exception $e) {
            \Log::error('Failed to send welcome email: ' . $e->getMessage());
            session()->flash('email_error', 'Failed to send welcome email: ' . $e->getMessage());
        }
    }
}
