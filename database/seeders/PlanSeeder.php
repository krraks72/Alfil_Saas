<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $freePlan = [
            'name' => 'Free',
            'price' => 0,
            'yearly_price' => 0,
            'duration' => 'monthly',
            'description' => 'Basic plan for small businesses just getting started.',
            'total_customers' => 50,
            'total_vendors' => 10,
            'max_users' => 2,
            'enable_chatgpt' => 'off',
            'storage_limit' => 1,
            'is_trial' => null,
            'trial_day' => 0,
            'is_plan_enable' => 'on',
            'is_default' => true,
            'module' => null
        ];
        
        $paidPlans = [
            [
                'name' => 'Starter',
                'price' => 19.99,
                'yearly_price' => 191.90,
                'duration' => 'monthly',
                'description' => 'Perfect for small businesses looking to grow their online presence.',
                'total_customers' => 200,
                'total_vendors' => 50,
                'max_users' => 10,
                'enable_chatgpt' => 'off',
                'storage_limit' => 5,
                'is_trial' => 'on',
                'trial_day' => 7,
                'is_plan_enable' => 'on',
                'is_default' => false,
                'module' => null
            ],
            [
                'name' => 'Pro',
                'price' => 49.99,
                'yearly_price' => 479.90,
                'duration' => 'monthly',
                'description' => 'Ideal for growing businesses with multiple stores and advanced needs.',
                'total_customers' => 1000,
                'total_vendors' => 200,
                'max_users' => 50,
                'enable_chatgpt' => 'on',
                'storage_limit' => 50,
                'is_trial' => 'on',
                'trial_day' => 14,
                'is_plan_enable' => 'on',
                'is_default' => false,
                'module' => null
            ],
            [
                'name' => 'Enterprise',
                'price' => 99.99,
                'yearly_price' => 959.90,
                'duration' => 'monthly',
                'description' => 'Complete solution for large enterprises with unlimited features.',
                'total_customers' => 10000,
                'total_vendors' => 1000,
                'max_users' => 500,
                'enable_chatgpt' => 'on',
                'storage_limit' => 100,
                'is_trial' => 'on',
                'trial_day' => 30,
                'is_plan_enable' => 'on',
                'is_default' => false,
                'module' => null
            ]
        ];
        
        // Always create Free plan
        Plan::updateOrCreate(
            ['name' => $freePlan['name']],
            $freePlan
        );
        
        // Only create paid plans in demo mode
        if (IsDemo()) {
            foreach ($paidPlans as $planData) {
                Plan::updateOrCreate(
                    ['name' => $planData['name']],
                    $planData
                );
            }
        }
    }
}