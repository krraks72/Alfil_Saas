<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ExpenseCategory;
use App\Models\User;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        if (!IsDemo()) {
            $companies = User::where('type', 'company')->get();
            foreach ($companies as $company) {
                ExpenseCategory::firstOrCreate(
                    ['created_by' => $company->id, 'name' => 'General Expenses'],
                    ['slug' => 'general-expenses', 'description' => 'General business expenses', 'status' => 'active']
                );
            }
        } else {
            $company = User::where('email', 'company@example.com')->first();

            if ($company) {
                ExpenseCategory::create([
                    'created_by' => $company->id,
                    'name' => 'Office Supplies',
                    'slug' => 'office-supplies',
                    'description' => 'Stationery, paper, and office equipment',
                    'status' => 'active'
                ]);

                ExpenseCategory::create([
                    'created_by' => $company->id,
                    'name' => 'Travel & Transportation',
                    'slug' => 'travel-transportation',
                    'description' => 'Business travel, fuel, and transportation costs',
                    'status' => 'active'
                ]);

                ExpenseCategory::create([
                    'created_by' => $company->id,
                    'name' => 'Marketing & Advertising',
                    'slug' => 'marketing-advertising',
                    'description' => 'Promotional activities and advertising expenses',
                    'status' => 'active'
                ]);

                ExpenseCategory::create([
                    'created_by' => $company->id,
                    'name' => 'Utilities',
                    'slug' => 'utilities',
                    'description' => 'Electricity, water, internet, and phone bills',
                    'status' => 'inactive'
                ]);

                ExpenseCategory::create([
                    'created_by' => $company->id,
                    'name' => 'Salaries & Wages',
                    'slug' => 'salaries-wages',
                    'description' => 'Employee salaries, wages and bonuses',
                    'status' => 'active'
                ]);

                ExpenseCategory::create([
                    'created_by' => $company->id,
                    'name' => 'Rent & Lease',
                    'slug' => 'rent-lease',
                    'description' => 'Office and warehouse rent or lease payments',
                    'status' => 'active'
                ]);

                ExpenseCategory::create([
                    'created_by' => $company->id,
                    'name' => 'Repairs & Maintenance',
                    'slug' => 'repairs-maintenance',
                    'description' => 'Equipment repairs and facility maintenance costs',
                    'status' => 'active'
                ]);

                ExpenseCategory::create([
                    'created_by' => $company->id,
                    'name' => 'Software & Subscriptions',
                    'slug' => 'software-subscriptions',
                    'description' => 'Software licenses and online subscription fees',
                    'status' => 'active'
                ]);

                ExpenseCategory::create([
                    'created_by' => $company->id,
                    'name' => 'Training & Development',
                    'slug' => 'training-development',
                    'description' => 'Staff training, workshops and development programs',
                    'status' => 'active'
                ]);

                ExpenseCategory::create([
                    'created_by' => $company->id,
                    'name' => 'Miscellaneous',
                    'slug' => 'miscellaneous',
                    'description' => 'Other uncategorized business expenses',
                    'status' => 'inactive'
                ]);
            }
        }
    }
}