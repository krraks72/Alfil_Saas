<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BranchSalesTarget;
use App\Models\Branch;
use App\Models\User;

class BranchSalesTargetSeeder extends Seeder
{
    public function run(): void
    {
        if (!IsDemo()) {
            return;
        }

        $company = User::where('email', 'company@example.com')->first();

        if (!$company) {
            $this->command->warn('Company user not found. Please run UserSeeder first.');
            return;
        }

        $branches = Branch::where('created_by', $company->id)->where('status', 'active')->get();

        if ($branches->isEmpty()) {
            $this->command->warn('No branches found. Please run BranchSeeder first.');
            return;
        }

        // Use branches that have cash registers (same as SaleSeeder uses)
        $branchesWithRegisters = \App\Models\CashRegister::where('created_by', $company->id)
            ->where('status', 'active')
            ->pluck('branch_id')
            ->unique()
            ->values();

        if ($branchesWithRegisters->isNotEmpty()) {
            $branches = Branch::whereIn('id', $branchesWithRegisters)->get();
        }

        $months = [];
        for ($i = 9; $i >= 0; $i--) {
            $months[] = now()->subMonths($i)->format('Y-m');
        }

        foreach ($months as $month) {
            $branch = $branches->random();

            BranchSalesTarget::firstOrCreate(
                [
                    'branch_id' => $branch->id,
                    'month'     => $month,
                ],
                [
                    'target_amount' => rand(50000, 200000),
                    'created_by'    => $company->id,
                ]
            );
        }

        $this->command->info('Branch sales targets created successfully.');
    }
}