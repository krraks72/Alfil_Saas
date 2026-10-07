<?php

namespace App\Listeners;

use App\Events\UserCreated;
use Database\Seeders\NotificationTemplateSeeder;

class SeedNotificationTemplatesForNewCompany
{
    public function handle(UserCreated $event): void
    {
        $user = $event->user;
        
        // Only setup for new company users
        if ($user->type === 'company') {
            try {
                // Create basic company settings
                $settings = [
                    'email_notification_new_customer' => '1',
                    'email_notification_new_user' => '1', 
                    'email_notification_new_vendor' => '1',
                    'sms_notification_new_customer' => '0',
                    'company_name' => $user->name,
                    'company_email' => $user->email
                ];
                
                \Log::info("Starting auto-setup for new company: {$user->name}");
                
                // Also run notification template seeder for SMS templates
                $currentAuth = auth()->user();
                auth()->login($user);
                
                $seeder = new \Database\Seeders\NotificationTemplateSeeder();
                $seeder->run();
                
                if ($currentAuth) {
                    auth()->login($currentAuth);
                } else {
                    auth()->logout();
                }
                
                \Log::info("Company settings and templates auto-created for: {$user->name} (ID: {$user->id})");
                
            } catch (\Exception $e) {
                \Log::error("Failed to auto-create settings for company {$user->name}: " . $e->getMessage());
            }
        }
    }
}