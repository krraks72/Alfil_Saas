<?php

namespace Database\Seeders;

use App\Models\PayoutRequest;
use App\Models\User;
use Illuminate\Database\Seeder;

class PayoutRequestSeeder extends Seeder
{
    public function run(): void
    {
        if (!IsDemo()) {
            return;
        }

        $company = User::where('email', 'company@example.com')->first();
        $otherCompanies = User::where('type', 'company')->where('email', '!=', 'company@example.com')->take(3)->get();

        if (!$company) {
            $this->command->warn('No company users found. Please seed users first.');
            return;
        }

        // company@example.com total earned = 29.99 + 49.99 + 99.99 + 39.99 = 219.96
        // Payout requests must stay within earned amount to keep available balance positive
        $companyPayouts = [
            ['amount' => 50.00,  'status' => 'approved', 'notes' => 'Referral commission for Q1'],
            ['amount' => 30.00,  'status' => 'pending',  'notes' => 'Monthly commission payout request'],
            ['amount' => 20.00,  'status' => 'rejected', 'notes' => 'Insufficient commission balance'],
        ];

        foreach ($companyPayouts as $data) {
            PayoutRequest::create([
                'company_id' => $company->id,
                'amount'     => $data['amount'],
                'status'     => $data['status'],
                'notes'      => $data['notes'],
            ]);
        }

        // Extra payout requests for other company users - visible on superadmin side
        foreach ($otherCompanies as $otherCompany) {
            PayoutRequest::create([
                'company_id' => $otherCompany->id,
                'amount'     => rand(50, 200),
                'status'     => collect(['pending', 'approved', 'rejected'])->random(),
                'notes'      => 'Commission payout request',
            ]);
        }

        $this->command->info('Payout requests seeded successfully!');
    }
}