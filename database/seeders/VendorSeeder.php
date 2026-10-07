<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vendor;
use App\Models\User;

class VendorSeeder extends Seeder
{
    public function run(): void
    {
        if (!IsDemo()) {
            $companies = User::where('type', 'company')->get();
            foreach ($companies as $company) {
                Vendor::firstOrCreate(
                    ['created_by' => $company->id, 'email' => 'vendor@example.com'],
                    ['name' => 'Sample Vendor', 'phone' => '+1234567890', 'status' => 'active']
                );
            }
        } else {
            $company = User::where('email', 'company@example.com')->first();

            if ($company) {
                Vendor::create([
                    'created_by' => $company->id,
                    'name' => 'ABC Supplies',
                    'company_name' => 'ABC Supplies Inc.',
                    'email' => 'contact@abcsupplies.com',
                    'phone' => '+1234567890',
                    'tax_number' => 'TAX123456789',
                    'billing_address' => '123 Business Street',
                    'billing_city' => 'New York',
                    'billing_state' => 'NY',
                    'billing_postal_code' => '10001',
                    'billing_country' => 'USA',
                    'same_as_billing' => true,
                    'status' => 'active'
                ]);

                Vendor::create([
                    'created_by' => $company->id,
                    'name' => 'XYZ Corporation',
                    'company_name' => 'XYZ Corp Ltd.',
                    'email' => 'sales@xyzcorp.com',
                    'phone' => '+1234567891',
                    'tax_number' => 'TAX987654321',
                    'billing_address' => '456 Corporate Ave',
                    'billing_city' => 'Los Angeles',
                    'billing_state' => 'CA',
                    'billing_postal_code' => '90210',
                    'billing_country' => 'USA',
                    'shipping_address' => '789 Warehouse Blvd',
                    'shipping_city' => 'San Francisco',
                    'shipping_state' => 'CA',
                    'shipping_postal_code' => '94102',
                    'shipping_country' => 'USA',
                    'same_as_billing' => false,
                    'status' => 'active',
                    'notes' => 'Preferred vendor for electronics'
                ]);

                Vendor::create([
                    'created_by' => $company->id,
                    'name' => 'Local Vendor',
                    'company_name' => 'Local Vendor LLC',
                    'email' => 'info@localvendor.com',
                    'phone' => '+1234567892',
                    'billing_address' => '321 Local Street',
                    'billing_city' => 'Chicago',
                    'billing_state' => 'IL',
                    'billing_postal_code' => '60601',
                    'billing_country' => 'USA',
                    'same_as_billing' => true,
                    'status' => 'inactive',
                    'notes' => 'Temporarily inactive'
                ]);

                Vendor::create([
                    'created_by' => $company->id,
                    'name' => 'Global Tech Traders',
                    'company_name' => 'Global Tech Traders Pvt. Ltd.',
                    'email' => 'info@globaltechtraders.com',
                    'phone' => '+1234567893',
                    'tax_number' => 'TAX112233445',
                    'billing_address' => '88 Tech Park Road',
                    'billing_city' => 'Austin',
                    'billing_state' => 'TX',
                    'billing_postal_code' => '73301',
                    'billing_country' => 'USA',
                    'same_as_billing' => true,
                    'status' => 'active',
                    'notes' => 'Specializes in tech accessories'
                ]);

                Vendor::create([
                    'created_by' => $company->id,
                    'name' => 'Prime Distributors',
                    'company_name' => 'Prime Distributors Co.',
                    'email' => 'orders@primedist.com',
                    'phone' => '+1234567894',
                    'tax_number' => 'TAX556677889',
                    'billing_address' => '200 Distribution Way',
                    'billing_city' => 'Houston',
                    'billing_state' => 'TX',
                    'billing_postal_code' => '77001',
                    'billing_country' => 'USA',
                    'shipping_address' => '201 Logistics Lane',
                    'shipping_city' => 'Dallas',
                    'shipping_state' => 'TX',
                    'shipping_postal_code' => '75201',
                    'shipping_country' => 'USA',
                    'same_as_billing' => false,
                    'status' => 'active',
                    'notes' => 'Bulk order discounts available'
                ]);

                Vendor::create([
                    'created_by' => $company->id,
                    'name' => 'Sunrise Wholesale',
                    'company_name' => 'Sunrise Wholesale Group',
                    'email' => 'contact@sunrisewholesale.com',
                    'phone' => '+1234567895',
                    'tax_number' => 'TAX334455667',
                    'billing_address' => '55 Market Square',
                    'billing_city' => 'Phoenix',
                    'billing_state' => 'AZ',
                    'billing_postal_code' => '85001',
                    'billing_country' => 'USA',
                    'same_as_billing' => true,
                    'status' => 'active'
                ]);

                Vendor::create([
                    'created_by' => $company->id,
                    'name' => 'Metro Supplies Co.',
                    'company_name' => 'Metro Supplies Co. Inc.',
                    'email' => 'support@metrosupplies.com',
                    'phone' => '+1234567896',
                    'billing_address' => '77 Metro Plaza',
                    'billing_city' => 'Philadelphia',
                    'billing_state' => 'PA',
                    'billing_postal_code' => '19101',
                    'billing_country' => 'USA',
                    'same_as_billing' => true,
                    'status' => 'inactive',
                    'notes' => 'On hold pending contract renewal'
                ]);

                Vendor::create([
                    'created_by' => $company->id,
                    'name' => 'Eagle Imports',
                    'company_name' => 'Eagle Imports LLC',
                    'email' => 'trade@eagleimports.com',
                    'phone' => '+1234567897',
                    'tax_number' => 'TAX778899001',
                    'billing_address' => '10 Harbor Drive',
                    'billing_city' => 'Miami',
                    'billing_state' => 'FL',
                    'billing_postal_code' => '33101',
                    'billing_country' => 'USA',
                    'shipping_address' => '12 Port Avenue',
                    'shipping_city' => 'Fort Lauderdale',
                    'shipping_state' => 'FL',
                    'shipping_postal_code' => '33301',
                    'shipping_country' => 'USA',
                    'same_as_billing' => false,
                    'status' => 'active',
                    'notes' => 'International import specialist'
                ]);

                Vendor::create([
                    'created_by' => $company->id,
                    'name' => 'Pinnacle Parts',
                    'company_name' => 'Pinnacle Parts & Equipment',
                    'email' => 'sales@pinnacleparts.com',
                    'phone' => '+1234567898',
                    'tax_number' => 'TAX223344556',
                    'billing_address' => '300 Industrial Blvd',
                    'billing_city' => 'Seattle',
                    'billing_state' => 'WA',
                    'billing_postal_code' => '98101',
                    'billing_country' => 'USA',
                    'same_as_billing' => true,
                    'status' => 'active',
                    'notes' => 'Reliable parts supplier since 2010'
                ]);

                Vendor::create([
                    'created_by' => $company->id,
                    'name' => 'Horizon Goods',
                    'company_name' => 'Horizon Goods Trading',
                    'email' => 'hello@horizongoods.com',
                    'phone' => '+1234567899',
                    'billing_address' => '45 Horizon Street',
                    'billing_city' => 'Denver',
                    'billing_state' => 'CO',
                    'billing_postal_code' => '80201',
                    'billing_country' => 'USA',
                    'same_as_billing' => true,
                    'status' => 'active'
                ]);
            }
        }
    }
}