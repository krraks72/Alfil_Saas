<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\Customer;
use App\Models\Branch;
use App\Models\Product;

class QuotationSeeder extends Seeder
{
    public function run()
    {
        if (!IsDemo()) {
            $companies = \App\Models\User::where('type', 'company')->get();
            foreach ($companies as $company) {
                $customer = Customer::where('created_by', $company->id)->first();
                $branch = Branch::where('created_by', $company->id)->first();
                $product = Product::where('created_by', $company->id)->first();

                if ($customer && $branch && $product) {
                    $quotation = Quotation::firstOrCreate(
                        ['customer_id' => $customer->id, 'created_by' => $company->id],
                        [
                            'quotation_number' => 'QT-' . str_pad(time(), 8, '0', STR_PAD_LEFT),
                            'branch_id' => $branch->id,
                            'quotation_date' => now(),
                            'valid_until' => now()->addDays(30),
                            'status' => 'draft',
                            'notes' => 'Sample quotation',
                            'subtotal' => 75.00,
                            'discount_amount' => 0,
                            'tax_amount' => 7.50,
                            'total_amount' => 82.50
                        ]
                    );

                    QuotationItem::firstOrCreate(
                        ['quotation_id' => $quotation->id, 'product_id' => $product->id],
                        [
                            'product_name' => $product->name,
                            'product_sku' => $product->sku ?? 'SP-001',
                            'quantity' => 1,
                            'unit_price' => 75.00,
                            'discount_amount' => 0,
                            'tax_rate' => 10.00,
                            'tax_amount' => 7.50,
                            'line_total' => 82.50
                        ]
                    );
                }
            }
        } else {
            $company = \App\Models\User::where('email', 'company@example.com')->first();

            if (!$company) {
                return;
            }

            $customers = Customer::where('created_by', $company->id)->where('status', 'active')->get();
            $branches = Branch::where('created_by', $company->id)->where('status', 'active')->get();
            $products = Product::where('created_by', $company->id)->where('status', 'active')->get();
            $statuses = ['draft', 'sent', 'approved', 'rejected', 'converted'];

            if ($customers->isEmpty() || $branches->isEmpty() || $products->isEmpty()) {
                return;
            }

            for ($i = 0; $i < 20; $i++) {
            $status = $statuses[$i % 5];
            $quotationDate = now()->subDays(rand(1, 60));
            
            $quotation = Quotation::create([
                'quotation_number' => 'QT-' . str_pad(time() + $i, 8, '0', STR_PAD_LEFT),
                'customer_id' => $customers->random()->id,
                'branch_id' => $branches->random()->id,
                'quotation_date' => $quotationDate,
                'valid_until' => $quotationDate->copy()->addDays(30),
                'status' => $status,
                'notes' => 'Sample quotation for testing purposes',
                'terms_conditions' => 'Standard terms and conditions apply',
                'subtotal' => 0,
                'discount_amount' => 0,
                'tax_amount' => 0,
                'total_amount' => 0,
                'created_by' => $company->id,
                'created_at' => $quotationDate,
            ]);

            $subtotal = 0;
            $totalDiscount = 0;
            $totalTax = 0;

            // Add 2-5 items to each quotation
            $itemCount = rand(2, 5);
            $selectedProducts = $products->random($itemCount);
            
            foreach ($selectedProducts as $product) {
                $quantity = rand(1, 10);
                $unitPrice = $product->selling_price ?? rand(100, 1000);
                $discountAmount = rand(0, $unitPrice * 0.1); // Up to 10% discount
                $discountedPrice = $unitPrice - $discountAmount;
                $lineSubtotal = $quantity * $discountedPrice;
                $taxRate = rand(0, 18); // 0-18% tax
                $lineTax = ($lineSubtotal * $taxRate) / 100;
                $lineTotal = $lineSubtotal + $lineTax;
                
                QuotationItem::create([
                    'quotation_id' => $quotation->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku ?? 'SKU-' . $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'discount_amount' => $discountAmount * $quantity,
                    'tax_rate' => $taxRate,
                    'tax_amount' => $lineTax,
                    'line_total' => $lineTotal,
                ]);

                $subtotal += $lineSubtotal;
                $totalDiscount += ($discountAmount * $quantity);
                $totalTax += $lineTax;
            }

                $quotation->update([
                    'subtotal' => $subtotal,
                    'discount_amount' => $totalDiscount,
                    'tax_amount' => $totalTax,
                    'total_amount' => $subtotal + $totalTax,
                ]);
            }
        }
    }
}