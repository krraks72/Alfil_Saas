<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Models\Customer;
use App\Models\CashRegister;
use App\Models\Product;
use Carbon\Carbon;

class SaleSeeder extends Seeder
{
    public function run(): void
    {
        if (!IsDemo()) {
            $companies = User::where('type', 'company')->get();
            foreach ($companies as $company) {
                $customer = Customer::where('created_by', $company->id)->first();
                $cashRegister = CashRegister::where('created_by', $company->id)->first();
                $product = Product::where('created_by', $company->id)->first();

                if ($customer && $cashRegister && $product) {
                    $sale = Sale::firstOrCreate(
                        ['created_by' => $company->id, 'customer_id' => $customer->id],
                        [
                            'branch_id' => $cashRegister->branch_id,
                            'cash_register_id' => $cashRegister->id,
                            'subtotal' => 75.00,
                            'tax_amount' => 7.50,
                            'discount_amount' => 0,
                            'total_amount' => 82.50,
                            'paid_amount' => 82.50,
                            'change_amount' => 0,
                            'payment_method' => 'cash',
                            'status' => 'completed',
                            'sale_date' => now(),
                            'notes' => 'Sample sale'
                        ]
                    );

                    SaleItem::firstOrCreate(
                        ['sale_id' => $sale->id, 'product_id' => $product->id],
                        [
                            'product_name' => $product->name,
                            'product_sku' => $product->sku ?? 'SP-001',
                            'quantity' => 1,
                            'unit_price' => 75.00,
                            'tax_rate' => 10.00,
                            'tax_amount' => 7.50,
                            'discount_amount' => 0,
                            'line_total' => 82.50
                        ]
                    );
                }
            }
        } else {
            $company = User::where('email', 'company@example.com')->first();
            if (!$company) return;

            $customers = Customer::where('created_by', $company->id)->get();
            $cashRegisters = CashRegister::where('created_by', $company->id)->get();
            $products = Product::where('created_by', $company->id)->get();

            if ($customers->isEmpty() || $cashRegisters->isEmpty() || $products->isEmpty()) return;

            $paymentMethods = ['cash', 'card', 'digital_wallet'];
            $startDate = Carbon::now()->subDays(60);

            // Create 50 sales over the last 60 days
            for ($i = 0; $i < 50; $i++) {
            $saleDate = $startDate->copy()->addDays(rand(0, 60))->addHours(rand(8, 20))->addMinutes(rand(0, 59));
            $customer = $customers->random();
            $cashRegister = $cashRegisters->random();
            
            $subtotal = 0;
            $taxAmount = 0;
            $discountAmount = rand(0, 1) ? rand(5, 20) : 0;
            
            $sale = Sale::create([
                'created_by' => $company->id,
                'branch_id' => $cashRegister->branch_id,
                'cash_register_id' => $cashRegister->id,
                'customer_id' => $customer->id,
                'subtotal' => 0, // Will update after items
                'tax_amount' => 0, // Will update after items
                'discount_amount' => $discountAmount,
                'total_amount' => 0, // Will update after items
                'paid_amount' => 0, // Will update after items
                'change_amount' => 0,
                'payment_method' => $paymentMethods[array_rand($paymentMethods)],
                'status' => 'completed',
                'sale_date' => $saleDate,
                'notes' => 'Seeded sale transaction'
            ]);

            // Add 1-4 items per sale
            $itemCount = rand(1, 4);
            for ($j = 0; $j < $itemCount; $j++) {
                $product = $products->random();
                $quantity = rand(1, 3);
                $unitPrice = $product->selling_price ?? rand(10, 100);
                $lineSubtotal = $quantity * $unitPrice;
                $lineTax = $lineSubtotal * 0.1; // 10% tax
                $lineTotal = $lineSubtotal + $lineTax;
                
                $subtotal += $lineSubtotal;
                $taxAmount += $lineTax;

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku ?? 'SKU-' . $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'tax_rate' => 10.00,
                    'tax_amount' => $lineTax,
                    'discount_amount' => 0,
                    'line_total' => $lineTotal
                ]);
            }

            // Update sale totals
            $totalAmount = $subtotal + $taxAmount - $discountAmount;
            $paidAmount = $totalAmount + rand(0, 10); // Sometimes overpaid
            $changeAmount = max(0, $paidAmount - $totalAmount);

                $sale->update([
                    'subtotal' => $subtotal,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount,
                    'paid_amount' => $paidAmount,
                    'change_amount' => $changeAmount
                ]);
            }
        }
    }
}