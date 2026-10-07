<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (!IsDemo()) {
            $this->call([
                PermissionSeeder::class,
                RoleSeeder::class,
                PlanSeeder::class,
                UserSeeder::class,
                ManagerRoleSeeder::class,
                EmailTemplateSeeder::class,
                NotificationTemplateSeeder::class,
                CurrencySeeder::class,
                LandingPageCustomPageSeeder::class,
            ]);
        } else {
            $this->call([
                PermissionSeeder::class,
                RoleSeeder::class,
                PlanSeeder::class,
                UserSeeder::class,
                ManagerRoleSeeder::class,
                CompanySeeder::class,
                BranchSeeder::class,
                CashRegisterSeeder::class,
                CustomerSeeder::class,
                // DefaultCustomerSeeder::class,
                VendorSeeder::class,
                BrandSeeder::class,
                CategorySeeder::class,
                TaxSeeder::class,
                UnitSeeder::class,
                ProductSeeder::class,
                SaleSeeder::class,
                SaleReturnSeeder::class,
                PurchaseSeeder::class,
                PurchaseReturnSeeder::class,
                QuotationSeeder::class,
                ExpenseCategorySeeder::class,
                ExpenseSeeder::class,
                CouponSeeder::class,
                PayoutRequestSeeder::class,
                PlanRequestSeeder::class,
                PlanOrderSeeder::class,
                ReferralSeeder::class,
                ReferralSettingSeeder::class,
                PosSessionSeeder::class,
                CurrencySeeder::class,
                EmailTemplateSeeder::class,
                LandingPageCustomPageSeeder::class,
                NotificationTemplateSeeder::class,
                NotificationSeeder::class,
                LoginHistorySeeder::class,
                ContactMessageSeeder::class,
                NewsletterSubscriberSeeder::class,
                BranchSalesTargetSeeder::class,
                WebhookSeeder::class,
            ]);
        }
    }
}
