<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Customer;
use App\Models\Vendor;
use App\Models\Product;
use App\Models\Category;
use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\Unit;
use App\Models\Brand;
use App\Models\Tax;
use App\Models\ExpenseCategory;
use App\Models\Expense;
use App\Models\Notification;
use Faker\Factory as Faker;

class FinalAllModulesSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        
        // Get all company users
        $companies = User::where('type', 'company')->get();
        
        foreach ($companies as $company) {
            echo "Creating ALL modules data for: {$company->name} (ID: {$company->id})\n";
            
            // 1. Categories (8-12 per company)
            $this->createCategories($faker, $company->id);
            
            // 2. Branches (2-3 per company) 
            $branches = $this->createBranches($faker, $company->id);
            
            // 3. Cash Registers (2-4 per company)
            $this->createCashRegisters($faker, $company->id, $branches);
            
            // 4. Brands (6-10 per company)
            $this->createBrands($faker, $company->id);
            
            // 5. Units (8-12 per company)
            $this->createUnits($faker, $company->id);
            
            // 6. Taxes (4-6 per company)
            $this->createTaxes($faker, $company->id);
            
            // 7. Expense Categories (6-8 per company)
            $expenseCategories = $this->createExpenseCategories($faker, $company->id);
            
            // 8. Expenses (12-15 per company)
            $this->createExpenses($faker, $company->id, $expenseCategories);
            
            // Get existing data
            $customers = Customer::where('created_by', $company->id)->get();
            $vendors = Vendor::where('created_by', $company->id)->get();
            
            // 9. Purchases (10-15 per company)
            $purchases = $this->createPurchases($faker, $company->id, $vendors, $branches);
            
            // 10. Purchase Returns (3-5 per company)
            $this->createPurchaseReturns($faker, $company->id, $purchases);
            
            // 11. Sales (12-18 per company)
            $sales = $this->createSales($faker, $company->id, $customers, $branches);
            
            // 12. Sale Returns (3-6 per company)
            $this->createSaleReturns($faker, $company->id, $sales);
            
            // 13. Notifications (8-12 per company)
            $this->createNotifications($faker, $company->id);
            
            echo "✅ Completed ALL modules for {$company->name}\n\n";
        }
    }
    
    private function createCategories($faker, $companyId)
    {
        $categoryNames = [
            'Electronics & Gadgets', 'Clothing & Fashion', 'Home & Kitchen', 'Sports & Fitness',
            'Books & Education', 'Health & Beauty', 'Automotive Parts', 'Food & Beverages',
            'Office Supplies', 'Furniture & Decor', 'Toys & Games', 'Pet Supplies',
            'Garden & Outdoor', 'Tools & Hardware', 'Jewelry & Accessories', 'Baby Products'
        ];
        
        $count = rand(8, 12);
        for ($i = 0; $i < $count; $i++) {
            try {
                $name = $categoryNames[$i % count($categoryNames)];
                Category::firstOrCreate(
                    ['name' => $name, 'created_by' => $companyId],
                    [
                        'description' => $faker->sentence(8),
                        'status' => 'active'
                    ]
                );
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function createBranches($faker, $companyId)
    {
        $branchNames = ['Main Branch', 'Downtown Store', 'Mall Location', 'Airport Branch', 'City Center'];
        $branches = [];
        $count = rand(2, 3);
        
        for ($i = 0; $i < $count; $i++) {
            try {
                $branch = Branch::create([
                    'name' => $branchNames[$i % count($branchNames)],
                    'address' => $faker->streetAddress . ', ' . $faker->city,
                    'phone' => $faker->phoneNumber,
                    'email' => $faker->email,
                    'status' => 'active',
                    'created_by' => $companyId
                ]);
                $branches[] = $branch;
            } catch (\Exception $e) {
                continue;
            }
        }
        return $branches;
    }
    
    private function createCashRegisters($faker, $companyId, $branches)
    {
        $count = rand(2, 4);
        for ($i = 0; $i < $count; $i++) {
            try {
                $branch = !empty($branches) ? $branches[array_rand($branches)] : null;
                CashRegister::create([
                    'name' => 'Cash Register ' . ($i + 1),
                    'branch_id' => $branch ? $branch->id : null,
                    'opening_balance' => $faker->randomFloat(2, 500, 2000),
                    'status' => 'active',
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function createBrands($faker, $companyId)
    {
        $brandNames = [
            'TechPro', 'QualityMax', 'PremiumLine', 'EcoFriendly', 'SmartChoice', 
            'ValuePlus', 'ProSeries', 'EliteGrade', 'MasterCraft', 'SuperiorBrand'
        ];
        $count = rand(6, 10);
        
        for ($i = 0; $i < $count; $i++) {
            try {
                Brand::create([
                    'name' => $brandNames[$i % count($brandNames)] . ' ' . $companyId,
                    'description' => $faker->sentence(6),
                    'status' => 'active',
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function createUnits($faker, $companyId)
    {
        $unitData = [
            ['name' => 'Pieces', 'short_name' => 'pcs'],
            ['name' => 'Kilograms', 'short_name' => 'kg'],
            ['name' => 'Liters', 'short_name' => 'ltr'],
            ['name' => 'Meters', 'short_name' => 'm'],
            ['name' => 'Boxes', 'short_name' => 'box'],
            ['name' => 'Sets', 'short_name' => 'set'],
            ['name' => 'Dozens', 'short_name' => 'doz'],
            ['name' => 'Pairs', 'short_name' => 'pair'],
            ['name' => 'Bottles', 'short_name' => 'btl'],
            ['name' => 'Packets', 'short_name' => 'pkt'],
            ['name' => 'Cartons', 'short_name' => 'ctn'],
            ['name' => 'Rolls', 'short_name' => 'roll']
        ];
        
        $count = rand(8, 12);
        for ($i = 0; $i < $count; $i++) {
            try {
                $unitInfo = $unitData[$i % count($unitData)];
                Unit::create([
                    'name' => $unitInfo['name'],
                    'short_name' => $unitInfo['short_name'],
                    'status' => 'active',
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function createTaxes($faker, $companyId)
    {
        $taxData = [
            ['name' => 'VAT', 'rate' => 18.0],
            ['name' => 'GST', 'rate' => 12.0],
            ['name' => 'Sales Tax', 'rate' => 8.5],
            ['name' => 'Service Tax', 'rate' => 15.0],
            ['name' => 'Luxury Tax', 'rate' => 25.0],
            ['name' => 'Import Tax', 'rate' => 10.0]
        ];
        
        $count = rand(4, 6);
        for ($i = 0; $i < $count; $i++) {
            try {
                $taxInfo = $taxData[$i % count($taxData)];
                Tax::create([
                    'name' => $taxInfo['name'],
                    'rate' => $taxInfo['rate'],
                    'status' => 'active',
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function createExpenseCategories($faker, $companyId)
    {
        $categoryNames = [
            'Office Rent', 'Utilities & Bills', 'Marketing & Advertising', 'Staff Salaries', 
            'Equipment Purchase', 'Travel & Transport', 'Maintenance & Repairs', 'Insurance'
        ];
        $categories = [];
        $count = rand(6, 8);
        
        for ($i = 0; $i < $count; $i++) {
            try {
                $category = ExpenseCategory::create([
                    'name' => $categoryNames[$i % count($categoryNames)],
                    'description' => $faker->sentence(6),
                    'status' => 'active',
                    'created_by' => $companyId
                ]);
                $categories[] = $category;
            } catch (\Exception $e) {
                continue;
            }
        }
        return $categories;
    }
    
    private function createExpenses($faker, $companyId, $expenseCategories)
    {
        if (empty($expenseCategories)) return;
        
        $count = rand(12, 15);
        for ($i = 0; $i < $count; $i++) {
            try {
                $category = $expenseCategories[array_rand($expenseCategories)];
                Expense::create([
                    'expense_category_id' => $category->id,
                    'amount' => $faker->randomFloat(2, 100, 5000),
                    'expense_date' => $faker->dateTimeBetween('-3 months', 'now')->format('Y-m-d'),
                    'description' => $faker->sentence(8),
                    'payment_method' => $faker->randomElement(['cash', 'card', 'bank_transfer', 'cheque']),
                    'status' => 'approved',
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function createPurchases($faker, $companyId, $vendors, $branches)
    {
        if ($vendors->count() == 0 || empty($branches)) return [];
        
        $purchases = [];
        $count = rand(10, 15);
        $branch = $branches[0];
        
        for ($i = 0; $i < $count; $i++) {
            try {
                $vendor = $vendors->random();
                $subtotal = $faker->randomFloat(2, 1000, 8000);
                $taxAmount = $subtotal * 0.12;
                $discountAmount = $faker->randomFloat(2, 0, 300);
                $totalAmount = $subtotal + $taxAmount - $discountAmount;
                
                $purchase = Purchase::create([
                    'purchase_number' => 'PUR-' . $companyId . '-' . date('Y') . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                    'vendor_id' => $vendor->id,
                    'purchase_date' => $faker->dateTimeBetween('-3 months', 'now'),
                    'subtotal' => $subtotal,
                    'tax_amount' => $taxAmount,
                    'discount_amount' => $discountAmount,
                    'total_amount' => $totalAmount,
                    'paid_amount' => $faker->randomFloat(2, $totalAmount * 0.3, $totalAmount),
                    'payment_status' => $faker->randomElement(['paid', 'partial', 'unpaid']),
                    'status' => $faker->randomElement(['received', 'pending', 'cancelled']),
                    'notes' => $faker->sentence(6),
                    'created_by' => $companyId
                ]);
                $purchases[] = $purchase;
            } catch (\Exception $e) {
                continue;
            }
        }
        return $purchases;
    }
    
    private function createPurchaseReturns($faker, $companyId, $purchases)
    {
        if (empty($purchases)) return;
        
        $count = rand(3, 5);
        for ($i = 0; $i < $count; $i++) {
            try {
                $purchase = $purchases[array_rand($purchases)];
                PurchaseReturn::create([
                    'return_number' => 'PR-' . $companyId . '-' . date('Y') . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                    'purchase_id' => $purchase->id,
                    'return_date' => $faker->dateTimeBetween('-2 months', 'now'),
                    'total_amount' => $faker->randomFloat(2, 200, 1500),
                    'reason' => $faker->randomElement(['Damaged goods', 'Wrong item delivered', 'Quality issues', 'Excess stock']),
                    'status' => $faker->randomElement(['pending', 'approved', 'rejected']),
                    'notes' => $faker->sentence(6),
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function createSales($faker, $companyId, $customers, $branches)
    {
        if ($customers->count() == 0 || empty($branches)) return [];
        
        $sales = [];
        $count = rand(12, 18);
        $branch = $branches[0];
        
        for ($i = 0; $i < $count; $i++) {
            try {
                $customer = $customers->random();
                $subtotal = $faker->randomFloat(2, 200, 3000);
                $taxAmount = $subtotal * 0.12;
                $discountAmount = $faker->randomFloat(2, 0, 150);
                $totalAmount = $subtotal + $taxAmount - $discountAmount;
                $paidAmount = $faker->randomFloat(2, $totalAmount * 0.8, $totalAmount * 1.1);
                
                $sale = Sale::create([
                    'sale_number' => 'SAL-' . $companyId . '-' . date('Y') . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                    'customer_id' => $customer->id,
                    'branch_id' => $branch->id,
                    'sale_date' => $faker->dateTimeBetween('-3 months', 'now'),
                    'subtotal' => $subtotal,
                    'tax_amount' => $taxAmount,
                    'discount_amount' => $discountAmount,
                    'total_amount' => $totalAmount,
                    'paid_amount' => $paidAmount,
                    'change_amount' => max(0, $paidAmount - $totalAmount),
                    'payment_method' => $faker->randomElement(['cash', 'card', 'bank_transfer', 'upi']),
                    'status' => $faker->randomElement(['completed', 'pending']),
                    'notes' => $faker->sentence(6),
                    'created_by' => $companyId
                ]);
                $sales[] = $sale;
            } catch (\Exception $e) {
                continue;
            }
        }
        return $sales;
    }
    
    private function createSaleReturns($faker, $companyId, $sales)
    {
        if (empty($sales)) return;
        
        $count = rand(3, 6);
        for ($i = 0; $i < $count; $i++) {
            try {
                $sale = $sales[array_rand($sales)];
                $subtotal = $faker->randomFloat(2, 100, 800);
                $taxAmount = $subtotal * 0.12;
                $totalAmount = $subtotal + $taxAmount;
                
                SaleReturn::create([
                    'return_number' => 'SR-' . $companyId . '-' . date('Y') . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                    'sale_id' => $sale->id,
                    'customer_id' => $sale->customer_id,
                    'branch_id' => $sale->branch_id,
                    'return_date' => $faker->dateTimeBetween('-2 months', 'now'),
                    'subtotal' => $subtotal,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount,
                    'reason' => $faker->randomElement(['Defective product', 'Customer changed mind', 'Wrong size/color', 'Not satisfied with quality']),
                    'status' => $faker->randomElement(['pending', 'approved', 'rejected']),
                    'notes' => $faker->sentence(6),
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function createNotifications($faker, $companyId)
    {
        $types = ['info', 'success', 'warning', 'error'];
        $titles = [
            'New Order Received', 'Payment Processed Successfully', 'Low Stock Alert', 'System Update Available',
            'Customer Feedback Received', 'Monthly Sales Report', 'Backup Completed', 'Security Alert',
            'New Product Added', 'Vendor Payment Due', 'Tax Calculation Updated', 'Return Request Approved'
        ];
        
        $count = rand(8, 12);
        for ($i = 0; $i < $count; $i++) {
            try {
                Notification::create([
                    'title' => $titles[$i % count($titles)],
                    'message' => $faker->sentence(15),
                    'type' => $types[array_rand($types)],
                    'is_read' => $faker->boolean(40),
                    'created_by' => $companyId,
                    'created_at' => $faker->dateTimeBetween('-1 month', 'now')
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
}