<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnItem;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Vendor;
use App\Models\Branch;
use App\Models\Product;

class PurchaseReturnSeeder extends Seeder
{
    public function run()
    {
        if (!IsDemo()) {
            return;
        }
        
        $purchases = Purchase::with('items')->get();
        $vendors = Vendor::where('status', 'active')->get();
        $branches = Branch::where('status', 'active')->get();
        $statuses = ['pending', 'approved', 'rejected'];

        if ($purchases->isEmpty() || $vendors->isEmpty() || $branches->isEmpty()) {
            return;
        }

        for ($i = 0; $i < 15; $i++) {
            $purchase = $purchases->random();
            $status = $statuses[$i % 3];
            
            $purchaseReturn = PurchaseReturn::create([
                'return_number' => 'PR-' . str_pad(time() + $i + 1000, 8, '0', STR_PAD_LEFT),
                'purchase_id' => $purchase->id,
                'vendor_id' => $purchase->vendor_id,
                'branch_id' => $branches->random()->id,
                'return_date' => now()->subDays(rand(1, 30)),
                'reason' => ['Damaged goods', 'Wrong specification', 'Quality issue', 'Overstock'][rand(0, 3)],
                'notes' => 'Return processed as per vendor agreement',
                'status' => $status,
                'total_amount' => 0,
                'tax_amount' => 0,
                'grand_total' => 0,
                'created_by' => $purchase->created_by,
                'created_at' => now()->subDays(rand(1, 30)),
            ]);

            $subtotal = 0;
            $taxAmount = 0;

            // Add 1-3 items from the purchase
            $purchaseItems = $purchase->items->take(rand(1, min(3, $purchase->items->count())));
            
            foreach ($purchaseItems as $purchaseItem) {
                $returnQty = rand(1, min(3, $purchaseItem->quantity));
                $lineSubtotal = $returnQty * $purchaseItem->unit_price;
                $lineTax = ($lineSubtotal * $purchaseItem->tax_rate) / 100;
                
                PurchaseReturnItem::create([
                    'purchase_return_id' => $purchaseReturn->id,
                    'product_id' => $purchaseItem->product_id,
                    'purchase_item_id' => $purchaseItem->id,
                    'quantity' => $returnQty,
                    'unit_price' => $purchaseItem->unit_price,
                    'total_price' => $lineSubtotal + $lineTax,
                    'tax_rate' => $purchaseItem->tax_rate ?? 0,
                    'tax_amount' => $lineTax,
                ]);

                $subtotal += $lineSubtotal;
                $taxAmount += $lineTax;
            }

            $purchaseReturn->update([
                'total_amount' => $subtotal,
                'tax_amount' => $taxAmount,
                'grand_total' => $subtotal + $taxAmount,
            ]);
        }
    }
}