<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Plan;
use App\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Super Admin User
        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@example.com'],
            [
                'name' => 'Super Admin',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'type' => 'superadmin',
                'lang' => 'en'
            ]
        );

        // Role will be assigned in RoleSeeder
        $superAdmin->assignRole('superadmin');

        // Create default settings for superadmin if not exists
        if (!Setting::where('user_id', $superAdmin->id)->exists()) {
            createDefaultSettings($superAdmin->id);
        }

        // Get default plan
        $defaultPlan = Plan::where('is_default', true)->first();

        // Create Company User
        $company = User::firstOrCreate(
            ['email' => 'company@example.com'],
            [
                'name' => 'Company',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'type' => 'company',
                'lang' => 'en',
                'plan_id' => $defaultPlan ? $defaultPlan->id : null,
                'plan_expire_date' => $defaultPlan ? Carbon::now()->addDays(30) : null,
                'plan_is_active' => 1,
                'referral_code' => rand(100000, 999999),
                'created_by' => $superAdmin->id,
            ]
        );

        // Role will be assigned in RoleSeeder
        $company->assignRole('company');

        // Create default settings for company user if not exists
        if (!Setting::where('user_id', $company->id)->exists()) {
            copySettingsFromSuperAdmin($company->id);
        }

        // Assign default plan to all company users with null plan_id
        if ($defaultPlan) {
            User::where('type', 'company')
                ->whereNull('plan_id')
                ->update(['plan_id' => $defaultPlan->id]);
        }

        // Demo mode: create 10 company-side users with different roles
        if (IsDemo()) {
            $demoUsers = [
                ['name' => 'John Smith',      'email' => 'john.smith@example.com',      'type' => 'cashier'],
                ['name' => 'Sarah Johnson',   'email' => 'sarah.johnson@example.com',   'type' => 'sales-staff'],
                ['name' => 'Mike Davis',      'email' => 'mike.davis@example.com',      'type' => 'inventory-manager'],
                ['name' => 'Emily Wilson',    'email' => 'emily.wilson@example.com',    'type' => 'accountant'],
                ['name' => 'Robert Brown',    'email' => 'robert.brown@example.com',    'type' => 'store-supervisor'],
                ['name' => 'Jessica Taylor',  'email' => 'jessica.taylor@example.com',  'type' => 'purchase-officer'],
                ['name' => 'David Martinez',  'email' => 'david.martinez@example.com',  'type' => 'customer-support'],
                ['name' => 'Amanda Anderson', 'email' => 'amanda.anderson@example.com', 'type' => 'report-viewer'],
                ['name' => 'Chris Thomas',    'email' => 'chris.thomas@example.com',    'type' => 'branch-staff'],
                ['name' => 'Laura Jackson',   'email' => 'laura.jackson@example.com',   'type' => 'quotation-officer'],
            ];

            foreach ($demoUsers as $userData) {
                $demoUser = User::firstOrCreate(
                    ['email' => $userData['email']],
                    [
                        'name'               => $userData['name'],
                        'email_verified_at'  => now(),
                        'password'           => Hash::make('password'),
                        'type'               => $userData['type'],
                        'lang'               => 'en',
                        'created_by'         => $company->id,
                        'is_enable_login'    => 1,
                    ]
                );
                // Role assignment done in ManagerRoleSeeder after roles are created
            }
        }
    }
}
