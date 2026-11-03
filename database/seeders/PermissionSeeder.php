<?php

namespace Database\Seeders;

use App\Models\CommerceType;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissionNames = [];
        $permissions = [
            // Dashboard permissions
            ['name' => 'manage-dashboard', 'module' => 'dashboard', 'label' => 'Manage Dashboard', 'description' => 'Can view dashboard'],

            // User management
            ['name' => 'manage-users', 'module' => 'users', 'label' => 'Manage Users', 'description' => 'Can manage users'],
// NOT use  ['name' => 'manage-any-users', 'module' => 'users', 'label' => 'Manage All Users', 'description' => 'Manage Any Users'],
// NOT use  ['name' => 'manage-own-users', 'module' => 'users', 'label' => 'Manage Own Users', 'description' => 'Manage Limited Users that is created by own'],
            ['name' => 'view-users', 'module' => 'users', 'label' => 'View Users', 'description' => 'View Users'],
            ['name' => 'create-users', 'module' => 'users', 'label' => 'Create Users', 'description' => 'Can create users'],
            ['name' => 'edit-users', 'module' => 'users', 'label' => 'Edit Users', 'description' => 'Can edit users'],
            ['name' => 'delete-users', 'module' => 'users', 'label' => 'Delete Users', 'description' => 'Can delete users'],
            ['name' => 'reset-password-users', 'module' => 'users', 'label' => 'Reset Password Users', 'description' => 'Can reset password users'],
            ['name' => 'toggle-status-users', 'module' => 'users', 'label' => 'Change Status Users', 'description' => 'Can change status users'],
            // Login History management
            ['name' => 'manage-login-history', 'module' => 'users', 'label' => 'Manage Login History', 'description' => 'Can manage login history'],
            ['name' => 'show-login-history', 'module' => 'users', 'label' => 'Show Login History', 'description' => 'Can view login history'],
            ['name' => 'delete-login-history', 'module' => 'users', 'label' => 'Delete Login History', 'description' => 'Can delete login history'],

            // Role management
            ['name' => 'manage-roles', 'module' => 'roles', 'label' => 'Manage Roles', 'description' => 'Can manage roles'],
// NOT use  ['name' => 'manage-any-roles', 'module' => 'roles', 'label' => 'Manage All Roles', 'description' => 'Manage Any Roles'],
// NOT use  ['name' => 'manage-own-roles', 'module' => 'roles', 'label' => 'Manage Own Roles', 'description' => 'Manage Limited Roles that is created by own'],
            ['name' => 'view-roles', 'module' => 'roles', 'label' => 'View Roles', 'description' => 'View Roles'],
            ['name' => 'create-roles', 'module' => 'roles', 'label' => 'Create Roles', 'description' => 'Can create roles'],
            ['name' => 'edit-roles', 'module' => 'roles', 'label' => 'Edit Roles', 'description' => 'Can edit roles'],
            ['name' => 'delete-roles', 'module' => 'roles', 'label' => 'Delete Roles', 'description' => 'Can delete roles'],

            // Permission management
            ['name' => 'manage-permissions', 'module' => 'permissions', 'label' => 'Manage Permissions', 'description' => 'Can manage permissions'],
            ['name' => 'manage-any-permissions', 'module' => 'permissions', 'label' => 'Manage All Permissions', 'description' => 'Manage Any Permissions'],
            ['name' => 'manage-own-permissions', 'module' => 'permissions', 'label' => 'Manage Own Permissions', 'description' => 'Manage Limited Permissions that is created by own'],
            ['name' => 'view-permissions', 'module' => 'permissions', 'label' => 'View Permissions', 'description' => 'View Permissions'],
            ['name' => 'create-permissions', 'module' => 'permissions', 'label' => 'Create Permissions', 'description' => 'Can create permissions'],
            ['name' => 'edit-permissions', 'module' => 'permissions', 'label' => 'Edit Permissions', 'description' => 'Can edit permissions'],
            ['name' => 'delete-permissions', 'module' => 'permissions', 'label' => 'Delete Permissions', 'description' => 'Can delete permissions'],

            // Company management
            ['name' => 'manage-companies', 'module' => 'companies', 'label' => 'Manage Companies', 'description' => 'Can manage Companies'],
            ['name' => 'manage-any-companies', 'module' => 'companies', 'label' => 'Manage All Companies', 'description' => 'Manage Any Companies'],
            ['name' => 'manage-own-companies', 'module' => 'companies', 'label' => 'Manage Own Companies', 'description' => 'Manage Limited Companies that is created by own'],
            ['name' => 'view-companies', 'module' => 'companies', 'label' => 'View Companies', 'description' => 'View Companies'],
            ['name' => 'create-companies', 'module' => 'companies', 'label' => 'Create Companies', 'description' => 'Can create Companies'],
            ['name' => 'edit-companies', 'module' => 'companies', 'label' => 'Edit Companies', 'description' => 'Can edit Companies'],
            ['name' => 'delete-companies', 'module' => 'companies', 'label' => 'Delete Companies', 'description' => 'Can delete Companies'],
            ['name' => 'reset-password-companies', 'module' => 'companies', 'label' => 'Reset Password Companies', 'description' => 'Can reset password Companies'],
            ['name' => 'toggle-status-companies', 'module' => 'companies', 'label' => 'Change Status Companies', 'description' => 'Can change status companies'],
            ['name' => 'manage-plans-companies', 'module' => 'companies', 'label' => 'Manage Plan Companies', 'description' => 'Can manage plans companies'],
            ['name' => 'upgrade-plan-companies', 'module' => 'companies', 'label' => 'Upgrade Plan Companies', 'description' => 'Can upgrade plan of companies'],

            // Plan management
            ['name' => 'manage-plans', 'module' => 'plans', 'label' => 'Manage Plans', 'description' => 'Can manage subscription plans'],
            ['name' => 'manage-any-plans', 'module' => 'plans', 'label' => 'Manage All Plans', 'description' => 'Manage Any Plans'],
            ['name' => 'manage-own-plans', 'module' => 'plans', 'label' => 'Manage Own Plans', 'description' => 'Manage Limited Plans that is created by own'],
            ['name' => 'view-plans', 'module' => 'plans', 'label' => 'View Plans', 'description' => 'View Plans'],
            ['name' => 'create-plans', 'module' => 'plans', 'label' => 'Create Plans', 'description' => 'Can create subscription plans'],
            ['name' => 'edit-plans', 'module' => 'plans', 'label' => 'Edit Plans', 'description' => 'Can edit subscription plans'],
            ['name' => 'delete-plans', 'module' => 'plans', 'label' => 'Delete Plans', 'description' => 'Can delete subscription plans'],
            ['name' => 'request-plans', 'module' => 'plans', 'label' => 'Request Plans', 'description' => 'Can request subscription plans'],
            ['name' => 'trial-plans', 'module' => 'plans', 'label' => 'Trial Plans', 'description' => 'Can start trial for subscription plans'],
            ['name' => 'subscribe-plans', 'module' => 'plans', 'label' => 'Subscribe Plans', 'description' => 'Can subscribe to subscription plans'],


            // Coupon management
            ['name' => 'manage-coupons', 'module' => 'coupons', 'label' => 'Manage Coupons', 'description' => 'Can manage subscription Coupons'],
            ['name' => 'manage-any-coupons', 'module' => 'coupons', 'label' => 'Manage All Coupons', 'description' => 'Manage Any Coupons'],
            ['name' => 'manage-own-coupons', 'module' => 'coupons', 'label' => 'Manage Own Coupons', 'description' => 'Manage Limited Coupons that is created by own'],
            ['name' => 'view-coupons', 'module' => 'coupons', 'label' => 'View Coupons', 'description' => 'View Coupons'],
            ['name' => 'create-coupons', 'module' => 'coupons', 'label' => 'Create Coupons', 'description' => 'Can create subscription Coupons'],
            ['name' => 'edit-coupons', 'module' => 'coupons', 'label' => 'Edit Coupons', 'description' => 'Can edit subscription Coupons'],
            ['name' => 'delete-coupons', 'module' => 'coupons', 'label' => 'Delete Coupons', 'description' => 'Can delete subscription Coupons'],
            ['name' => 'toggle-status-coupons', 'module' => 'coupons', 'label' => 'Change Status Coupons', 'description' => 'Can change status Coupons'],

            // Plan Requests management
            ['name' => 'manage-plan-requests', 'module' => 'plan_requests', 'label' => 'Manage Plan Requests', 'description' => 'Can manage plan requests'],
            ['name' => 'view-plan-requests', 'module' => 'plan_requests', 'label' => 'View Plan Requests', 'description' => 'View Plan Requests'],
            ['name' => 'create-plan-requests', 'module' => 'plan_requests', 'label' => 'Create Plan Requests', 'description' => 'Can create plan requests'],
            ['name' => 'edit-plan-requests', 'module' => 'plan_requests', 'label' => 'Edit Plan Requests', 'description' => 'Can edit plan requests'],
            ['name' => 'delete-plan-requests', 'module' => 'plan_requests', 'label' => 'Delete Plan Requests', 'description' => 'Can delete plan requests'],
            ['name' => 'approve-plan-requests', 'module' => 'plan_requests', 'label' => 'Approve plan requests', 'description' => 'Can approve plan requests'],
            ['name' => 'reject-plan-requests', 'module' => 'plan_requests', 'label' => 'Reject plan requests', 'description' => 'Can reject plplan requests'],

            // Plan Orders management
            ['name' => 'manage-plan-orders', 'module' => 'plan_orders', 'label' => 'Manage Plan Orders', 'description' => 'Can manage plan orders'],
            ['name' => 'view-plan-orders', 'module' => 'plan_orders', 'label' => 'View Plan Orders', 'description' => 'View Plan Orders'],
            ['name' => 'create-plan-orders', 'module' => 'plan_orders', 'label' => 'Create Plan Orders', 'description' => 'Can create plan orders'],
            ['name' => 'edit-plan-orders', 'module' => 'plan_orders', 'label' => 'Edit Plan Orders', 'description' => 'Can edit plan orders'],
            ['name' => 'delete-plan-orders', 'module' => 'plan_orders', 'label' => 'Delete Plan Orders', 'description' => 'Can delete plan orders'],
            ['name' => 'approve-plan-orders', 'module' => 'plan_orders', 'label' => 'Approve Plan Orders', 'description' => 'Can approve plan orders'],
            ['name' => 'reject-plan-orders', 'module' => 'plan_orders', 'label' => 'Reject Plan Orders', 'description' => 'Can reject plan orders'],


            // Settings
            ['name' => 'manage-settings', 'module' => 'settings', 'label' => 'Manage Settings', 'description' => 'Can manage All settings'],
            ['name' => 'manage-system-settings', 'module' => 'settings', 'label' => 'Manage System Settings', 'description' => 'Can manage system settings'],
            ['name' => 'manage-email-settings', 'module' => 'settings', 'label' => 'Manage Email Settings', 'description' => 'Can manage email settings'],
            ['name' => 'manage-brand-settings', 'module' => 'settings', 'label' => 'Manage Brand Settings', 'description' => 'Can manage brand settings'],
            ['name' => 'manage-company-settings', 'module' => 'settings', 'label' => 'Manage Company Settings', 'description' => 'Can manage Company settings'],
            ['name' => 'manage-storage-settings', 'module' => 'settings', 'label' => 'Manage Storage Settings', 'description' => 'Can manage storage settings'],
            ['name' => 'manage-payment-settings', 'module' => 'settings', 'label' => 'Manage Payment Settings', 'description' => 'Can manage payment settings'],
            ['name' => 'manage-currency-settings', 'module' => 'settings', 'label' => 'Manage Currency Settings', 'description' => 'Can manage currency settings'],
            ['name' => 'manage-recaptcha-settings', 'module' => 'settings', 'label' => 'Manage ReCaptch Settings', 'description' => 'Can manage recaptcha settings'],
            ['name' => 'manage-chatgpt-settings', 'module' => 'settings', 'label' => 'Manage ChatGpt Settings', 'description' => 'Can manage chatgpt settings'],
            ['name' => 'manage-cookie-settings', 'module' => 'settings', 'label' => 'Manage Cookie(GDPR) Settings', 'description' => 'Can manage cookie settings'],
            ['name' => 'manage-seo-settings', 'module' => 'settings', 'label' => 'Manage Seo Settings', 'description' => 'Can manage seo settings'],
            ['name' => 'manage-cache-settings', 'module' => 'settings', 'label' => 'Manage Cache Settings', 'description' => 'Can manage cache settings'],
            ['name' => 'manage-account-settings', 'module' => 'settings', 'label' => 'Manage Account Settings', 'description' => 'Can manage account settings'],


            // Currency management
            ['name' => 'manage-currencies', 'module' => 'currencies', 'label' => 'Manage Currencies', 'description' => 'Can manage currencies'],
            ['name' => 'manage-any-currencies', 'module' => 'currencies', 'label' => 'Manage All currencies', 'description' => 'Manage Any currencies'],
            ['name' => 'manage-own-currencies', 'module' => 'currencies', 'label' => 'Manage Own currencies', 'description' => 'Manage Limited currencies that is created by own'],
            ['name' => 'view-currencies', 'module' => 'currencies', 'label' => 'View Currencies', 'description' => 'View Currencies'],
            ['name' => 'create-currencies', 'module' => 'currencies', 'label' => 'Create Currencies', 'description' => 'Can create currencies'],
            ['name' => 'edit-currencies', 'module' => 'currencies', 'label' => 'Edit Currencies', 'description' => 'Can edit currencies'],
            ['name' => 'delete-currencies', 'module' => 'currencies', 'label' => 'Delete Currencies', 'description' => 'Can delete currencies'],



            // Referral management
            ['name' => 'manage-referral', 'module' => 'referral', 'label' => 'Manage Referral', 'description' => 'Can manage referral program'],
            ['name' => 'manage-users-referral', 'module' => 'referral', 'label' => 'Manage User Referral', 'description' => 'Can manage user referral program'],
            ['name' => 'manage-setting-referral', 'module' => 'referral', 'label' => 'Manage Referral Setting', 'description' => 'Can manage Referral Setting'],
            ['name' => 'manage-payout-referral', 'module' => 'referral', 'label' => 'Manage Referral Payout', 'description' => 'Can manage Referral Payout program'],
            ['name' => 'approve-payout-referral', 'module' => 'referral', 'label' => 'Manage Referral', 'description' => 'Can approve payout request'],
            ['name' => 'reject-payout-referral', 'module' => 'referral', 'label' => 'Manage Referral', 'description' => 'Can approve payout request'],

            // Language management
            ['name' => 'manage-language', 'module' => 'language', 'label' => 'Manage Language', 'description' => 'Can manage language'],
            ['name' => 'edit-language', 'module' => 'language', 'label' => 'Edit Language', 'description' => 'Edit Language'],
            ['name' => 'view-language', 'module' => 'language', 'label' => 'View Language', 'description' => 'View Language'],

            // Media management
            ['name' => 'manage-media', 'module' => 'media', 'label' => 'Manage Media', 'description' => 'Can manage media'],
            ['name' => 'manage-any-media', 'module' => 'media', 'label' => 'Manage All Media', 'description' => 'Manage Any media'],
            ['name' => 'manage-own-media', 'module' => 'media', 'label' => 'Manage Own Media', 'description' => 'Manage Limited media that is created by own'],
            ['name' => 'create-media', 'module' => 'media', 'label' => 'Create media', 'description' => 'Create media'],
            ['name' => 'edit-media', 'module' => 'media', 'label' => 'Edit media', 'description' => 'Edit media'],
            ['name' => 'delete-media', 'module' => 'media', 'label' => 'Delete media', 'description' => 'Delete media'],
            ['name' => 'view-media', 'module' => 'media', 'label' => 'View media', 'description' => 'View media'],
            ['name' => 'download-media', 'module' => 'media', 'label' => 'Download media', 'description' => 'Download media'],


            // Landing Page management
            ['name' => 'manage-landing-page', 'module' => 'landing_page', 'label' => 'Manage Landing Page', 'description' => 'Can manage landing page'],
            ['name' => 'view-landing-page', 'module' => 'landing_page', 'label' => 'View Landing Page', 'description' => 'View landing page'],
            ['name' => 'edit-landing-page', 'module' => 'landing_page', 'label' => 'Edit Landing Page', 'description' => 'Edit landing page'],

            // Branch management
            ['name' => 'view-branches', 'module' => 'branches', 'label' => 'View Branches', 'description' => 'Can view branches'],
            ['name' => 'create-branches', 'module' => 'branches', 'label' => 'Create Branches', 'description' => 'Can create branches'],
            ['name' => 'edit-branches', 'module' => 'branches', 'label' => 'Edit Branches', 'description' => 'Can edit branches'],
            ['name' => 'delete-branches', 'module' => 'branches', 'label' => 'Delete Branches', 'description' => 'Can delete branches'],
            ['name' => 'manage-branch-status', 'module' => 'branches', 'label' => 'Manage Branch Status', 'description' => 'Can manage branch status'],
// NOT use  ['name' => 'view-own-branch', 'module' => 'branches', 'label' => 'View Own Branch', 'description' => 'Can view assigned branch'],
// NOT use  ['name' => 'edit-own-branch', 'module' => 'branches', 'label' => 'Edit Own Branch', 'description' => 'Can edit assigned branch'],

            // Cash Register management
            ['name' => 'view-cash-registers', 'module' => 'cash_registers', 'label' => 'View Cash Registers', 'description' => 'Can view cash registers'],
            ['name' => 'create-cash-registers', 'module' => 'cash_registers', 'label' => 'Create Cash Registers', 'description' => 'Can create cash registers'],
            ['name' => 'edit-cash-registers', 'module' => 'cash_registers', 'label' => 'Edit Cash Registers', 'description' => 'Can edit cash registers'],
            ['name' => 'delete-cash-registers', 'module' => 'cash_registers', 'label' => 'Delete Cash Registers', 'description' => 'Can delete cash registers'],
            ['name' => 'manage-cash-register-status', 'module' => 'cash_registers', 'label' => 'Manage Cash Register Status', 'description' => 'Can manage cash register status'],
// NOT use  ['name' => 'manage-cash-register-balance', 'module' => 'cash_registers', 'label' => 'Manage Cash Register Balance', 'description' => 'Can manage cash register balance'],
// NOT use  ['name' => 'view-branch-cash-registers', 'module' => 'cash_registers', 'label' => 'View Branch Cash Registers', 'description' => 'Can view branch cash registers'],
// NOT use  ['name' => 'operate-cash-register', 'module' => 'cash_registers', 'label' => 'Operate Cash Register', 'description' => 'Can operate cash register'],

            // Customer management
            ['name' => 'view-customers', 'module' => 'customers', 'label' => 'View Customers', 'description' => 'Can view customers'],
            ['name' => 'create-customers', 'module' => 'customers', 'label' => 'Create Customers', 'description' => 'Can create customers'],
            ['name' => 'edit-customers', 'module' => 'customers', 'label' => 'Edit Customers', 'description' => 'Can edit customers'],
            ['name' => 'delete-customers', 'module' => 'customers', 'label' => 'Delete Customers', 'description' => 'Can delete customers'],
            ['name' => 'manage-customer-status', 'module' => 'customers', 'label' => 'Manage Customer Status', 'description' => 'Can manage customer status'],
            ['name' => 'export-customers', 'module' => 'customers', 'label' => 'Export Customers', 'description' => 'Can export customers'],
            ['name' => 'import-customers', 'module' => 'customers', 'label' => 'Import Customers', 'description' => 'Can import customers'],

            // Vendor management
            ['name' => 'view-vendors', 'module' => 'vendors', 'label' => 'View Vendors', 'description' => 'Can view vendors'],
            ['name' => 'create-vendors', 'module' => 'vendors', 'label' => 'Create Vendors', 'description' => 'Can create vendors'],
            ['name' => 'edit-vendors', 'module' => 'vendors', 'label' => 'Edit Vendors', 'description' => 'Can edit vendors'],
            ['name' => 'delete-vendors', 'module' => 'vendors', 'label' => 'Delete Vendors', 'description' => 'Can delete vendors'],
            ['name' => 'manage-vendor-status', 'module' => 'vendors', 'label' => 'Manage Vendor Status', 'description' => 'Can manage vendor status'],
            ['name' => 'export-vendors', 'module' => 'vendors', 'label' => 'Export Vendors', 'description' => 'Can export vendors'],
            ['name' => 'import-vendors', 'module' => 'vendors', 'label' => 'Import Vendors', 'description' => 'Can import vendors'],

            // Brand management
            ['name' => 'view-brands', 'module' => 'brands', 'label' => 'View Brands', 'description' => 'Can view brands'],
            ['name' => 'create-brands', 'module' => 'brands', 'label' => 'Create Brands', 'description' => 'Can create brands'],
            ['name' => 'edit-brands', 'module' => 'brands', 'label' => 'Edit Brands', 'description' => 'Can edit brands'],
            ['name' => 'delete-brands', 'module' => 'brands', 'label' => 'Delete Brands', 'description' => 'Can delete brands'],
            ['name' => 'manage-brand-status', 'module' => 'brands', 'label' => 'Manage Brand Status', 'description' => 'Can manage brand status'],

            // Category management
            ['name' => 'view-categories', 'module' => 'categories', 'label' => 'View Categories', 'description' => 'Can view categories'],
            ['name' => 'create-categories', 'module' => 'categories', 'label' => 'Create Categories', 'description' => 'Can create categories'],
            ['name' => 'edit-categories', 'module' => 'categories', 'label' => 'Edit Categories', 'description' => 'Can edit categories'],
            ['name' => 'delete-categories', 'module' => 'categories', 'label' => 'Delete Categories', 'description' => 'Can delete categories'],
            ['name' => 'manage-category-status', 'module' => 'categories', 'label' => 'Manage Category Status', 'description' => 'Can manage category status'],

            // Tax management
            ['name' => 'view-taxes', 'module' => 'taxes', 'label' => 'View Taxes', 'description' => 'Can view taxes'],
            ['name' => 'create-taxes', 'module' => 'taxes', 'label' => 'Create Taxes', 'description' => 'Can create taxes'],
            ['name' => 'edit-taxes', 'module' => 'taxes', 'label' => 'Edit Taxes', 'description' => 'Can edit taxes'],
            ['name' => 'delete-taxes', 'module' => 'taxes', 'label' => 'Delete Taxes', 'description' => 'Can delete taxes'],
            ['name' => 'manage-tax-status', 'module' => 'taxes', 'label' => 'Manage Tax Status', 'description' => 'Can manage tax status'],

            // Unit management
            ['name' => 'view-units', 'module' => 'units', 'label' => 'View Units', 'description' => 'Can view units'],
            ['name' => 'create-units', 'module' => 'units', 'label' => 'Create Units', 'description' => 'Can create units'],
            ['name' => 'edit-units', 'module' => 'units', 'label' => 'Edit Units', 'description' => 'Can edit units'],
            ['name' => 'delete-units', 'module' => 'units', 'label' => 'Delete Units', 'description' => 'Can delete units'],
            ['name' => 'manage-unit-status', 'module' => 'units', 'label' => 'Manage Unit Status', 'description' => 'Can manage unit status'],

            // Product management
            ['name' => 'view-products', 'module' => 'products', 'label' => 'View Products', 'description' => 'Can view products'],
            ['name' => 'create-products', 'module' => 'products', 'label' => 'Create Products', 'description' => 'Can create products'],
            ['name' => 'edit-products', 'module' => 'products', 'label' => 'Edit Products', 'description' => 'Can edit products'],
            ['name' => 'delete-products', 'module' => 'products', 'label' => 'Delete Products', 'description' => 'Can delete products'],
            ['name' => 'manage-product-status', 'module' => 'products', 'label' => 'Manage Product Status', 'description' => 'Can manage product status'],
            ['name' => 'export-products', 'module' => 'products', 'label' => 'Export Products', 'description' => 'Can export products'],
            ['name' => 'view-processed-products', 'module' => 'products', 'label' => 'View Processed Products', 'description' => 'Can view processed products'],

            // Expense Category management
            ['name' => 'view-expense-categories', 'module' => 'expense_categories', 'label' => 'View Expense Categories', 'description' => 'Can view expense categories'],
            ['name' => 'create-expense-categories', 'module' => 'expense_categories', 'label' => 'Create Expense Categories', 'description' => 'Can create expense categories'],
            ['name' => 'edit-expense-categories', 'module' => 'expense_categories', 'label' => 'Edit Expense Categories', 'description' => 'Can edit expense categories'],
            ['name' => 'delete-expense-categories', 'module' => 'expense_categories', 'label' => 'Delete Expense Categories', 'description' => 'Can delete expense categories'],
            ['name' => 'manage-expense-category-status', 'module' => 'expense_categories', 'label' => 'Manage Expense Category Status', 'description' => 'Can manage expense category status'],

            // Expense management
            ['name' => 'view-expenses', 'module' => 'expenses', 'label' => 'View Expenses', 'description' => 'Can view expenses'],
            ['name' => 'create-expenses', 'module' => 'expenses', 'label' => 'Create Expenses', 'description' => 'Can create expenses'],
            ['name' => 'edit-expenses', 'module' => 'expenses', 'label' => 'Edit Expenses', 'description' => 'Can edit expenses'],
            ['name' => 'delete-expenses', 'module' => 'expenses', 'label' => 'Delete Expenses', 'description' => 'Can delete expenses'],
            ['name' => 'approve-expenses', 'module' => 'expenses', 'label' => 'Approve Expenses', 'description' => 'Can approve expenses'],
            ['name' => 'reject-expenses', 'module' => 'expenses', 'label' => 'Reject Expenses', 'description' => 'Can reject expenses'],
            ['name' => 'export-expenses', 'module' => 'expenses', 'label' => 'Export Expenses', 'description' => 'Can export expenses'],

            // POS management
            ['name' => 'view-pos', 'module' => 'pos', 'label' => 'View POS', 'description' => 'Can access POS interface'],
            ['name' => 'create-sales', 'module' => 'pos', 'label' => 'Create Sales', 'description' => 'Can create sales transactions'],
            ['name' => 'manage-pos-sessions', 'module' => 'pos', 'label' => 'Manage POS Sessions', 'description' => 'Can manage POS sessions'],
            ['name' => 'apply-discounts', 'module' => 'pos', 'label' => 'Apply Discounts', 'description' => 'Can apply discounts to sales'],
            ['name' => 'process-refunds', 'module' => 'pos', 'label' => 'Process Refunds', 'description' => 'Can process refunds'],

            // Sales management
            ['name' => 'view-sales', 'module' => 'sales', 'label' => 'View Sales', 'description' => 'Can view sales'],
// NOT use  ['name' => 'edit-sales', 'module' => 'sales', 'label' => 'Edit Sales', 'description' => 'Can edit sales'],
// NOT use  ['name' => 'delete-sales', 'module' => 'sales', 'label' => 'Delete Sales', 'description' => 'Can delete sales'],
// NOT use  ['name' => 'manage-sales', 'module' => 'sales', 'label' => 'Manage Sales', 'description' => 'Can manage sales'],
            ['name' => 'export-sales', 'module' => 'sales', 'label' => 'Export Sales', 'description' => 'Can export sales'],

            // Purchase management
            ['name' => 'view-purchases', 'module' => 'purchases', 'label' => 'View Purchases', 'description' => 'Can view purchases'],
            ['name' => 'create-purchases', 'module' => 'purchases', 'label' => 'Create Purchases', 'description' => 'Can create purchases'],
            ['name' => 'edit-purchases', 'module' => 'purchases', 'label' => 'Edit Purchases', 'description' => 'Can edit purchases'],
            ['name' => 'delete-purchases', 'module' => 'purchases', 'label' => 'Delete Purchases', 'description' => 'Can delete purchases'],
            ['name' => 'manage-purchase-status', 'module' => 'purchases', 'label' => 'Manage Purchase Status', 'description' => 'Can manage purchase status'],
            ['name' => 'export-purchases', 'module' => 'purchases', 'label' => 'Export Purchases', 'description' => 'Can export purchases'],

            // Purchase Return management
            ['name' => 'view-purchase-returns', 'module' => 'purchase_returns', 'label' => 'View Purchase Returns', 'description' => 'Can view purchase returns'],
            ['name' => 'create-purchase-returns', 'module' => 'purchase_returns', 'label' => 'Create Purchase Returns', 'description' => 'Can create purchase returns'],
            ['name' => 'edit-purchase-returns', 'module' => 'purchase_returns', 'label' => 'Edit Purchase Returns', 'description' => 'Can edit purchase returns'],
            ['name' => 'delete-purchase-returns', 'module' => 'purchase_returns', 'label' => 'Delete Purchase Returns', 'description' => 'Can delete purchase returns'],
            ['name' => 'approve-purchase-returns', 'module' => 'purchase_returns', 'label' => 'Approve Purchase Returns', 'description' => 'Can approve purchase returns'],
            ['name' => 'reject-purchase-returns', 'module' => 'purchase_returns', 'label' => 'Reject Purchase Returns', 'description' => 'Can reject purchase returns'],
            ['name' => 'export-purchase-returns', 'module' => 'purchase_returns', 'label' => 'Export Purchase Returns', 'description' => 'Can export purchase returns'],

            // Sale Return management
            ['name' => 'view-sale-returns', 'module' => 'sale_returns', 'label' => 'View Sale Returns', 'description' => 'Can view sale returns'],
            ['name' => 'create-sale-returns', 'module' => 'sale_returns', 'label' => 'Create Sale Returns', 'description' => 'Can create sale returns'],
            ['name' => 'edit-sale-returns', 'module' => 'sale_returns', 'label' => 'Edit Sale Returns', 'description' => 'Can edit sale returns'],
            ['name' => 'delete-sale-returns', 'module' => 'sale_returns', 'label' => 'Delete Sale Returns', 'description' => 'Can delete sale returns'],
            ['name' => 'approve-sale-returns', 'module' => 'sale_returns', 'label' => 'Approve Sale Returns', 'description' => 'Can approve sale returns'],
            ['name' => 'reject-sale-returns', 'module' => 'sale_returns', 'label' => 'Reject Sale Returns', 'description' => 'Can reject sale returns'],
            ['name' => 'export-sale-returns', 'module' => 'sale_returns', 'label' => 'Export Sale Returns', 'description' => 'Can export sale returns'],

            // Quotation management
            ['name' => 'view-quotations', 'module' => 'quotations', 'label' => 'View Quotations', 'description' => 'Can view quotations'],
            ['name' => 'create-quotations', 'module' => 'quotations', 'label' => 'Create Quotations', 'description' => 'Can create quotations'],
            ['name' => 'edit-quotations', 'module' => 'quotations', 'label' => 'Edit Quotations', 'description' => 'Can edit quotations'],
            ['name' => 'delete-quotations', 'module' => 'quotations', 'label' => 'Delete Quotations', 'description' => 'Can delete quotations'],
            ['name' => 'approve-quotations', 'module' => 'quotations', 'label' => 'Approve Quotations', 'description' => 'Can approve quotations'],
            ['name' => 'reject-quotations', 'module' => 'quotations', 'label' => 'Reject Quotations', 'description' => 'Can reject quotations'],
            ['name' => 'send-quotations', 'module' => 'quotations', 'label' => 'Send Quotations', 'description' => 'Can send quotations'],
            ['name' => 'convert-quotations', 'module' => 'quotations', 'label' => 'Convert Quotations', 'description' => 'Can convert quotations to sales'],
            ['name' => 'export-quotations', 'module' => 'quotations', 'label' => 'Export Quotations', 'description' => 'Can export quotations'],

            // Reports management
            ['name' => 'view-reports', 'module' => 'reports', 'label' => 'View Reports', 'description' => 'Can view reports'],
            ['name' => 'export-reports', 'module' => 'reports', 'label' => 'Export Reports', 'description' => 'Can export reports'],

            // Notification management
            ['name' => 'view-notifications', 'module' => 'notifications', 'label' => 'View Notifications', 'description' => 'Can view notifications'],
            ['name' => 'create-notifications', 'module' => 'notifications', 'label' => 'Create Notifications', 'description' => 'Can create notifications'],
            ['name' => 'edit-notifications', 'module' => 'notifications', 'label' => 'Edit Notifications', 'description' => 'Can edit notifications'],
            ['name' => 'delete-notifications', 'module' => 'notifications', 'label' => 'Delete Notifications', 'description' => 'Can delete notifications'],
            ['name' => 'manage-notification-status', 'module' => 'notifications', 'label' => 'Manage Notification Status', 'description' => 'Can manage notification status'],

            // Notification Template management
            ['name' => 'view-notification-templates', 'module' => 'notification_templates', 'label' => 'View Notification Templates', 'description' => 'Can view notification templates'],
            ['name' => 'edit-notification-templates', 'module' => 'notification_templates', 'label' => 'Edit Notification Templates', 'description' => 'Can edit notification templates'],
            ['name' => 'manage-notification-template-settings', 'module' => 'notification_templates', 'label' => 'Manage Notification Template Settings', 'description' => 'Can manage notification template settings'],

            // Branch Sales Target management
            ['name' => 'manage_branch_sales_target', 'module' => 'branch_sales_targets', 'label' => 'Manage Branch Sales Targets', 'description' => 'Can manage branch sales targets'],
            ['name' => 'view_branch_sales_target', 'module' => 'branch_sales_targets', 'label' => 'View Branch Sales Targets', 'description' => 'Can view branch sales targets'],
            ['name' => 'create_branch_sales_target', 'module' => 'branch_sales_targets', 'label' => 'Create Branch Sales Targets', 'description' => 'Can create branch sales targets'],
            ['name' => 'edit_branch_sales_target', 'module' => 'branch_sales_targets', 'label' => 'Edit Branch Sales Targets', 'description' => 'Can edit branch sales targets'],
            ['name' => 'delete_branch_sales_target', 'module' => 'branch_sales_targets', 'label' => 'Delete Branch Sales Targets', 'description' => 'Can delete branch sales targets'],

            // Calendar access
            ['name' => 'view-appointments', 'module' => 'appointments', 'label' => 'View Calendar', 'description' => 'Can view calendar events'],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                [
                    'name' => $permission['name'],
                    'guard_name' => 'web'
                ],
                [
                    'module' => $permission['module'],
                    'label' => $permission['label'],
                    'description' => $permission['description'],
                ]
            );
            $permissionNames[] = $permission['name'];
        }

        // Delete old permissions safely
        $permissionsToDelete = Permission::where('guard_name', 'web')
            ->whereNotIn('name', $permissionNames)
            ->get();
        foreach ($permissionsToDelete as $perm) {
            $perm->roles()->detach();
            $perm->delete();
        }

        $defaultTypePermissionIds = Permission::where('guard_name', 'web')
            ->whereIn('module', config('role-permissions.company', []))
            ->pluck('id');

        CommerceType::whereIn('name', ['Tienda', 'Gastrobar'])
            ->where('permissions_initialized', false)
            ->get()
            ->each(function (CommerceType $commerceType) use ($defaultTypePermissionIds) {
                $commerceType->permissions()->sync($defaultTypePermissionIds);
                $commerceType->forceFill(['permissions_initialized' => true])->save();
            });
    }
}
