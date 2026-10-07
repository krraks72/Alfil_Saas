<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;
use App\Models\User;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        if (!IsDemo()) {
            $companies = User::where('type', 'company')->get();
            foreach ($companies as $company) {
                Customer::firstOrCreate(
                    ['created_by' => $company->id, 'email' => 'customer@example.com'],
                    ['name' => 'Sample Customer', 'phone' => '+1234567890', 'status' => 'active']
                );
            }
        } else {
            $company = User::where('email', 'company@example.com')->first();

            if ($company) {
                Customer::create([
                    'created_by' => $company->id,
                    'name' => 'John Doe',
                    'email' => 'john.doe@example.com',
                    'phone' => '+1234567890',
                    'date_of_birth' => '1990-05-15',
                    'gender' => 'male',
                    'billing_address' => '123 Main Street',
                    'billing_city' => 'New York',
                    'billing_state' => 'NY',
                    'billing_postal_code' => '10001',
                    'billing_country' => 'USA',
                    'same_as_billing' => true,
                    'status' => 'active',
                    'notes' => 'VIP Customer'
                ]);

                Customer::create([
                    'created_by' => $company->id,
                    'name' => 'Jane Smith',
                    'email' => 'jane.smith@example.com',
                    'phone' => '+1234567891',
                    'date_of_birth' => '1985-08-22',
                    'gender' => 'female',
                    'billing_address' => '456 Oak Avenue',
                    'billing_city' => 'Los Angeles',
                    'billing_state' => 'CA',
                    'billing_postal_code' => '90210',
                    'billing_country' => 'USA',
                    'shipping_address' => '789 Pine Street',
                    'shipping_city' => 'San Francisco',
                    'shipping_state' => 'CA',
                    'shipping_postal_code' => '94102',
                    'shipping_country' => 'USA',
                    'same_as_billing' => false,
                    'status' => 'active'
                ]);

                Customer::create([
                    'created_by' => $company->id,
                    'name' => 'Bob Johnson',
                    'email' => 'bob.johnson@example.com',
                    'phone' => '+1234567892',
                    'date_of_birth' => '1992-12-03',
                    'gender' => 'male',
                    'billing_address' => '321 Elm Street',
                    'billing_city' => 'Chicago',
                    'billing_state' => 'IL',
                    'billing_postal_code' => '60601',
                    'billing_country' => 'USA',
                    'same_as_billing' => true,
                    'status' => 'active',
                    'notes' => 'Regular customer'
                ]);

                Customer::create([
                    'created_by' => $company->id,
                    'name' => 'Alice Brown',
                    'email' => 'alice.brown@example.com',
                    'phone' => '+1234567893',
                    'date_of_birth' => '1991-04-10',
                    'gender' => 'female',
                    'billing_address' => '789 Sunset Blvd',
                    'billing_city' => 'Dallas',
                    'billing_state' => 'TX',
                    'billing_postal_code' => '75201',
                    'billing_country' => 'USA',
                    'same_as_billing' => true,
                    'status' => 'active'
                ]);

                Customer::create([
                    'created_by' => $company->id,
                    'name' => 'Mike Wilson',
                    'email' => 'mike.wilson@example.com',
                    'phone' => '+1234567894',
                    'date_of_birth' => '1987-09-20',
                    'gender' => 'male',
                    'billing_address' => '101 Oakwood Drive',
                    'billing_city' => 'Seattle',
                    'billing_state' => 'WA',
                    'billing_postal_code' => '98101',
                    'billing_country' => 'USA',
                    'same_as_billing' => true,
                    'status' => 'active'
                ]);

                Customer::create([
                    'created_by' => $company->id,
                    'name' => 'Emily Davis',
                    'email' => 'emily.davis@example.com',
                    'phone' => '+1234567895',
                    'date_of_birth' => '1995-03-18',
                    'gender' => 'female',
                    'billing_address' => '55 Maple Drive',
                    'billing_city' => 'Houston',
                    'billing_state' => 'TX',
                    'billing_postal_code' => '77001',
                    'billing_country' => 'USA',
                    'same_as_billing' => true,
                    'status' => 'active',
                    'notes' => 'Loyal customer since 2020'
                ]);

                Customer::create([
                    'created_by' => $company->id,
                    'name' => 'Chris Martinez',
                    'email' => 'chris.martinez@example.com',
                    'phone' => '+1234567896',
                    'date_of_birth' => '1988-07-25',
                    'gender' => 'male',
                    'billing_address' => '88 Cedar Lane',
                    'billing_city' => 'Phoenix',
                    'billing_state' => 'AZ',
                    'billing_postal_code' => '85001',
                    'billing_country' => 'USA',
                    'shipping_address' => '90 Desert Road',
                    'shipping_city' => 'Scottsdale',
                    'shipping_state' => 'AZ',
                    'shipping_postal_code' => '85251',
                    'shipping_country' => 'USA',
                    'same_as_billing' => false,
                    'status' => 'active'
                ]);

                Customer::create([
                    'created_by' => $company->id,
                    'name' => 'Sarah Taylor',
                    'email' => 'sarah.taylor@example.com',
                    'phone' => '+1234567897',
                    'date_of_birth' => '1993-11-09',
                    'gender' => 'female',
                    'billing_address' => '200 Birch Boulevard',
                    'billing_city' => 'Philadelphia',
                    'billing_state' => 'PA',
                    'billing_postal_code' => '19101',
                    'billing_country' => 'USA',
                    'same_as_billing' => true,
                    'status' => 'inactive',
                    'notes' => 'Temporarily inactive'
                ]);

                Customer::create([
                    'created_by' => $company->id,
                    'name' => 'David Anderson',
                    'email' => 'david.anderson@example.com',
                    'phone' => '+1234567898',
                    'date_of_birth' => '1980-02-14',
                    'gender' => 'male',
                    'billing_address' => '310 Walnut Street',
                    'billing_city' => 'San Antonio',
                    'billing_state' => 'TX',
                    'billing_postal_code' => '78201',
                    'billing_country' => 'USA',
                    'same_as_billing' => true,
                    'status' => 'active',
                    'notes' => 'Wholesale buyer'
                ]);

                Customer::create([
                    'created_by' => $company->id,
                    'name' => 'Laura Thomas',
                    'email' => 'laura.thomas@example.com',
                    'phone' => '+1234567899',
                    'date_of_birth' => '1997-06-30',
                    'gender' => 'female',
                    'billing_address' => '415 Spruce Court',
                    'billing_city' => 'San Diego',
                    'billing_state' => 'CA',
                    'billing_postal_code' => '92101',
                    'billing_country' => 'USA',
                    'same_as_billing' => true,
                    'status' => 'active'
                ]);
            }
        }
    }
}