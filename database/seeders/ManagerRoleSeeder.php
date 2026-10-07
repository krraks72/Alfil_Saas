<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class ManagerRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get company user for role ownership - create if doesn't exist
        $company = \App\Models\User::where('email', 'company@example.com')->first();
        if (!$company) {
            return;
        }
        $companyId = $company->id;

        $managerRole = Role::firstOrCreate(
            ['name' => 'manager', 'guard_name' => 'web'],
            [
                'label' => 'Manager',
                'description' => 'Manager can manage assigned branch and cash registers',
                'created_by' => $companyId,
            ]
        );

        $branchManagerPermissions = Permission::whereIn('name', [
            'manage-dashboard',
            'view-branches',
            'edit-branches',
            'view-cash-registers',
            'create-cash-registers',
            'edit-cash-registers',
            'manage-cash-register-status',
            'manage-cash-register-balance',
            'view-pos',
            'create-sales',
            'view-sales',
            'manage-pos-sessions',
            'apply-discounts',
            'view-customers',
            'create-customers',
            'edit-customers',
            'view-products',
            'view-expenses',
            'create-expenses',
            'approve-expenses',
            'view-reports',
            'manage_branch_sales_target',
            'create_branch_sales_target',
            'edit_branch_sales_target',
            'delete_branch_sales_target',
        ])->get();

        $managerRole->syncPermissions($branchManagerPermissions);

        // Create Branch Manager User
        $branchManager = \App\Models\User::firstOrCreate(
            ['email' => 'manager@example.com'],
            [
                'name' => 'Branch Manager',
                'email_verified_at' => now(),
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'type' => 'manager',
                'lang' => 'en',
                'created_by' => $companyId,
            ]
        );

        // Assign role to manager user
        $branchManager->assignRole('manager');

        // Demo mode: create 10 company-side roles
        if (IsDemo()) {
            $demoRoles = [
                [
                    'name'        => 'cashier',
                    'label'       => 'Cashier',
                    'description' => 'Handles POS transactions and cash register operations',
                    'permissions' => ['view-pos', 'create-sales', 'manage-pos-sessions', 'apply-discounts', 'view-customers', 'view-products', 'view-cash-registers', 'manage-cash-register-balance'],
                ],
                [
                    'name'        => 'sales-staff',
                    'label'       => 'Sales Staff',
                    'description' => 'Manages sales and customer interactions',
                    'permissions' => ['view-pos', 'create-sales', 'view-sales', 'view-customers', 'create-customers', 'edit-customers', 'view-products', 'apply-discounts'],
                ],
                [
                    'name'        => 'inventory-manager',
                    'label'       => 'Inventory Manager',
                    'description' => 'Manages products, stock and purchases',
                    'permissions' => ['view-products', 'create-products', 'edit-products', 'manage-product-status', 'view-purchases', 'create-purchases', 'edit-purchases', 'view-brands', 'view-categories', 'view-units'],
                ],
                [
                    'name'        => 'accountant',
                    'label'       => 'Accountant',
                    'description' => 'Manages expenses, reports and financial data',
                    'permissions' => ['view-expenses', 'create-expenses', 'edit-expenses', 'view-expense-categories', 'view-reports', 'export-reports', 'view-sales', 'export-sales'],
                ],
                [
                    'name'        => 'store-supervisor',
                    'label'       => 'Store Supervisor',
                    'description' => 'Supervises store operations and staff',
                    'permissions' => ['view-pos', 'create-sales', 'view-sales', 'manage-pos-sessions', 'view-customers', 'view-products', 'view-branches', 'view-cash-registers', 'view-reports', 'view-expenses'],
                ],
                [
                    'name'        => 'purchase-officer',
                    'label'       => 'Purchase Officer',
                    'description' => 'Handles vendor purchases and returns',
                    'permissions' => ['view-purchases', 'create-purchases', 'edit-purchases', 'delete-purchases', 'view-purchase-returns', 'create-purchase-returns', 'view-vendors', 'view-products'],
                ],
                [
                    'name'        => 'customer-support',
                    'label'       => 'Customer Support',
                    'description' => 'Handles customer queries and sale returns',
                    'permissions' => ['view-customers', 'create-customers', 'edit-customers', 'view-sales', 'view-sale-returns', 'create-sale-returns', 'view-products'],
                ],
                [
                    'name'        => 'report-viewer',
                    'label'       => 'Report Viewer',
                    'description' => 'Read-only access to reports and analytics',
                    'permissions' => ['view-reports', 'export-reports', 'view-sales', 'view-purchases', 'view-expenses', 'manage-analytics'],
                ],
                [
                    'name'        => 'branch-staff',
                    'label'       => 'Branch Staff',
                    'description' => 'General staff with basic branch access',
                    'permissions' => ['view-pos', 'create-sales', 'view-customers', 'view-products', 'view-cash-registers'],
                ],
                [
                    'name'        => 'quotation-officer',
                    'label'       => 'Quotation Officer',
                    'description' => 'Manages quotations and customer proposals',
                    'permissions' => ['view-quotations', 'create-quotations', 'edit-quotations', 'send-quotations', 'view-customers', 'view-products', 'export-quotations'],
                ],
            ];

            foreach ($demoRoles as $roleData) {
                $role = \App\Models\Role::firstOrCreate(
                    ['name' => $roleData['name'], 'guard_name' => 'web'],
                    [
                        'label'       => $roleData['label'],
                        'description' => $roleData['description'],
                        'created_by'  => $companyId,
                    ]
                );

                $permissions = Permission::whereIn('name', $roleData['permissions'])->get();
                $role->syncPermissions($permissions);
            }

            // Assign roles to demo users created in UserSeeder
            $demoUserRoles = [
                'john.smith@example.com'      => 'cashier',
                'sarah.johnson@example.com'   => 'sales-staff',
                'mike.davis@example.com'      => 'inventory-manager',
                'emily.wilson@example.com'    => 'accountant',
                'robert.brown@example.com'    => 'store-supervisor',
                'jessica.taylor@example.com'  => 'purchase-officer',
                'david.martinez@example.com'  => 'customer-support',
                'amanda.anderson@example.com' => 'report-viewer',
                'chris.thomas@example.com'    => 'branch-staff',
                'laura.jackson@example.com'   => 'quotation-officer',
            ];

            foreach ($demoUserRoles as $email => $roleName) {
                $user = \App\Models\User::where('email', $email)->first();
                if ($user) {
                    $user->syncRoles([$roleName]);
                }
            }
        }
    }
}
