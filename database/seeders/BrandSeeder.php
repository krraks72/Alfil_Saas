<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Brand;
use App\Models\User;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        if (!IsDemo()) {
            $companies = User::where('type', 'company')->get();
            foreach ($companies as $company) {
                Brand::firstOrCreate(
                    ['created_by' => $company->id, 'name' => 'Generic'],
                    ['slug' => 'generic', 'description' => 'Generic brand', 'status' => 'active']
                );
            }
        } else {
            $company = User::where('email', 'company@example.com')->first();

            if ($company) {
                Brand::create([
                    'created_by' => $company->id,
                    'name' => 'Apple',
                    'slug' => 'apple',
                    'description' => 'Technology company known for innovative products',
                    'website' => 'https://apple.com',
                    'status' => 'active'
                ]);

                Brand::create([
                    'created_by' => $company->id,
                    'name' => 'Samsung',
                    'slug' => 'samsung',
                    'description' => 'Electronics and technology manufacturer',
                    'website' => 'https://samsung.com',
                    'status' => 'active'
                ]);

                Brand::create([
                    'created_by' => $company->id,
                    'name' => 'Nike',
                    'slug' => 'nike',
                    'description' => 'Sports apparel and equipment brand',
                    'website' => 'https://nike.com',
                    'status' => 'active'
                ]);

                Brand::create([
                    'created_by' => $company->id,
                    'name' => 'Sony',
                    'slug' => 'sony',
                    'description' => 'Electronics and entertainment products',
                    'website' => 'https://sony.com',
                    'status' => 'active'
                ]);

                Brand::create([
                    'created_by' => $company->id,
                    'name' => 'Adidas',
                    'slug' => 'adidas',
                    'description' => 'Sports clothing and accessories brand',
                    'website' => 'https://adidas.com',
                    'status' => 'active'
                ]);

                Brand::create([
                    'created_by' => $company->id,
                    'name' => 'LG',
                    'slug' => 'lg',
                    'description' => 'Home appliances and electronics manufacturer',
                    'website' => 'https://lg.com',
                    'status' => 'active'
                ]);

                Brand::create([
                    'created_by' => $company->id,
                    'name' => 'Dell',
                    'slug' => 'dell',
                    'description' => 'Computers and IT solutions provider',
                    'website' => 'https://dell.com',
                    'status' => 'active'
                ]);

                Brand::create([
                    'created_by' => $company->id,
                    'name' => 'HP',
                    'slug' => 'hp',
                    'description' => 'Printers, laptops and IT hardware',
                    'website' => 'https://hp.com',
                    'status' => 'active'
                ]);

                Brand::create([
                    'created_by' => $company->id,
                    'name' => 'Philips',
                    'slug' => 'philips',
                    'description' => 'Health technology and consumer electronics',
                    'website' => 'https://philips.com',
                    'status' => 'active'
                ]);

                Brand::create([
                    'created_by' => $company->id,
                    'name' => 'Puma',
                    'slug' => 'puma',
                    'description' => 'Athletic and casual footwear and apparel',
                    'website' => 'https://puma.com',
                    'status' => 'inactive'
                ]);
            }
        }
    }
}