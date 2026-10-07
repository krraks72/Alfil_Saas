<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Seeder;

class DefaultCustomerSeeder extends Seeder
{
    public function run(): void
    {
        // Get all users to create default customer for each
        $users = User::all();

        foreach ($users as $user) {
            Customer::firstOrCreate(
                [
                    'created_by' => $user->id,
                    'email' => 'walkin@default.com'
                ],
                [
                    'name' => 'Walk-in Customer',
                    'phone' => '0000000000',
                    'billing_address' => '-',
                    'billing_city' => '-',
                    'billing_state' => '-',
                    'billing_postal_code' => '00000',
                    'billing_country' => '-',
                    'same_as_billing' => true,
                    'status' => 'active',
                    'notes' => 'Default walk-in customer for POS transactions'
                ]
            );
        }
    }
}