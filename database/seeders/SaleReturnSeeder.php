<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SaleReturn;
use App\Models\SaleReturnItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Customer;
use App\Models\Branch;
use App\Models\Product;

class SaleReturnSeeder extends Seeder
{
    public function run()
    {
        if (!IsDemo()) {
            return;
        }
        
        $sales = Sale::with('items')->get();
        $customers = Customer::where('status', 'active')->get();
        $branches = Branch::where('status', 'active')->get();
        $statuses = ['pending', 'approved', 'rejected'];

        if ($sales->isEmpty() || $customers->isEmpty() || $branches->isEmpty()) {
            return;
        }

        foreach ($sales->take(15) as $index => $sale) {
            $status = $statuses[$index % 3];
            
            $saleReturn = SaleReturn::create([
                'return_number' => 'SR-' . str_pad(time() + $index, 8, '0', STR_PAD_LEFT),
                'sale_id' => $sale->id,
                'customer_id' => $sale->customer_id,
                'branch_id' => $sale->branch_id,
                'return_date' => now()->subDays(rand(1, 30)),
                'reason' => ['Defective product', 'Wrong item', 'Customer changed mind', 'Quality issue'][rand(0, 3)],
                'notes' => 'Return processed for customer satisfaction',
                'status' => $status,
                'subtotal' => 0,
                'tax_amount' => 0,
                'total_amount' => 0,
                'created_by' => $sale->created_by,
                'created_at' => now()->subDays(rand(1, 30)),
            ]);

            $subtotal = 0;
            $taxAmount = 0;

            // Add 1-3 items from the sale
            $saleItems = $sale->items->take(rand(1, min(3, $sale->items->count())));
            
            foreach ($saleItems as $saleItem) {
                $returnQty = rand(1, min(3, $saleItem->quantity));
                $lineSubtotal = $returnQty * $saleItem->unit_price;
                $lineTax = ($lineSubtotal * $saleItem->tax_rate) / 100;
                
                SaleReturnItem::create([
                    'sale_return_id' => $saleReturn->id,
                    'product_id' => $saleItem->product_id,
                    'sale_item_id' => $saleItem->id,
                    'product_name' => $saleItem->product_name,
                    'product_sku' => $saleItem->product_sku,
                    'quantity' => $returnQty,
                    'unit_price' => $saleItem->unit_price,
                    'tax_rate' => $saleItem->tax_rate,
                    'tax_amount' => $lineTax,
                    'line_total' => $lineSubtotal + $lineTax,
                ]);

                $subtotal += $lineSubtotal;
                $taxAmount += $lineTax;
            }

            $saleReturn->update([
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total_amount' => $subtotal + $taxAmount,
            ]);
        }
    }
}