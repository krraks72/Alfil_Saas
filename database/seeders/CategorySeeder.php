<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\User;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        if (!IsDemo()) {
            $companies = User::where('type', 'company')->get();
            foreach ($companies as $company) {
                Category::firstOrCreate(
                    ['created_by' => $company->id, 'name' => 'General'],
                    ['slug' => 'general', 'description' => 'General category', 'status' => 'active']
                );
            }
        } else {
            $company = User::where('email', 'company@example.com')->first();

            if ($company) {
                Category::create([
                    'created_by' => $company->id,
                    'name' => 'Electronics',
                    'slug' => 'electronics',
                    'description' => 'Electronic devices and gadgets',
                    'status' => 'active'
                ]);

                Category::create([
                    'created_by' => $company->id,
                    'name' => 'Clothing',
                    'slug' => 'clothing',
                    'description' => 'Apparel and fashion items',
                    'status' => 'active'
                ]);

                Category::create([
                    'created_by' => $company->id,
                    'name' => 'Books',
                    'slug' => 'books',
                    'description' => 'Books and educational materials',
                    'status' => 'active'
                ]);

                Category::create([
                    'created_by' => $company->id,
                    'name' => 'Food & Beverages',
                    'slug' => 'food-beverages',
                    'description' => 'Food, drinks and grocery items',
                    'status' => 'active'
                ]);

                Category::create([
                    'created_by' => $company->id,
                    'name' => 'Home & Furniture',
                    'slug' => 'home-furniture',
                    'description' => 'Home decor and furniture items',
                    'status' => 'active'
                ]);

                Category::create([
                    'created_by' => $company->id,
                    'name' => 'Sports & Fitness',
                    'slug' => 'sports-fitness',
                    'description' => 'Sports equipment and fitness accessories',
                    'status' => 'active'
                ]);

                Category::create([
                    'created_by' => $company->id,
                    'name' => 'Health & Beauty',
                    'slug' => 'health-beauty',
                    'description' => 'Health, wellness and beauty products',
                    'status' => 'active'
                ]);

                Category::create([
                    'created_by' => $company->id,
                    'name' => 'Toys & Games',
                    'slug' => 'toys-games',
                    'description' => 'Toys, games and entertainment items',
                    'status' => 'active'
                ]);

                Category::create([
                    'created_by' => $company->id,
                    'name' => 'Automotive',
                    'slug' => 'automotive',
                    'description' => 'Automotive parts and accessories',
                    'status' => 'active'
                ]);

                Category::create([
                    'created_by' => $company->id,
                    'name' => 'Office Supplies',
                    'slug' => 'office-supplies',
                    'description' => 'Office stationery and supplies',
                    'status' => 'inactive'
                ]);
            }
        }
    }
}