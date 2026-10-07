<?php

namespace Database\Seeders;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Vendor;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class PurchaseSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('type', 'company')->get();
        
        foreach ($users as $user) {
            $vendors = Vendor::where('created_by', $user->id)->where('status', 'active')->get();
            $products = Product::where('created_by', $user->id)->where('status', 'active')->get();
            
            if ($vendors->count() > 0 && $products->count() > 0) {
                $iterations = IsDemo() ? 10 : 1;
                for ($i = 1; $i <= $iterations; $i++) {
                    $vendor = IsDemo() ? $vendors->random() : $vendors->first();
                    $selectedProducts = IsDemo() ? $products->random(rand(2, 4)) : $products->take(1);
                    
                    $totalAmount = 0;
                    $items = [];
                    
                    foreach ($selectedProducts as $product) {
                        $quantity = IsDemo() ? rand(5, 20) : 10;
                        $unitPrice = $product->purchase_price;
                        $totalPrice = $quantity * $unitPrice;
                        $totalAmount += $totalPrice;
                        
                        $items[] = [
                            'product_id' => $product->id,
                            'quantity' => $quantity,
                            'unit_price' => $unitPrice,
                            'total_price' => $totalPrice,
                        ];
                    }
                    
                    $purchase = Purchase::create([
                        'created_by' => $user->id,
                        'vendor_id' => $vendor->id,
                        'purchase_date' => now()->subDays(IsDemo() ? rand(0, 30) : 0),
                        'total_amount' => $totalAmount,
                        'status' => IsDemo() ? ['active', 'inactive'][rand(0, 1)] : 'active',
                        'notes' => 'Sample purchase order #' . $i,
                    ]);
                    
                    foreach ($items as $item) {
                        PurchaseItem::create(array_merge($item, [
                            'purchase_id' => $purchase->id,
                        ]));
                    }
                }
            }
        }
    }
}