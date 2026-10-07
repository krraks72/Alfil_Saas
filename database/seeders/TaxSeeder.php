<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tax;
use App\Models\User;

class TaxSeeder extends Seeder
{
    public function run(): void
    {
        if (!IsDemo()) {
            $companies = User::where('type', 'company')->get();
            foreach ($companies as $company) {
                Tax::firstOrCreate(
                    ['created_by' => $company->id, 'name' => 'Standard Tax'],
                    ['rate' => 10.00, 'type' => 'percentage', 'description' => 'Standard tax', 'status' => 'active']
                );
            }
        } else {
            $company = User::where('email', 'company@example.com')->first();

            if ($company) {
                Tax::create([
                    'created_by' => $company->id,
                    'name' => 'VAT',
                    'rate' => 10.00,
                    'type' => 'percentage',
                    'description' => 'Value Added Tax',
                    'status' => 'active'
                ]);

                Tax::create([
                    'created_by' => $company->id,
                    'name' => 'Sales Tax',
                    'rate' => 8.25,
                    'type' => 'percentage',
                    'description' => 'State sales tax',
                    'status' => 'active'
                ]);

                Tax::create([
                    'created_by' => $company->id,
                    'name' => 'Fixed Fee',
                    'rate' => 5.00,
                    'type' => 'fixed',
                    'description' => 'Fixed processing fee',
                    'status' => 'inactive'
                ]);

                Tax::create([
                    'created_by' => $company->id,
                    'name' => 'GST 5%',
                    'rate' => 5.00,
                    'type' => 'percentage',
                    'description' => 'Goods and Services Tax at 5%',
                    'status' => 'active'
                ]);

                Tax::create([
                    'created_by' => $company->id,
                    'name' => 'GST 12%',
                    'rate' => 12.00,
                    'type' => 'percentage',
                    'description' => 'Goods and Services Tax at 12%',
                    'status' => 'active'
                ]);

                Tax::create([
                    'created_by' => $company->id,
                    'name' => 'GST 18%',
                    'rate' => 18.00,
                    'type' => 'percentage',
                    'description' => 'Goods and Services Tax at 18%',
                    'status' => 'active'
                ]);

                Tax::create([
                    'created_by' => $company->id,
                    'name' => 'GST 28%',
                    'rate' => 28.00,
                    'type' => 'percentage',
                    'description' => 'Goods and Services Tax at 28%',
                    'status' => 'active'
                ]);

                Tax::create([
                    'created_by' => $company->id,
                    'name' => 'Service Tax',
                    'rate' => 6.00,
                    'type' => 'percentage',
                    'description' => 'Tax applied on services',
                    'status' => 'active'
                ]);

                Tax::create([
                    'created_by' => $company->id,
                    'name' => 'Luxury Tax',
                    'rate' => 15.00,
                    'type' => 'percentage',
                    'description' => 'Tax on luxury goods',
                    'status' => 'active'
                ]);

                Tax::create([
                    'created_by' => $company->id,
                    'name' => 'Handling Fee',
                    'rate' => 2.00,
                    'type' => 'fixed',
                    'description' => 'Fixed handling and packaging fee',
                    'status' => 'inactive'
                ]);
            }
        }
    }
}