<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\User;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Unit;
use App\Models\Tax;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        if (!IsDemo()) {
            $companies = User::where('type', 'company')->get();
            foreach ($companies as $company) {
                $category = Category::where('created_by', $company->id)->first();
                $brand = Brand::where('created_by', $company->id)->first();
                $unit = Unit::where('created_by', $company->id)->first();
                $tax = Tax::where('created_by', $company->id)->first();

                if ($category && $brand && $unit) {
                    $product = Product::updateOrCreate(
                        ['created_by' => $company->id, 'name' => 'Sample Product'],
                        [
                            'sku' => 'SP-001',
                            'description' => 'Sample product for testing',
                            'category_id' => $category->id,
                            'brand_id' => $brand->id,
                            'unit_id' => $unit->id,
                            'purchase_price' => 50.00,
                            'selling_price' => 75.00,
                            'stock_quantity' => 100,
                            'min_stock_level' => 10,
                            'status' => 'active'
                        ]
                    );

                    if ($tax && !$product->taxes()->where('tax_id', $tax->id)->exists()) {
                        $product->taxes()->attach($tax->id);
                    }
                }
            }
        } else {
            $company = User::where('email', 'company@example.com')->first();
            $categories = Category::where('created_by', $company->id)->where('status', 'active')->get();
            $brands = Brand::where('created_by', $company->id)->where('status', 'active')->get();
            $unit = Unit::where('created_by', $company->id)->where('status', 'active')->first();
            $tax = Tax::where('created_by', $company->id)->where('status', 'active')->first();

            if ($company && $categories->count() > 0 && $unit) {
            $product1 = Product::create([
                'created_by' => $company->id,
                'name' => 'iPhone 15',
                'sku' => 'IP15-001',
                'description' => 'Latest iPhone model with advanced features',
                'category_id' => $categories->first()->id,
                'brand_id' => $brands->first()?->id,
                'unit_id' => $unit->id,
                'purchase_price' => 800.00,
                'selling_price' => 999.00,
                'stock_quantity' => 50,
                'min_stock_level' => 10,
                'status' => 'active'
            ]);

            if ($tax) {
                $product1->taxes()->attach($tax->id);
            }

            $product2 = Product::create([
                'created_by' => $company->id,
                'name' => 'Samsung Galaxy S24',
                'sku' => 'SGS24-001',
                'description' => 'Premium Android smartphone',
                'category_id' => $categories->first()->id,
                'brand_id' => $brands->skip(1)->first()?->id ?? $brands->first()?->id,
                'unit_id' => $unit->id,
                'purchase_price' => 700.00,
                'selling_price' => 899.00,
                'stock_quantity' => 5,
                'min_stock_level' => 10,
                'status' => 'active'
            ]);

            if ($tax) {
                $product2->taxes()->attach($tax->id);
            }

            $product3 = Product::create([
                'created_by' => $company->id,
                'name' => 'MacBook Pro 16"',
                'sku' => 'MBP16-001',
                'description' => 'High-performance laptop for professionals',
                'category_id' => $categories->skip(1)->first()?->id ?? $categories->first()->id,
                'brand_id' => $brands->first()?->id,
                'unit_id' => $unit->id,
                'purchase_price' => 2200.00,
                'selling_price' => 2499.00,
                'stock_quantity' => 15,
                'min_stock_level' => 5,
                'status' => 'active'
            ]);

            $product4 = Product::create([
                'created_by' => $company->id,
                'name' => 'Dell XPS 13',
                'sku' => 'DXPS13-001',
                'description' => 'Compact ultrabook with premium build',
                'category_id' => $categories->skip(1)->first()?->id ?? $categories->first()->id,
                'brand_id' => $brands->skip(1)->first()?->id ?? $brands->first()?->id,
                'unit_id' => $unit->id,
                'purchase_price' => 1100.00,
                'selling_price' => 1299.00,
                'stock_quantity' => 25,
                'min_stock_level' => 8,
                'status' => 'active'
            ]);

            $product5 = Product::create([
                'created_by' => $company->id,
                'name' => 'iPad Air',
                'sku' => 'IPAD-AIR-001',
                'description' => 'Versatile tablet for work and entertainment',
                'category_id' => $categories->skip(2)->first()?->id ?? $categories->first()->id,
                'brand_id' => $brands->first()?->id,
                'unit_id' => $unit->id,
                'purchase_price' => 450.00,
                'selling_price' => 599.00,
                'stock_quantity' => 30,
                'min_stock_level' => 12,
                'status' => 'active'
            ]);

            $product6 = Product::create([
                'created_by' => $company->id,
                'name' => 'AirPods Pro',
                'sku' => 'APP-001',
                'description' => 'Wireless earbuds with noise cancellation',
                'category_id' => $categories->skip(2)->first()?->id ?? $categories->first()->id,
                'brand_id' => $brands->first()?->id,
                'unit_id' => $unit->id,
                'purchase_price' => 180.00,
                'selling_price' => 249.00,
                'stock_quantity' => 100,
                'min_stock_level' => 20,
                'status' => 'active'
            ]);

            $product7 = Product::create([
                'created_by' => $company->id,
                'name' => 'Sony WH-1000XM5',
                'sku' => 'SONY-WH5-001',
                'description' => 'Premium noise-canceling headphones',
                'category_id' => $categories->skip(2)->first()?->id ?? $categories->first()->id,
                'brand_id' => $brands->skip(1)->first()?->id ?? $brands->first()?->id,
                'unit_id' => $unit->id,
                'purchase_price' => 280.00,
                'selling_price' => 399.00,
                'stock_quantity' => 40,
                'min_stock_level' => 15,
                'status' => 'active'
            ]);

            $product8 = Product::create([
                'created_by' => $company->id,
                'name' => 'Apple Watch Series 9',
                'sku' => 'AWS9-001',
                'description' => 'Advanced smartwatch with health monitoring',
                'category_id' => $categories->skip(3)->first()?->id ?? $categories->first()->id,
                'brand_id' => $brands->first()?->id,
                'unit_id' => $unit->id,
                'purchase_price' => 320.00,
                'selling_price' => 429.00,
                'stock_quantity' => 60,
                'min_stock_level' => 18,
                'status' => 'active'
            ]);

            $product9 = Product::create([
                'created_by' => $company->id,
                'name' => 'Nintendo Switch OLED',
                'sku' => 'NSW-OLED-001',
                'description' => 'Gaming console with OLED display',
                'category_id' => $categories->skip(3)->first()?->id ?? $categories->first()->id,
                'brand_id' => $brands->skip(1)->first()?->id ?? $brands->first()?->id,
                'unit_id' => $unit->id,
                'purchase_price' => 280.00,
                'selling_price' => 349.00,
                'stock_quantity' => 35,
                'min_stock_level' => 10,
                'status' => 'active'
            ]);

            $product10 = Product::create([
                'created_by' => $company->id,
                'name' => 'Samsung 4K Monitor',
                'sku' => 'SAM-4K-001',
                'description' => '27-inch 4K UHD monitor for productivity',
                'category_id' => $categories->skip(1)->first()?->id ?? $categories->first()->id,
                'brand_id' => $brands->skip(1)->first()?->id ?? $brands->first()?->id,
                'unit_id' => $unit->id,
                'purchase_price' => 220.00,
                'selling_price' => 299.00,
                'stock_quantity' => 20,
                'min_stock_level' => 6,
                'status' => 'active'
            ]);

                // Attach tax to all new products if available
                if ($tax) {
                    foreach ([$product3, $product4, $product5, $product6, $product7, $product8, $product9, $product10] as $product) {
                        $product->taxes()->attach($tax->id);
                    }
                }
            }
        }
    }
}