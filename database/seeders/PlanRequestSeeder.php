<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\PlanRequest;
use App\Models\User;
use App\Models\Plan;

class PlanRequestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (!IsDemo()) {
            return;
        }

        $company = User::where('email', 'company@example.com')->first();
        $otherUsers = User::where('type', 'company')->where('email', '!=', 'company@example.com')->get();
        $superAdmin = User::where('type', 'superadmin')->first();
        $plans = Plan::take(3)->get();

        if (!$company || $plans->isEmpty()) {
            return;
        }

        $messages = [
            'I would like to upgrade my plan to access more features.',
            'Requesting yearly plan for better pricing.',
            'Need more users and storage for my growing team.',
            'Looking to upgrade for advanced reporting features.',
            'Requesting plan upgrade to manage multiple branches.',
            'Need ChatGPT integration and higher storage limit.',
            'Would like to try the pro plan for better analytics.',
            'Upgrading to enterprise for unlimited customers and vendors.',
            'Requesting plan change to accommodate seasonal business growth.',
            'Need higher user limit for new staff members joining next month.',
        ];

        // 10 records for company@example.com - visible on both company & superadmin side
        foreach ($messages as $index => $message) {
            $status = collect(['pending', 'approved', 'rejected'])->random();
            PlanRequest::create([
                'user_id'     => $company->id,
                'plan_id'     => $plans->random()->id,
                'status'      => $status,
                'duration'    => collect(['monthly', 'yearly'])->random(),
                'message'     => $message,
                'approved_at' => $status === 'approved' ? now()->subDays($index + 1) : null,
                'rejected_at' => $status === 'rejected' ? now()->subDays($index + 1) : null,
                'approved_by' => $status === 'approved' && $superAdmin ? $superAdmin->id : null,
                'rejected_by' => $status === 'rejected' && $superAdmin ? $superAdmin->id : null,
                'created_at'  => now()->subDays($index + 1),
                'updated_at'  => now()->subDays($index + 1),
            ]);
        }

        // Extra records for other company users - visible only on superadmin side
        if ($otherUsers->count() > 0) {
            foreach ($otherUsers->take(5) as $index => $user) {
                $status = collect(['pending', 'approved', 'rejected'])->random();
                PlanRequest::create([
                    'user_id'     => $user->id,
                    'plan_id'     => $plans->random()->id,
                    'status'      => $status,
                    'duration'    => collect(['monthly', 'yearly'])->random(),
                    'message'     => $messages[$index],
                    'approved_at' => $status === 'approved' ? now()->subDays($index + 5) : null,
                    'rejected_at' => $status === 'rejected' ? now()->subDays($index + 5) : null,
                    'approved_by' => $status === 'approved' && $superAdmin ? $superAdmin->id : null,
                    'rejected_by' => $status === 'rejected' && $superAdmin ? $superAdmin->id : null,
                    'created_at'  => now()->subDays($index + 5),
                    'updated_at'  => now()->subDays($index + 5),
                ]);
            }
        }
    }
}
