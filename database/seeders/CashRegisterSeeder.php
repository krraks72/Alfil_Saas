<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CashRegister;
use App\Models\Branch;

class CashRegisterSeeder extends Seeder
{
    public function run(): void
    {
        $branches = Branch::all();

        foreach ($branches as $branch) {
            if (!IsDemo()) {
                CashRegister::firstOrCreate(
                    ['created_by' => $branch->created_by, 'branch_id' => $branch->id, 'name' => 'Main Register'],
                    ['description' => 'Main cash register', 'opening_balance' => 1000.00, 'current_balance' => 1000.00, 'status' => 'active']
                );
            }
        }

        if (IsDemo()) {
            $company = \App\Models\User::where('email', 'company@example.com')->first();
            if (!$company) return;

            $branches = Branch::where('created_by', $company->id)->where('status', 'active')->get();
            if ($branches->isEmpty()) return;

            $registers = [
                ['name' => 'Main Counter',    'description' => 'Primary counter register',       'opening_balance' => 1000.00, 'status' => 'active'],
                ['name' => 'Express Lane',    'description' => 'Express checkout register',       'opening_balance' => 500.00,  'status' => 'active'],
                ['name' => 'Counter 1',       'description' => 'General purpose register',        'opening_balance' => 750.00,  'status' => 'active'],
                ['name' => 'Counter 2',       'description' => 'General purpose register',        'opening_balance' => 750.00,  'status' => 'active'],
                ['name' => 'VIP Counter',     'description' => 'VIP customer service register',   'opening_balance' => 2000.00, 'status' => 'active'],
                ['name' => 'Self Checkout 1', 'description' => 'Self service checkout register',  'opening_balance' => 300.00,  'status' => 'active'],
                ['name' => 'Self Checkout 2', 'description' => 'Self service checkout register',  'opening_balance' => 300.00,  'status' => 'active'],
                ['name' => 'Returns Desk',    'description' => 'Returns and refunds register',    'opening_balance' => 500.00,  'status' => 'active'],
                ['name' => 'Kiosk Register',  'description' => 'Kiosk payment register',          'opening_balance' => 200.00,  'status' => 'inactive'],
                ['name' => 'Backup Register', 'description' => 'Backup register for busy hours',  'opening_balance' => 1000.00, 'status' => 'inactive'],
            ];

            foreach ($registers as $index => $registerData) {
                $branch = $branches->get($index % $branches->count());
                CashRegister::create([
                    'created_by'      => $company->id,
                    'branch_id'       => $branch->id,
                    'name'            => $registerData['name'],
                    'description'     => $registerData['description'] . ' (' . $branch->name . ')',
                    'opening_balance' => $registerData['opening_balance'],
                    'current_balance' => $registerData['opening_balance'],
                    'status'          => $registerData['status'],
                ]);
            }
        }
    }
}