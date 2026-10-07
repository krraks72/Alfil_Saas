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
use App\Models\NotificationTemplate;
use App\Models\Quotation;
use App\Models\Role;
use Faker\Factory as Faker;

class UltimateComprehensiveSeeder extends Seeder
{
    private $faker;
    
    public function run(): void
    {
        $this->faker = Faker::create();
        $companies = User::where('type', 'company')->get();
        
        foreach ($companies as $company) {

            auth()->login($company);
            
            $this->createRoles($company->id, 5);
            $this->createUsers($company->id, 8);
            
            $this->createCategories($company->id, 12);
            $branches = $this->createBranches($company->id, 4);
            $this->createCashRegisters($company->id, $branches, 5);
            $this->createBrands($company->id, 10);
            $this->createUnits($company->id, 12);
            $this->createTaxes($company->id, 6);
            
            $customers = $this->ensureCustomers($company->id, 15);
            $vendors = $this->ensureVendors($company->id, 12);
            $products = $this->ensureProducts($company->id, 20);
            
            $expenseCategories = $this->createExpenseCategories($company->id, 8);
            $this->createExpenses($company->id, $expenseCategories, $branches, 15);
            
            $this->createNotificationTemplates($company->id, 8);
            $this->createNotifications($company->id, 10);
            
            $purchases = $this->createPurchasesCorrect($company->id, $vendors, $branches, 12);
            $this->createPurchaseReturnsCorrect($company->id, $purchases, 4);
            
            $sales = $this->createSalesCorrect($company->id, $customers, $branches, 15);
            $this->createSaleReturnsCorrect($company->id, $sales, 5);
            
            $this->createQuotations($company->id, $customers, $branches, 10);

        }
        
        auth()->logout();
    }
    
    private function createCategories($companyId, $min)
    {
        $current = Category::where('created_by', $companyId)->count();
        if ($current >= $min) return;
        
        $categories = [
            ['name' => 'Electronics & Gadgets', 'desc' => 'Smartphones, laptops, tablets, and electronic accessories'],
            ['name' => 'Fashion & Apparel', 'desc' => 'Clothing, shoes, accessories, and fashion items'],
            ['name' => 'Home & Kitchen', 'desc' => 'Home appliances, kitchenware, and household items'],
            ['name' => 'Sports & Fitness', 'desc' => 'Sports equipment, fitness gear, and outdoor activities'],
            ['name' => 'Books & Stationery', 'desc' => 'Books, notebooks, pens, and office supplies'],
            ['name' => 'Health & Beauty', 'desc' => 'Personal care, cosmetics, and health products'],
            ['name' => 'Automotive Parts', 'desc' => 'Car accessories, spare parts, and automotive tools'],
            ['name' => 'Food & Beverages', 'desc' => 'Packaged foods, drinks, and grocery items'],
            ['name' => 'Office Supplies', 'desc' => 'Business equipment, furniture, and office materials'],
            ['name' => 'Furniture & Decor', 'desc' => 'Home furniture, decorative items, and interior accessories'],
            ['name' => 'Toys & Games', 'desc' => 'Children toys, board games, and entertainment items'],
            ['name' => 'Garden & Tools', 'desc' => 'Gardening supplies, hand tools, and hardware items']
        ];
        
        for ($i = $current; $i < $min; $i++) {
            try {
                $category = $categories[$i % count($categories)];
                Category::create([
                    'name' => $category['name'],
                    'description' => $category['desc'],
                    'status' => 'active',
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function createBranches($companyId, $min)
    {
        $current = Branch::where('created_by', $companyId)->count();
        $branches = Branch::where('created_by', $companyId)->get();
        
        if ($current >= $min) return $branches;
        
        $names = ['Main Branch', 'Downtown', 'Mall Location', 'Airport', 'City Center'];
        
        for ($i = $current; $i < $min; $i++) {
            try {
                $branch = Branch::create([
                    'name' => $names[$i % count($names)],
                    'address' => $this->faker->streetAddress,
                    'phone' => $this->faker->phoneNumber,
                    'email' => $this->faker->email,
                    'status' => 'active',
                    'created_by' => $companyId
                ]);
                $branches[] = $branch;
            } catch (\Exception $e) {
                continue;
            }
        }
        
        return Branch::where('created_by', $companyId)->get();
    }
    
    private function createCashRegisters($companyId, $branches, $min)
    {
        $current = CashRegister::where('created_by', $companyId)->count();
        if ($current >= $min || $branches->count() == 0) return;
        
        for ($i = $current; $i < $min; $i++) {
            try {
                CashRegister::create([
                    'name' => 'Register ' . ($i + 1),
                    'branch_id' => $branches->random()->id,
                    'opening_balance' => $this->faker->randomFloat(2, 500, 2000),
                    'status' => 'active',
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function createBrands($companyId, $min)
    {
        $current = Brand::where('created_by', $companyId)->count();
        if ($current >= $min) return;
        
        $brands = [
            ['name' => 'TechPro Solutions', 'desc' => 'Professional technology and electronics brand'],
            ['name' => 'QualityMax', 'desc' => 'Premium quality products for everyday use'],
            ['name' => 'EcoFriendly Living', 'desc' => 'Sustainable and environmentally conscious products'],
            ['name' => 'SmartChoice', 'desc' => 'Intelligent solutions for modern lifestyle'],
            ['name' => 'ValuePlus', 'desc' => 'Affordable quality products with great value'],
            ['name' => 'ProSeries', 'desc' => 'Professional grade equipment and tools'],
            ['name' => 'EliteGrade', 'desc' => 'Luxury and premium product line'],
            ['name' => 'HomeComfort', 'desc' => 'Comfortable and practical home solutions'],
            ['name' => 'ActiveLife', 'desc' => 'Sports and fitness equipment brand'],
            ['name' => 'StyleCraft', 'desc' => 'Fashion and lifestyle brand']
        ];
        
        for ($i = $current; $i < $min; $i++) {
            try {
                $brand = $brands[$i % count($brands)];
                Brand::create([
                    'name' => $brand['name'],
                    'description' => $brand['desc'],
                    'status' => 'active',
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function createUnits($companyId, $min)
    {
        $current = Unit::where('created_by', $companyId)->count();
        if ($current >= $min) return;
        
        $units = [
            ['name' => 'Pieces', 'short_name' => 'pcs'],
            ['name' => 'Kilograms', 'short_name' => 'kg'],
            ['name' => 'Liters', 'short_name' => 'ltr'],
            ['name' => 'Meters', 'short_name' => 'm'],
            ['name' => 'Boxes', 'short_name' => 'box'],
            ['name' => 'Sets', 'short_name' => 'set'],
            ['name' => 'Dozens', 'short_name' => 'doz'],
            ['name' => 'Pairs', 'short_name' => 'pair'],
            ['name' => 'Bottles', 'short_name' => 'btl'],
            ['name' => 'Packets', 'short_name' => 'pkt']
        ];
        
        for ($i = $current; $i < $min; $i++) {
            try {
                $unit = $units[$i % count($units)];
                Unit::create([
                    'name' => $unit['name'],
                    'short_name' => $unit['short_name'],
                    'status' => 'active',
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function createTaxes($companyId, $min)
    {
        $current = Tax::where('created_by', $companyId)->count();
        if ($current >= $min) return;
        
        $taxes = [
            ['name' => 'VAT', 'rate' => 18.0],
            ['name' => 'GST', 'rate' => 12.0],
            ['name' => 'Sales Tax', 'rate' => 8.5],
            ['name' => 'Service Tax', 'rate' => 15.0],
            ['name' => 'Luxury Tax', 'rate' => 25.0]
        ];
        
        for ($i = $current; $i < $min; $i++) {
            try {
                $tax = $taxes[$i % count($taxes)];
                Tax::create([
                    'name' => $tax['name'],
                    'rate' => $tax['rate'],
                    'status' => 'active',
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function ensureCustomers($companyId, $min)
    {
        $customers = Customer::where('created_by', $companyId)->get();
        if ($customers->count() >= $min) return $customers;
        
        $current = $customers->count();
        for ($i = $current; $i < $min; $i++) {
            try {
                Customer::create([
                    'name' => $this->faker->name,
                    'email' => $this->faker->unique()->email,
                    'phone' => $this->faker->phoneNumber,
                    'billing_address' => $this->faker->streetAddress,
                    'billing_city' => $this->faker->city,
                    'billing_state' => $this->faker->state,
                    'billing_postal_code' => $this->faker->postcode,
                    'billing_country' => $this->faker->country,
                    'status' => 'active',
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
        
        return Customer::where('created_by', $companyId)->get();
    }
    
    private function ensureVendors($companyId, $min)
    {
        $vendors = Vendor::where('created_by', $companyId)->get();
        if ($vendors->count() >= $min) return $vendors;
        
        $current = $vendors->count();
        $names = ['Tech Solutions', 'Global Supplies', 'Premium Materials', 'Quality Parts', 'Industrial Equipment'];
        
        for ($i = $current; $i < $min; $i++) {
            try {
                Vendor::create([
                    'name' => $names[$i % count($names)] . ' ' . $companyId,
                    'company_name' => $names[$i % count($names)] . ' Corp',
                    'email' => $this->faker->unique()->email,
                    'phone' => $this->faker->phoneNumber,
                    'billing_address' => $this->faker->streetAddress,
                    'billing_city' => $this->faker->city,
                    'billing_state' => $this->faker->state,
                    'billing_postal_code' => $this->faker->postcode,
                    'billing_country' => $this->faker->country,
                    'status' => 'active',
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
        
        return Vendor::where('created_by', $companyId)->get();
    }
    
    private function ensureProducts($companyId, $min)
    {
        $products = Product::where('created_by', $companyId)->get();
        if ($products->count() >= $min) return $products;
        
        $current = $products->count();
        $productData = [
            ['name' => 'Wireless Bluetooth Headphones', 'purchase' => 45, 'selling' => 89, 'stock' => 25],
            ['name' => '55" 4K Smart LED TV', 'purchase' => 450, 'selling' => 699, 'stock' => 8],
            ['name' => 'Mechanical Gaming Keyboard RGB', 'purchase' => 65, 'selling' => 129, 'stock' => 15],
            ['name' => 'Automatic Coffee Machine Deluxe', 'purchase' => 180, 'selling' => 299, 'stock' => 12],
            ['name' => 'Ergonomic Office Chair Executive', 'purchase' => 120, 'selling' => 249, 'stock' => 18],
            ['name' => 'Smartphone 128GB Dual Camera', 'purchase' => 280, 'selling' => 449, 'stock' => 22],
            ['name' => 'Laptop 15.6" Intel i5 8GB RAM', 'purchase' => 520, 'selling' => 799, 'stock' => 10],
            ['name' => 'Wireless Mouse Optical 2.4GHz', 'purchase' => 12, 'selling' => 25, 'stock' => 45],
            ['name' => 'Bluetooth Speaker Portable 20W', 'purchase' => 35, 'selling' => 69, 'stock' => 30],
            ['name' => 'USB-C Charging Cable 6ft', 'purchase' => 8, 'selling' => 19, 'stock' => 60],
            ['name' => 'Fitness Tracker Heart Rate Monitor', 'purchase' => 55, 'selling' => 99, 'stock' => 20],
            ['name' => 'Stainless Steel Water Bottle 32oz', 'purchase' => 15, 'selling' => 29, 'stock' => 35],
            ['name' => 'LED Desk Lamp Adjustable Brightness', 'purchase' => 25, 'selling' => 49, 'stock' => 28],
            ['name' => 'Wireless Charging Pad Fast Charge', 'purchase' => 18, 'selling' => 39, 'stock' => 40],
            ['name' => 'Gaming Mouse Pad Extended XXL', 'purchase' => 22, 'selling' => 45, 'stock' => 32],
            ['name' => 'Portable Power Bank 20000mAh', 'purchase' => 28, 'selling' => 59, 'stock' => 25],
            ['name' => 'Webcam HD 1080p Auto Focus', 'purchase' => 42, 'selling' => 79, 'stock' => 18],
            ['name' => 'Microfiber Cleaning Cloth Set', 'purchase' => 5, 'selling' => 12, 'stock' => 80],
            ['name' => 'Phone Case Protective Clear', 'purchase' => 6, 'selling' => 15, 'stock' => 55],
            ['name' => 'Tablet Stand Adjustable Aluminum', 'purchase' => 20, 'selling' => 39, 'stock' => 24]
        ];
        
        $categories = Category::where('created_by', $companyId)->get();
        $units = Unit::where('created_by', $companyId)->get();
        $brands = Brand::where('created_by', $companyId)->get();
        
        if ($categories->count() == 0 || $units->count() == 0) return $products;
        
        for ($i = $current; $i < $min; $i++) {
            try {
                $product = $productData[$i % count($productData)];
                Product::create([
                    'name' => $product['name'],
                    'sku' => 'PRD-' . str_pad($companyId, 3, '0', STR_PAD_LEFT) . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                    'description' => 'High-quality ' . strtolower($product['name']) . ' with excellent performance and durability.',
                    'category_id' => $categories->random()->id,
                    'unit_id' => $units->random()->id,
                    'brand_id' => $brands->count() > 0 ? $brands->random()->id : null,
                    'purchase_price' => $product['purchase'],
                    'selling_price' => $product['selling'],
                    'stock_quantity' => $product['stock'],
                    'min_stock_level' => max(1, intval($product['stock'] * 0.2)),
                    'status' => 'active',
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
        
        return Product::where('created_by', $companyId)->get();
    }
    
    private function createExpenseCategories($companyId, $min)
    {
        $current = ExpenseCategory::where('created_by', $companyId)->count();
        if ($current >= $min) return ExpenseCategory::where('created_by', $companyId)->get();
        
        $categories = [
            ['name' => 'Office Rent', 'description' => 'Monthly office and store rent payments'],
            ['name' => 'Utilities', 'description' => 'Electricity, water, gas, and internet bills'],
            ['name' => 'Marketing & Advertising', 'description' => 'Digital marketing, print ads, and promotions'],
            ['name' => 'Employee Salaries', 'description' => 'Staff wages and salary payments'],
            ['name' => 'Office Equipment', 'description' => 'Computers, furniture, and office supplies'],
            ['name' => 'Business Insurance', 'description' => 'Property, liability, and business insurance'],
            ['name' => 'Travel & Transportation', 'description' => 'Business travel and delivery expenses'],
            ['name' => 'Maintenance & Repairs', 'description' => 'Equipment maintenance and facility repairs']
        ];
        
        for ($i = $current; $i < $min; $i++) {
            try {
                $category = $categories[$i % count($categories)];
                ExpenseCategory::create([
                    'name' => $category['name'],
                    'slug' => \Illuminate\Support\Str::slug($category['name']) . '-' . $companyId,
                    'description' => $category['description'],
                    'status' => 'active',
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
        
        return ExpenseCategory::where('created_by', $companyId)->get();
    }
    
    private function createExpenses($companyId, $expenseCategories, $branches, $min)
    {
        $current = Expense::where('created_by', $companyId)->count();
        if ($current >= $min || $expenseCategories->count() == 0) return;
        
        $expenseTypes = [
            'Office Rent' => ['Monthly office rent payment', 2500, 5000],
            'Utilities' => ['Electricity and water bills', 300, 800],
            'Marketing' => ['Digital marketing campaigns', 1000, 3000],
            'Salaries' => ['Employee salary payments', 3000, 8000],
            'Equipment' => ['Office equipment purchase', 500, 2000],
            'Insurance' => ['Business insurance premium', 400, 1200],
            'Travel' => ['Business travel expenses', 200, 1500],
            'Maintenance' => ['Equipment maintenance costs', 150, 600]
        ];
        
        for ($i = $current; $i < $min; $i++) {
            try {
                $category = $expenseCategories->random();
                $expenseType = $expenseTypes[array_rand($expenseTypes)];
                
                Expense::create([
                    'expense_category_id' => $category->id,
                    'branch_id' => $branches->count() > 0 ? $branches->random()->id : null,
                    'title' => $category->name . ' - ' . date('M Y'),
                    'description' => $expenseType[0],
                    'amount' => $this->faker->randomFloat(2, $expenseType[1], $expenseType[2]),
                    'expense_date' => $this->faker->dateTimeBetween('-3 months', 'now'),
                    'status' => $this->faker->randomElement(['approved', 'pending', 'rejected']),
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function createNotificationTemplates($companyId, $min)
    {
        $current = NotificationTemplate::where('created_by', $companyId)->count();
        if ($current >= $min) return;
        
        $templates = [
            ['name' => 'New Customer', 'slug' => 'new_customer'],
            ['name' => 'New Sale', 'slug' => 'new_sale'],
            ['name' => 'Low Stock', 'slug' => 'low_stock'],
            ['name' => 'Payment Due', 'slug' => 'payment_due'],
            ['name' => 'Order Complete', 'slug' => 'order_complete'],
            ['name' => 'System Alert', 'slug' => 'system_alert']
        ];
        
        for ($i = $current; $i < $min; $i++) {
            try {
                $template = $templates[$i % count($templates)];
                NotificationTemplate::create([
                    'name' => $template['name'],
                    'slug' => $template['slug'] . '_' . $companyId,
                    'variables' => '{"name":"Name","amount":"Amount"}',
                    'status' => 'active',
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function createNotifications($companyId, $min)
    {
        $current = Notification::where('created_by', $companyId)->count();
        if ($current >= $min) return;
        
        $titles = ['Order Alert', 'Payment Update', 'Stock Warning', 'System Notice', 'Customer Message', 'Report Ready'];
        
        for ($i = $current; $i < $min; $i++) {
            try {
                Notification::create([
                    'title' => $titles[$i % count($titles)],
                    'description' => $this->faker->sentence(8),
                    'from_date' => $this->faker->dateTimeBetween('-1 month', 'now'),
                    'to_date' => $this->faker->dateTimeBetween('now', '+1 month'),
                    'color' => $this->faker->randomElement(['blue', 'green', 'yellow', 'red']),
                    'status' => 'active',
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function createPurchasesCorrect($companyId, $vendors, $branches, $min)
    {
        $current = Purchase::where('created_by', $companyId)->count();
        if ($current >= $min || $vendors->count() == 0) return Purchase::where('created_by', $companyId)->get();
        
        $purchases = [];
        for ($i = $current; $i < $min; $i++) {
            try {
                $purchase = Purchase::create([
                    'vendor_id' => $vendors->random()->id,
                    'purchase_date' => $this->faker->dateTimeBetween('-2 months', 'now'),
                    'total_amount' => $this->faker->randomFloat(2, 1000, 5000),
                    'notes' => $this->faker->sentence(4),
                    'created_by' => $companyId
                ]);
                $purchases[] = $purchase;
            } catch (\Exception $e) {
                continue;
            }
        }
        
        return Purchase::where('created_by', $companyId)->get();
    }
    
    private function createPurchaseReturnsCorrect($companyId, $purchases, $min)
    {
        $current = PurchaseReturn::where('created_by', $companyId)->count();
        if ($current >= $min || $purchases->count() == 0) return;
        
        for ($i = $current; $i < $min; $i++) {
            try {
                PurchaseReturn::create([
                    'return_number' => 'PR-' . $companyId . '-' . date('Y') . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                    'purchase_id' => $purchases->random()->id,
                    'return_date' => $this->faker->dateTimeBetween('-1 month', 'now'),
                    'total_amount' => $this->faker->randomFloat(2, 500, 2000),
                    'reason' => 'Quality issue',
                    'status' => 'approved',
                    'notes' => $this->faker->sentence(4),
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function createSalesCorrect($companyId, $customers, $branches, $min)
    {
        $current = Sale::where('created_by', $companyId)->count();
        if ($current >= $min || $customers->count() == 0 || $branches->count() == 0) return Sale::where('created_by', $companyId)->get();
        
        $cashRegisters = CashRegister::where('created_by', $companyId)->get();
        $sales = [];
        
        for ($i = $current; $i < $min; $i++) {
            try {
                $subtotal = $this->faker->randomFloat(2, 500, 3000);
                $taxAmount = $subtotal * 0.1;
                $totalAmount = $subtotal + $taxAmount;
                
                $sale = Sale::create([
                    'sale_number' => 'SAL-' . $companyId . '-' . date('Y') . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                    'customer_id' => $customers->random()->id,
                    'branch_id' => $branches->random()->id,
                    'cash_register_id' => $cashRegisters->count() > 0 ? $cashRegisters->random()->id : null,
                    'sale_date' => $this->faker->dateTimeBetween('-2 months', 'now'),
                    'subtotal' => $subtotal,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount,
                    'paid_amount' => $totalAmount,
                    'change_amount' => 0,
                    'payment_method' => 'cash',
                    'status' => 'completed',
                    'notes' => $this->faker->sentence(4),
                    'created_by' => $companyId
                ]);
                $sales[] = $sale;
            } catch (\Exception $e) {
                continue;
            }
        }
        
        return Sale::where('created_by', $companyId)->get();
    }
    
    private function createRoles($companyId, $min)
    {
        $current = Role::where('created_by', $companyId)->count();
        if ($current >= $min) return;
        
        $roles = [
            ['name' => 'Manager', 'label' => 'Store Manager', 'description' => 'Manages store operations'],
            ['name' => 'Cashier', 'label' => 'Cashier', 'description' => 'Handles sales transactions'],
            ['name' => 'Inventory', 'label' => 'Inventory Manager', 'description' => 'Manages inventory and stock'],
            ['name' => 'Sales', 'label' => 'Sales Representative', 'description' => 'Handles customer sales'],
            ['name' => 'Accountant', 'label' => 'Accountant', 'description' => 'Manages financial records']
        ];
        
        for ($i = $current; $i < $min; $i++) {
            try {
                $role = $roles[$i % count($roles)];
                Role::create([
                    'name' => $role['name'] . '_' . $companyId,
                    'label' => $role['label'],
                    'description' => $role['description'],
                    'guard_name' => 'web',
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function createUsers($companyId, $min)
    {
        $current = User::where('created_by', $companyId)->where('type', '!=', 'company')->count();
        if ($current >= $min) return;
        
        $branches = Branch::where('created_by', $companyId)->get();
        $roles = Role::where('created_by', $companyId)->get();
        
        $userTypes = ['staff', 'employee', 'manager'];
        
        for ($i = $current; $i < $min; $i++) {
            try {
                $user = User::create([
                    'name' => $this->faker->name,
                    'email' => $this->faker->unique()->email,
                    'password' => bcrypt('password'),
                    'type' => $userTypes[array_rand($userTypes)],
                    'is_enable_login' => 1,
                    'status' => 'active',
                    'branch_id' => $branches->count() > 0 ? $branches->random()->id : null,
                    'created_by' => $companyId
                ]);
                
                if ($roles->count() > 0) {
                    $user->assignRole($roles->random()->name);
                }
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function createQuotations($companyId, $customers, $branches, $min)
    {
        $current = Quotation::where('created_by', $companyId)->count();
        if ($current >= $min || $customers->count() == 0 || $branches->count() == 0) return;
        
        for ($i = $current; $i < $min; $i++) {
            try {
                $subtotal = $this->faker->randomFloat(2, 800, 4000);
                $discountAmount = $subtotal * $this->faker->randomFloat(2, 0, 0.15);
                $taxAmount = ($subtotal - $discountAmount) * 0.12;
                $totalAmount = $subtotal - $discountAmount + $taxAmount;
                
                $quotationDate = $this->faker->dateTimeBetween('-1 month', 'now');
                $validUntil = (clone $quotationDate)->modify('+30 days');
                
                Quotation::create([
                    'customer_id' => $customers->random()->id,
                    'branch_id' => $branches->random()->id,
                    'quotation_date' => $quotationDate,
                    'valid_until' => $validUntil,
                    'status' => $this->faker->randomElement(['draft', 'sent', 'approved', 'rejected', 'expired']),
                    'subtotal' => $subtotal,
                    'discount_amount' => $discountAmount,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount,
                    'notes' => $this->faker->sentence(8),
                    'terms_conditions' => 'Payment due within 30 days. All prices are subject to change.',
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
    
    private function createSaleReturnsCorrect($companyId, $sales, $min)
    {
        $current = SaleReturn::where('created_by', $companyId)->count();
        if ($current >= $min || $sales->count() == 0) return;
        
        for ($i = $current; $i < $min; $i++) {
            try {
                $sale = $sales->random();
                $subtotal = $this->faker->randomFloat(2, 100, 500);
                $taxAmount = $subtotal * 0.1;
                $totalAmount = $subtotal + $taxAmount;
                
                SaleReturn::create([
                    'return_number' => 'SR-' . $companyId . '-' . date('Y') . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                    'sale_id' => $sale->id,
                    'customer_id' => $sale->customer_id,
                    'branch_id' => $sale->branch_id,
                    'return_date' => $this->faker->dateTimeBetween('-1 month', 'now'),
                    'subtotal' => $subtotal,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount,
                    'reason' => 'Customer request',
                    'status' => 'approved',
                    'notes' => $this->faker->sentence(4),
                    'created_by' => $companyId
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }
    }
}