<?php

namespace Database\Seeders;

use App\Models\PosSession;
use App\Models\User;
use App\Models\Branch;
use App\Models\CashRegister;
use Illuminate\Database\Seeder;

class PosSessionSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('type', 'company')->take(3)->get();
        $branches = Branch::take(2)->get();
        $cashRegisters = CashRegister::take(2)->get();

        if ($users->isEmpty() || $branches->isEmpty() || $cashRegisters->isEmpty()) {
            $this->command->warn('No users, branches, or cash registers found. Please seed them first.');
            return;
        }

        $sessions = [
            [
                'user_id' => $users->first()->id,
                'branch_id' => $branches->first()->id,
                'cash_register_id' => $cashRegisters->first()->id,
                'opening_balance' => 100.00,
                'total_sales' => 15,
                'total_sales_amount' => 450.75,
                'status' => 'active',
            ],
            [
                'user_id' => $users->skip(1)->first()->id,
                'branch_id' => $branches->last()->id,
                'cash_register_id' => $cashRegisters->last()->id,
                'opening_balance' => 200.00,
                'closing_balance' => 380.50,
                'expected_balance' => 375.25,
                'difference' => 5.25,
                'total_sales' => 8,
                'total_sales_amount' => 175.25,
                'status' => 'closed',
                'closed_at' => now()->subHours(2),
            ],
        ];

        foreach ($sessions as $sessionData) {
            PosSession::create($sessionData);
        }

        $this->command->info('POS sessions seeded successfully!');
    }
}