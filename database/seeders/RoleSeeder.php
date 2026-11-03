<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create super admin role
        $superAdminRole = Role::firstOrCreate(
            ['name' => 'superadmin', 'guard_name' => 'web'],
            [
                'label' => 'Super Admin',
                'description' => 'Super Admin has full access to all features',
            ]
        );

        // Create admin role
        $adminRole = Role::firstOrCreate(
            ['name' => 'company', 'guard_name' => 'web'],
            [
                'label' => 'Company',
                'description' => 'Company has access to manage buissness',
            ]
        );

        // Get all permissions
        $permissions = Permission::all();

        // Assign all permissions to super admin
        $superAdminRole->syncPermissions($permissions);

        // Assign specific permissions to company role
        $adminPermissions = Permission::whereIn('name', [
            'manage-dashboard',
            'view-dashboard',
            'manage-users',
            'create-users',
            'edit-users',
            'delete-users',
            'view-users',
            'manage-login-history',
            'show-login-history',
            'delete-login-history',
            'reset-password-users',
            'toggle-status-users',
            'manage-roles',
            'create-roles',
            'edit-roles',
            'delete-roles',
            'view-roles',
            'view-permissions',
            'manage-plans',
            'view-plans',
            'request-plans',
            'trial-plans',
            'subscribe-plans',
            'manage-system-settings',
            'manage-email-settings',
            'manage-email-notification-settings',
            'manage-company-settings',
            'manage-brand-settings',
            'manage-payment-settings',
            'manage-currency-settings',
            'manage-slack-settings',
            'manage-twilio-settings',
            'manage-webhook-settings',
            'manage-google-calendar-settings',
            'manage-quotation-invoice-settings',
            'manage-aliaddo-settings',
            'manage-media',
            'manage-own-media',
            'create-media',
            'edit-media',
            'delete-media',
            'view-media',
            'download-media',
            'manage-language',
            'edit-language',
            'view-language',
            'manage-referral',
            'manage-users-referral',
            'manage-payout-referral',
            'view-landing-page',
            'manage-analytics',
            // Branch permissions
            'view-branches',
            'create-branches',
            'edit-branches',
            'delete-branches',
            'manage-branch-status',
            // Cash register permissions
            'view-cash-registers',
            'create-cash-registers',
            'edit-cash-registers',
            'delete-cash-registers',
            'manage-cash-register-status',
            'manage-cash-register-balance',
            // Customer permissions
            'view-customers',
            'create-customers',
            'edit-customers',
            'delete-customers',
            'manage-customer-status',
            'export-customers',
            'import-customers',
            // Vendor permissions
            'view-vendors',
            'create-vendors',
            'edit-vendors',
            'delete-vendors',
            'manage-vendor-status',
            'export-vendors',
            'import-vendors',
            // Brand permissions
            'view-brands',
            'create-brands',
            'edit-brands',
            'delete-brands',
            'manage-brand-status',
            // Category permissions
            'view-categories',
            'create-categories',
            'edit-categories',
            'delete-categories',
            'manage-category-status',
            // Tax permissions
            'view-taxes',
            'create-taxes',
            'edit-taxes',
            'delete-taxes',
            'manage-tax-status',
            // Unit permissions
            'view-units',
            'create-units',
            'edit-units',
            'delete-units',
            'manage-unit-status',
            // Product permissions
            'view-products',
            'create-products',
            'edit-products',
            'delete-products',
            'manage-product-status',
            'export-products',
            'view-processed-products',
            // Expense Category permissions
            'view-expense-categories',
            'create-expense-categories',
            'edit-expense-categories',
            'delete-expense-categories',
            'manage-expense-category-status',
            // Expense permissions
            'view-expenses',
            'create-expenses',
            'edit-expenses',
            'delete-expenses',
            'approve-expenses',
            'reject-expenses',
            'export-expenses',
            // POS permissions
            'view-pos',
            'create-sales',
            'manage-pos-sessions',
            'apply-discounts',
            'process-refunds',
            // Sales permissions
            'view-sales',
            'edit-sales',
            'delete-sales',
            'manage-sales',
            'export-sales',
            // Purchase permissions
            'view-purchases',
            'create-purchases',
            'edit-purchases',
            'delete-purchases',
            'manage-purchase-status',
            'export-purchases',
            // Purchase Return permissions
            'view-purchase-returns',
            'create-purchase-returns',
            'edit-purchase-returns',
            'delete-purchase-returns',
            'approve-purchase-returns',
            'reject-purchase-returns',
            // Sale Return permissions
            'view-sale-returns',
            'create-sale-returns',
            'edit-sale-returns',
            'delete-sale-returns',
            'approve-sale-returns',
            'reject-sale-returns',
            'export-sale-returns',
            // Quotation permissions
            'view-quotations',
            'create-quotations',
            'edit-quotations',
            'delete-quotations',
            'approve-quotations',
            'reject-quotations',
            'send-quotations',
            'convert-quotations',
            'export-quotations',
            // Reports permissions
            'view-reports',
            'export-reports',
            'manage-plan-requests',
            'manage-plan-orders',
            'delete-plan-requests',
            // Notification permissions
            'view-notifications',
            'create-notifications',
            'edit-notifications',
            'delete-notifications',
            'manage-notification-status',
            // Notification Template permissions
            'view-notification-templates',
            'edit-notification-templates',
            'manage-notification-template-settings',
            // Branch Sales Target
            'manage_branch_sales_target',
            'view_branch_sales_target',
            'create_branch_sales_target',
            'edit_branch_sales_target',
            'delete_branch_sales_target',
            
        ])->get();

        $adminRole->syncPermissions($adminPermissions);
    }
}
