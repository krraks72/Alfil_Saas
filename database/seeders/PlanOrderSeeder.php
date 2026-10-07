<?php

namespace Database\Seeders;

use App\Models\PlanOrder;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Database\Seeder;

class PlanOrderSeeder extends Seeder
{
    public function run(): void
    {
        if (!IsDemo()) {
            return;
        }

        $plans = Plan::where('is_plan_enable', 'on')->orWhere('is_plan_enable', 1)->get();
        $company = User::where('email', 'company@example.com')->first();
        $otherUsers = User::where('type', 'company')->where('email', '!=', 'company@example.com')->get();
        $superAdmin = User::where('type', 'superadmin')->first();

        if ($plans->isEmpty() || !$company) {
            return;
        }

        $starterPlan    = $plans->where('name', 'Starter')->first()    ?? $plans->first();
        $proPlan        = $plans->where('name', 'Pro')->first()         ?? $plans->first();
        $enterprisePlan = $plans->where('name', 'Enterprise')->first()  ?? $plans->first();

        $paymentMethods = ['stripe', 'paypal', 'razorpay', 'bank'];

        // 10 records for company@example.com - visible on both company & superadmin side
        $companyOrders = [
            ['plan' => $starterPlan,    'price' => 19.99,   'cycle' => 'monthly', 'method' => 'stripe',  'status' => 'pending',   'days' => 2],
            ['plan' => $proPlan,        'price' => 49.99,   'cycle' => 'monthly', 'method' => 'paypal',  'status' => 'approved',  'days' => 5],
            ['plan' => $enterprisePlan, 'price' => 99.99,   'cycle' => 'monthly', 'method' => 'stripe',  'status' => 'rejected',  'days' => 8],
            ['plan' => $starterPlan,    'price' => 191.90,  'cycle' => 'yearly',  'method' => 'bank',    'status' => 'cancelled', 'days' => 12],
            ['plan' => $proPlan,        'price' => 479.90,  'cycle' => 'yearly',  'method' => 'paypal',  'status' => 'approved',  'days' => 15],
            ['plan' => $enterprisePlan, 'price' => 959.90,  'cycle' => 'yearly',  'method' => 'razorpay','status' => 'approved',  'days' => 20],
            ['plan' => $starterPlan,    'price' => 19.99,   'cycle' => 'monthly', 'method' => 'bank',    'status' => 'pending',   'days' => 25],
            ['plan' => $proPlan,        'price' => 49.99,   'cycle' => 'monthly', 'method' => 'stripe',  'status' => 'approved',  'days' => 30],
            ['plan' => $enterprisePlan, 'price' => 99.99,   'cycle' => 'monthly', 'method' => 'paypal',  'status' => 'pending',   'days' => 35],
            ['plan' => $starterPlan,    'price' => 191.90,  'cycle' => 'yearly',  'method' => 'stripe',  'status' => 'rejected',  'days' => 40],
        ];

        foreach ($companyOrders as $data) {
            PlanOrder::create([
                'user_id'        => $company->id,
                'plan_id'        => $data['plan']->id,
                'original_price' => $data['price'],
                'final_price'    => $data['price'],
                'billing_cycle'  => $data['cycle'],
                'payment_method' => $data['method'],
                'status'         => $data['status'],
                'processed_by'   => in_array($data['status'], ['approved', 'rejected']) && $superAdmin ? $superAdmin->id : null,
                'ordered_at'     => now()->subDays($data['days']),
                'processed_at'   => now()->subDays($data['days']),
                'created_at'     => now()->subDays($data['days']),
                'updated_at'     => now()->subDays($data['days']),
            ]);
        }

        // Extra records for other company users - visible only on superadmin side
        if ($otherUsers->count() > 0) {
            foreach ($otherUsers->take(5) as $index => $user) {
                $plan = $plans->random();
                $cycle = collect(['monthly', 'yearly'])->random();
                $price = $cycle === 'yearly' ? $plan->yearly_price : $plan->price;
                $status = collect(['pending', 'approved', 'rejected'])->random();

                PlanOrder::create([
                    'user_id'        => $user->id,
                    'plan_id'        => $plan->id,
                    'original_price' => $price,
                    'final_price'    => $price,
                    'billing_cycle'  => $cycle,
                    'payment_method' => collect($paymentMethods)->random(),
                    'status'         => $status,
                    'processed_by'   => in_array($status, ['approved', 'rejected']) && $superAdmin ? $superAdmin->id : null,
                    'ordered_at'     => now()->subDays($index + 5),
                    'processed_at'   => now()->subDays($index + 5),
                    'created_at'     => now()->subDays($index + 5),
                    'updated_at'     => now()->subDays($index + 5),
                ]);
            }
        }
    }
}
