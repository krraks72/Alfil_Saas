<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        if (!IsDemo()) {
            return;
        }
        
        $user = User::where('type', 'company')->first();
        if (!$user) {
            $user = User::first();
        }

        if (!$user) {
            return;
        }

        $notifications = [
            [
                'title' => 'System Maintenance',
                'description' => 'Scheduled system maintenance will occur this weekend. Please save your work regularly.',
                'from_date' => now()->addDays(1),
                'to_date' => now()->addDays(3),
                'color' => '#F59E0B',
                'status' => 'active',
                'created_by' => $user->id,
            ],
            [
                'title' => 'New Feature Release',
                'description' => 'We have released new reporting features. Check out the enhanced analytics dashboard.',
                'from_date' => now()->subDays(2),
                'to_date' => now()->addDays(5),
                'color' => '#10b77f',
                'status' => 'active',
                'created_by' => $user->id,
            ],
            [
                'title' => 'Payment Reminder',
                'description' => 'Your subscription will expire soon. Please update your payment information.',
                'from_date' => now(),
                'to_date' => now()->addDays(7),
                'color' => '#EF4444',
                'status' => 'active',
                'created_by' => $user->id,
            ],
            [
                'title' => 'Training Session',
                'description' => 'Join our upcoming training session on advanced POS features next week.',
                'from_date' => now()->addDays(5),
                'to_date' => now()->addDays(10),
                'color' => '#3B82F6',
                'status' => 'active',
                'created_by' => $user->id,
            ],
            [
                'title' => 'Holiday Notice',
                'description' => 'Our support team will have limited availability during the holiday season.',
                'from_date' => now()->addDays(10),
                'to_date' => now()->addDays(15),
                'color' => '#8B5CF6',
                'status' => 'active',
                'created_by' => $user->id,
            ],
            [
                'title' => 'Security Update',
                'description' => 'Important security updates have been applied. Please review your account settings.',
                'from_date' => now()->subDays(5),
                'to_date' => now()->addDays(2),
                'color' => '#F97316',
                'status' => 'active',
                'created_by' => $user->id,
            ],
            [
                'title' => 'Backup Completed',
                'description' => 'Your data backup has been completed successfully. All information is secure.',
                'from_date' => now()->subDays(1),
                'to_date' => now()->addDays(1),
                'color' => '#06B6D4',
                'status' => 'active',
                'created_by' => $user->id,
            ],
        ];

        foreach ($notifications as $notification) {
            Notification::create($notification);
        }
    }
}