<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Expense;
use App\Models\User;
use App\Models\Branch;
use App\Models\ExpenseCategory;

class ExpenseSeeder extends Seeder
{
    public function run(): void
    {
        if (!IsDemo()) {
            $companies = User::where('type', 'company')->get();
            foreach ($companies as $company) {
                $branch = Branch::where('created_by', $company->id)->first();
                $category = ExpenseCategory::where('created_by', $company->id)->first();

                if ($branch && $category) {
                    Expense::firstOrCreate(
                        ['created_by' => $company->id, 'title' => 'Sample Expense'],
                        [
                            'branch_id' => $branch->id,
                            'expense_category_id' => $category->id,
                            'description' => 'Sample business expense',
                            'amount' => 100.00,
                            'expense_date' => now(),
                            'status' => 'approved'
                        ]
                    );
                }
            }
        } else {
            $company = User::where('email', 'company@example.com')->first();
            $branches = Branch::where('created_by', $company->id)->where('status', 'active')->get();
            $categories = ExpenseCategory::where('created_by', $company->id)->where('status', 'active')->get();

            if ($company && $branches->count() > 0 && $categories->count() > 0) {
                $expenses = [
                    ['title' => 'Office Supplies Purchase',    'description' => 'Purchased stationery and office equipment',       'amount' => 250.00,  'days' => 5,  'status' => 'approved'],
                    ['title' => 'Business Travel',             'description' => 'Travel expenses for client meeting',               'amount' => 450.00,  'days' => 3,  'status' => 'pending'],
                    ['title' => 'Marketing Campaign',          'description' => 'Social media advertising costs',                   'amount' => 800.00,  'days' => 1,  'status' => 'rejected'],
                    ['title' => 'Equipment Maintenance',       'description' => 'Monthly maintenance for office equipment',         'amount' => 320.00,  'days' => 7,  'status' => 'approved'],
                    ['title' => 'Utility Bills',               'description' => 'Electricity and internet bills for the month',     'amount' => 180.00,  'days' => 10, 'status' => 'approved'],
                    ['title' => 'Staff Training',              'description' => 'Workshop and training program for employees',      'amount' => 600.00,  'days' => 12, 'status' => 'approved'],
                    ['title' => 'Software Subscription',       'description' => 'Annual subscription for business software tools',  'amount' => 350.00,  'days' => 15, 'status' => 'approved'],
                    ['title' => 'Office Rent',                 'description' => 'Monthly office space rental payment',              'amount' => 1200.00, 'days' => 20, 'status' => 'approved'],
                    ['title' => 'Repair & Maintenance',        'description' => 'Repair of air conditioning and plumbing',          'amount' => 275.00,  'days' => 25, 'status' => 'pending'],
                    ['title' => 'Miscellaneous Expenses',      'description' => 'Other small business expenses for the month',      'amount' => 95.00,   'days' => 30, 'status' => 'rejected'],
                ];

                foreach ($expenses as $expense) {
                    Expense::create([
                        'created_by'          => $company->id,
                        'branch_id'           => $branches->random()->id,
                        'expense_category_id' => $categories->random()->id,
                        'title'               => $expense['title'],
                        'description'         => $expense['description'],
                        'amount'              => $expense['amount'],
                        'expense_date'        => now()->subDays($expense['days']),
                        'status'              => $expense['status'],
                    ]);
                }
            }
        }
    }
}