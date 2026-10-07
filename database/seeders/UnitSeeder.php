<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Unit;
use App\Models\User;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        if (!IsDemo()) {
            $companies = User::where('type', 'company')->get();
            foreach ($companies as $company) {
                Unit::firstOrCreate(
                    ['created_by' => $company->id, 'name' => 'Piece'],
                    ['short_name' => 'pcs', 'description' => 'Individual pieces', 'status' => 'active']
                );
            }
        } else {
            $company = User::where('email', 'company@example.com')->first();

            if ($company) {
                Unit::create([
                    'created_by' => $company->id,
                    'name' => 'Piece',
                    'short_name' => 'pcs',
                    'description' => 'Individual pieces or items',
                    'status' => 'active'
                ]);

                Unit::create([
                    'created_by' => $company->id,
                    'name' => 'Kilogram',
                    'short_name' => 'kg',
                    'description' => 'Weight measurement in kilograms',
                    'status' => 'active'
                ]);

                Unit::create([
                    'created_by' => $company->id,
                    'name' => 'Liter',
                    'short_name' => 'L',
                    'description' => 'Volume measurement in liters',
                    'status' => 'active'
                ]);

                Unit::create([
                    'created_by' => $company->id,
                    'name' => 'Meter',
                    'short_name' => 'm',
                    'description' => 'Length measurement in meters',
                    'status' => 'active'
                ]);

                Unit::create([
                    'created_by' => $company->id,
                    'name' => 'Box',
                    'short_name' => 'box',
                    'description' => 'Items packed in a box',
                    'status' => 'active'
                ]);

                Unit::create([
                    'created_by' => $company->id,
                    'name' => 'Dozen',
                    'short_name' => 'dz',
                    'description' => 'Group of twelve items',
                    'status' => 'active'
                ]);

                Unit::create([
                    'created_by' => $company->id,
                    'name' => 'Gram',
                    'short_name' => 'g',
                    'description' => 'Weight measurement in grams',
                    'status' => 'active'
                ]);

                Unit::create([
                    'created_by' => $company->id,
                    'name' => 'Milliliter',
                    'short_name' => 'ml',
                    'description' => 'Volume measurement in milliliters',
                    'status' => 'active'
                ]);

                Unit::create([
                    'created_by' => $company->id,
                    'name' => 'Centimeter',
                    'short_name' => 'cm',
                    'description' => 'Length measurement in centimeters',
                    'status' => 'active'
                ]);

                Unit::create([
                    'created_by' => $company->id,
                    'name' => 'Pair',
                    'short_name' => 'pr',
                    'description' => 'A set of two matching items',
                    'status' => 'inactive'
                ]);
            }
        }
    }
}