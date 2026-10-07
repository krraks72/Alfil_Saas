<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Purchase;
use App\Models\Expense;
use App\Models\Tax;
use App\Models\SaleItem;
use App\Models\PurchaseItem;
use App\Models\Category;
use App\Models\Brand;
use App\Models\ExpenseCategory;
use App\Models\Branch;
use App\Models\CashRegister;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\SalesReportExport;
use App\Exports\InventoryReportExport;
use App\Exports\PurchaseReportExport;
use App\Exports\ExpenseReportExport;
use App\Exports\FinancialReportExport;
use App\Exports\CustomerAnalyticsExport;
use App\Exports\TaxReportExport;
use App\Exports\VendorReportExport;
use App\Exports\SimpleArrayExport;

class ReportController extends Controller
{
    public function salesReport(Request $request)
    {
        $user = auth()->user();
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));
        $branchId = $request->get('branch_id');
        $cashRegisterId = $request->get('cash_register_id');
        $customerId = $request->get('customer_id');
        $chartView = $request->get('chart_view', 'daily'); // daily or monthly

        // Check if demo mode is enabled
        if (getSetting('is_demo')) {
            $demoData = getDemoSalesReportData($chartView);

            // Fetch real top products from DB for demo mode
            $demoTopProducts = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->leftJoin('units', 'products.unit_id', '=', 'units.id')
                ->where('sales.status', 'completed')
                ->select(
                    'products.name',
                    'products.sku',
                    'products.image',
                    'units.short_name as unit_name',
                    DB::raw('SUM(sale_items.quantity) as total_quantity'),
                    DB::raw('SUM(COALESCE(sale_items.line_total, sale_items.quantity * sale_items.unit_price)) as total_revenue')
                )
                ->groupBy('products.id', 'products.name', 'products.sku', 'products.image', 'units.short_name')
                ->orderBy('total_revenue', 'desc')
                ->limit(10)
                ->get();

            // Filter chart data based on date range and other filters
            $filteredChartData = collect($demoData['chartData'])->filter(function ($item) use ($dateFrom, $dateTo, $chartView, $branchId, $cashRegisterId, $customerId) {
                // Date filtering
                $dateMatch = false;
                if ($chartView === 'monthly') {
                    $fromMonth = substr($dateFrom, 0, 7);
                    $toMonth = substr($dateTo, 0, 7);
                    $dateMatch = $item['period'] >= $fromMonth && $item['period'] <= $toMonth;
                } else {
                    $dateMatch = $item['period'] >= $dateFrom && $item['period'] <= $dateTo;
                }

                // Branch/Cash Register/Customer filtering (simulate by reducing data)
                $filterMatch = true;
                if ($branchId && $branchId !== 'all') {
                    $filterMatch = $filterMatch && (crc32($item['period'] . $branchId) % 3 !== 0);
                }
                if ($cashRegisterId && $cashRegisterId !== 'all') {
                    $filterMatch = $filterMatch && (crc32($item['period'] . $cashRegisterId) % 4 !== 0);
                }
                if ($customerId && $customerId !== 'all') {
                    $filterMatch = $filterMatch && (crc32($item['period'] . $customerId) % 5 !== 0);
                }

                return $dateMatch && $filterMatch;
            })->values();

            // Apply filter reduction to totals if filters are applied
            $reductionFactor = 1;
            if ($branchId && $branchId !== 'all') $reductionFactor *= 0.7;
            if ($cashRegisterId && $cashRegisterId !== 'all') $reductionFactor *= 0.8;
            if ($customerId && $customerId !== 'all') $reductionFactor *= 0.6;

            // Apply reduction to filtered data
            $filteredChartData = $filteredChartData->map(function ($item) use ($reductionFactor) {
                return [
                    'period' => $item['period'],
                    'total' => round($item['total'] * $reductionFactor),
                    'transactions' => round($item['transactions'] * $reductionFactor)
                ];
            });

            // Calculate filtered summary based on filtered data
            $filteredTotal = $filteredChartData->sum('total');
            $filteredTransactions = $filteredChartData->sum('transactions') ?: $filteredChartData->count() * 15; // Estimate transactions
            $filteredAvg = $filteredTransactions > 0 ? $filteredTotal / $filteredTransactions : 0;

            $filteredSummary = [
                'total_sales' => $filteredTotal,
                'total_transactions' => $filteredTransactions,
                'avg_transaction_value' => $filteredAvg
            ];

            // Use original summary if no data in range, otherwise use filtered
            $summaryToUse = $filteredChartData->isEmpty() ? $demoData['summary'] : $filteredSummary;

            return Inertia::render('reports/sales', [
                'filters' => [
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                    'branch_id' => $branchId,
                    'cash_register_id' => $cashRegisterId,
                    'customer_id' => $customerId,
                    'chart_view' => $chartView,
                ],
                'summary' => $demoData['summary'],
                'chartData' => $filteredChartData,
                'topProducts' => $demoTopProducts->isNotEmpty() ? $demoTopProducts : $demoData['topProducts'],
                'branches' => $demoData['branches'],
                'cashRegisters' => $demoData['cashRegisters'],
                'customers' => $demoData['customers']
            ]);
        }

        // Base query
        $query = Sale::where('created_by', createdBy())
            ->whereBetween('sale_date', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->where('status', 'completed');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if ($cashRegisterId) {
            $query->where('cash_register_id', $cashRegisterId);
        }

        if ($customerId) {
            $query->where('customer_id', $customerId);
        }

        // Summary statistics
        $totalSales = $query->sum('total_amount');
        $totalTransactions = $query->count();
        $avgTransactionValue = $totalTransactions > 0 ? $totalSales / $totalTransactions : 0;

        // Chart data based on view type
        if ($chartView === 'monthly') {
            $chartData = $query->clone()
                ->select(
                    DB::raw('DATE_FORMAT(sale_date, "%Y-%m") as period'),
                    DB::raw('SUM(total_amount) as total'),
                    DB::raw('COUNT(*) as transactions')
                )
                ->groupBy(DB::raw('DATE_FORMAT(sale_date, "%Y-%m")'))
                ->orderBy('period')
                ->get();
        } else {
            $chartData = $query->clone()
                ->select(
                    DB::raw('DATE(sale_date) as period'),
                    DB::raw('SUM(total_amount) as total'),
                    DB::raw('COUNT(*) as transactions')
                )
                ->groupBy(DB::raw('DATE(sale_date)'))
                ->orderBy('period')
                ->get();
        }

        // Top products with filters applied
        $topProductsQuery = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.created_by', createdBy())
            ->whereBetween('sales.sale_date', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->where('sales.status', 'completed');

        if ($branchId) {
            $topProductsQuery->where('sales.branch_id', $branchId);
        }

        if ($cashRegisterId) {
            $topProductsQuery->where('sales.cash_register_id', $cashRegisterId);
        }

        if ($customerId) {
            $topProductsQuery->where('sales.customer_id', $customerId);
        }

        $topProductsQuery->leftJoin('units', 'products.unit_id', '=', 'units.id');

        $topProducts = $topProductsQuery
            ->select(
                'products.name',
                'products.sku',
                'products.image',
                'units.short_name as unit_name',
                DB::raw('SUM(sale_items.quantity) as total_quantity'),
                DB::raw('SUM(COALESCE(sale_items.line_total, sale_items.quantity * sale_items.unit_price)) as total_revenue')
            )
            ->groupBy('products.id', 'products.name', 'products.sku', 'products.image', 'units.short_name')
            ->orderBy('total_revenue', 'desc')
            ->limit(10)
            ->get();

        // Get branches and cash registers for dropdowns
        $branches = Branch::where('created_by', createdBy())
            ->where('status', 1)
            ->select('id', 'name')
            ->get();

        $cashRegisters = CashRegister::where('created_by', createdBy())
            ->where('status', 1)
            ->with('branch:id,name')
            ->select('id', 'name', 'branch_id')
            ->get();

        $customers = \App\Models\Customer::where('created_by', createdBy())
            ->where('status', 1)
            ->select('id', 'name')
            ->get();

        return Inertia::render('reports/sales', [
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'branch_id' => $branchId,
                'cash_register_id' => $cashRegisterId,
                'customer_id' => $customerId,
                'chart_view' => $chartView,
            ],
            'summary' => [
                'total_sales' => $totalSales,
                'total_transactions' => $totalTransactions,
                'avg_transaction_value' => $avgTransactionValue,
            ],
            'chartData' => $chartData,
            'topProducts' => $topProducts,
            'branches' => $branches,
            'cashRegisters' => $cashRegisters,
            'customers' => $customers,
        ]);
    }

    public function financialReport(Request $request)
    {
        try {
            $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
            $dateTo = $request->get('date_to', now()->format('Y-m-d'));
            $branchId = $request->get('branch_id');
            $chartView = $request->get('chart_view', 'daily');

            // Check if demo mode is enabled
            if (getSetting('is_demo')) {
                $demoData = getDemoFinancialReportData($chartView);

                // Filter chart data based on date range and branch filter
                $filteredMonthlyData = collect($demoData['monthlyData'])->filter(function ($item) use ($dateFrom, $dateTo, $chartView, $branchId) {
                    // Date filtering
                    $dateMatch = false;
                    if ($chartView === 'monthly') {
                        $fromMonth = substr($dateFrom, 0, 7);
                        $toMonth = substr($dateTo, 0, 7);
                        $dateMatch = $item['month'] >= $fromMonth && $item['month'] <= $toMonth;
                    } else {
                        $dateMatch = $item['month'] >= $dateFrom && $item['month'] <= $dateTo;
                    }

                    // Branch filtering simulation
                    $filterMatch = true;
                    if ($branchId && $branchId !== 'all') {
                        $filterMatch = (crc32($item['month'] . $branchId) % 3 !== 0);
                    }

                    return $dateMatch && $filterMatch;
                })->values();

                // Apply branch filter reduction
                $reductionFactor = ($branchId && $branchId !== 'all') ? 0.7 : 1;

                // Apply reduction to filtered data
                $filteredMonthlyData = $filteredMonthlyData->map(function ($item) use ($reductionFactor) {
                    return [
                        'month' => $item['month'],
                        'revenue' => round($item['revenue'] * $reductionFactor),
                        'transactions' => round($item['transactions'] * $reductionFactor)
                    ];
                });

                // Calculate filtered summary
                $filteredRevenue = $filteredMonthlyData->sum('revenue');

                // Calculate proportional expenses and costs based on revenue ratio
                $totalDemoRevenue = collect($demoData['monthlyData'])->sum('revenue');
                $revenueRatio = $totalDemoRevenue > 0 ? $filteredRevenue / $totalDemoRevenue : 0;

                $filteredExpenses = round($demoData['summary']['total_expenses'] * $revenueRatio * $reductionFactor);
                $filteredPurchaseCosts = round($demoData['summary']['purchase_costs'] * $revenueRatio * $reductionFactor);
                $filteredGrossProfit = $filteredRevenue - $filteredPurchaseCosts;
                $filteredNetProfit = $filteredGrossProfit - $filteredExpenses;
                $filteredProfitMargin = $filteredRevenue > 0 ? ($filteredNetProfit / $filteredRevenue) * 100 : 0;

                $filteredSummary = [
                    'total_revenue' => $filteredRevenue,
                    'total_expenses' => $filteredExpenses,
                    'purchase_costs' => $filteredPurchaseCosts,
                    'gross_profit' => $filteredGrossProfit,
                    'net_profit' => $filteredNetProfit,
                    'profit_margin' => $filteredProfitMargin,
                    'total_tax' => round($demoData['summary']['total_tax'] * $revenueRatio * $reductionFactor),
                    'total_discount' => round($demoData['summary']['total_discount'] * $revenueRatio * $reductionFactor)
                ];

                // Apply reduction to expense categories
                $filteredExpensesByCategory = collect($demoData['expensesByCategory'])->map(function ($category) use ($revenueRatio, $reductionFactor) {
                    return [
                        'name' => $category['name'],
                        'total' => round($category['total'] * $revenueRatio * $reductionFactor)
                    ];
                });

                $summaryToUse = $filteredMonthlyData->isEmpty() ? $demoData['summary'] : $filteredSummary;

                return Inertia::render('reports/financial', [
                    'filters' => [
                        'date_from' => $dateFrom,
                        'date_to' => $dateTo,
                        'branch_id' => $branchId,
                        'chart_view' => $chartView,
                    ],
                    'summary' => $demoData['summary'],
                    'monthlyData' => $filteredMonthlyData,
                    'expensesByCategory' => $filteredExpensesByCategory,
                ]);
            }

            // Sales data
            $salesQuery = Sale::where('created_by', createdBy())
                ->whereBetween('sale_date', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
                ->where('status', 'completed');

            if ($branchId) {
                $salesQuery->where('branch_id', $branchId);
            }

            $totalRevenue = (float) $salesQuery->sum('total_amount');
            $totalTax = (float) $salesQuery->sum('tax_amount');
            $totalDiscount = (float) $salesQuery->sum('discount_amount');

            // Expenses data
            $expensesQuery = Expense::where('created_by', createdBy())
                ->whereBetween('expense_date', [$dateFrom, $dateTo])
                ->where('status', 'approved');

            if ($branchId) {
                $expensesQuery->where('branch_id', $branchId);
            }

            $totalExpenses = (float) $expensesQuery->sum('amount');

            // Purchase costs
            $purchaseCosts = (float) Purchase::where('created_by', createdBy())
                ->whereBetween('purchase_date', [$dateFrom, $dateTo])
                ->where('status', 'received')
                ->sum('total_amount');

            // Calculations
            $grossProfit = $totalRevenue - $purchaseCosts;
            $netProfit = $grossProfit - $totalExpenses;
            $profitMargin = $totalRevenue > 0 ? ($netProfit / $totalRevenue) * 100 : 0;

            // Chart data based on view type
            if ($chartView === 'monthly') {
                $monthlyData = $salesQuery->clone()
                    ->select(
                        DB::raw('DATE_FORMAT(sale_date, "%Y-%m") as month'),
                        DB::raw('SUM(total_amount) as revenue'),
                        DB::raw('COUNT(*) as transactions')
                    )
                    ->groupBy(DB::raw('DATE_FORMAT(sale_date, "%Y-%m")'))
                    ->orderBy('month')
                    ->get();
            } else {
                $monthlyData = $salesQuery->clone()
                    ->select(
                        DB::raw('DATE(sale_date) as month'),
                        DB::raw('SUM(total_amount) as revenue'),
                        DB::raw('COUNT(*) as transactions')
                    )
                    ->groupBy(DB::raw('DATE(sale_date)'))
                    ->orderBy('month')
                    ->get();
            }

            // Simple expense breakdown without joins
            $expensesByCategory = collect([
                ['name' => 'Office Supplies', 'total' => $totalExpenses * 0.2],
                ['name' => 'Marketing', 'total' => $totalExpenses * 0.28],
                ['name' => 'Utilities', 'total' => $totalExpenses * 0.12],
                ['name' => 'Rent', 'total' => $totalExpenses * 0.24],
                ['name' => 'Other', 'total' => $totalExpenses * 0.16]
            ]);

            return Inertia::render('reports/financial', [
                'filters' => [
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                    'branch_id' => $branchId,
                    'chart_view' => $chartView,
                ],
                'summary' => [
                    'total_revenue' => $totalRevenue,
                    'total_expenses' => $totalExpenses,
                    'purchase_costs' => $purchaseCosts,
                    'gross_profit' => $grossProfit,
                    'net_profit' => $netProfit,
                    'profit_margin' => $profitMargin,
                    'total_tax' => $totalTax,
                    'total_discount' => $totalDiscount,
                ],
                'monthlyData' => $monthlyData,
                'expensesByCategory' => $expensesByCategory,
            ]);
        } catch (\Exception $e) {
            \Log::error('Financial Report Error: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Unable to load financial report']);
        }
    }

    public function inventoryReport(Request $request)
    {
        $categoryId = $request->get('category_id');
        $brandId = $request->get('brand_id');
        $stockFilter = $request->get('stock_filter');

        if (isDemo()) {
            $demoQuery = Product::with(['category', 'brand', 'unit','creator'])->limit(10);

            if ($categoryId) $demoQuery->where('category_id', $categoryId);
            if ($brandId) $demoQuery->where('brand_id', $brandId);
            if ($stockFilter === 'low_stock') {
                $demoQuery->where('stock_quantity', '>', 0)->whereRaw('stock_quantity <= min_stock_level');
            } elseif ($stockFilter === 'out_of_stock') {
                $demoQuery->where('stock_quantity', 0);
            }

            $demoProducts = $demoQuery->get();

            $demoTopSelling = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->where('sales.sale_date', '>=', now()->subDays(365))
                ->where('sales.status', 'completed')
                ->select(
                    'products.name',
                    'products.sku',
                    DB::raw('SUM(sale_items.quantity) as total_sold'),
                    DB::raw('SUM(sale_items.quantity * sale_items.unit_price) as total_revenue')
                )
                ->groupBy('products.id', 'products.name', 'products.sku')
                ->orderBy('total_sold', 'desc')
                ->limit(10)
                ->get();

            $demoCategories = Category::where('status', 1)->select('id', 'name')->get();
            $demoBrands = Brand::where('status', 1)->select('id', 'name')->get();

            $allDemoProducts = Product::all();
            $demoSummary = [
                'total_products'     => $allDemoProducts->count(),
                'total_stock_value'  => $allDemoProducts->sum(fn($p) => $p->stock_quantity * $p->purchase_price),
                'low_stock_items'    => $allDemoProducts->filter(fn($p) => $p->stock_quantity > 0 && $p->stock_quantity <= $p->min_stock_level)->count(),
                'out_of_stock_items' => $allDemoProducts->where('stock_quantity', 0)->count(),
            ];

            return Inertia::render('reports/inventory', [
                'filters' => [
                    'category_id'  => $categoryId,
                    'brand_id'     => $brandId,
                    'stock_filter' => $stockFilter,
                ],
                'summary'            => $demoSummary,
                'products'           => $demoProducts,
                'topSellingProducts' => $demoTopSelling,
                'categories'         => $demoCategories,
                'brands'             => $demoBrands,
            ]);
        }

        $query = Product::where('created_by', createdBy())
            ->with(['category', 'brand', 'unit']);

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        if ($brandId) {
            $query->where('brand_id', $brandId);
        }

        if ($stockFilter === 'low_stock') {
            $query->where('stock_quantity', '>', 0)
                ->whereRaw('stock_quantity <= min_stock_level');
        } elseif ($stockFilter === 'out_of_stock') {
            $query->where('stock_quantity', 0);
        }

        $products = $query->get();

        $totalProducts = $products->count();
        $totalStockValue = $products->sum(function ($product) {
            return $product->stock_quantity * $product->purchase_price;
        });
        $lowStockItems = $products->filter(function ($product) {
            return $product->stock_quantity > 0 && $product->stock_quantity <= $product->min_stock_level;
        })->count();
        $outOfStockItems = $products->where('stock_quantity', 0)->count();

        $topSellingProducts = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.created_by', createdBy())
            ->where('sales.sale_date', '>=', now()->subDays(30))
            ->where('sales.status', 'completed')
            ->select(
                'products.name',
                'products.sku',
                DB::raw('SUM(sale_items.quantity) as total_sold'),
                DB::raw('SUM(sale_items.quantity * sale_items.unit_price) as total_revenue')
            )
            ->groupBy('products.id', 'products.name', 'products.sku')
            ->orderBy('total_sold', 'desc')
            ->limit(10)
            ->get();

        // Get categories and brands for dropdowns
        $categories = Category::where('created_by', createdBy())
            ->where('status', 1)
            ->select('id', 'name')
            ->get();

        $brands = Brand::where('created_by', createdBy())
            ->where('status', 1)
            ->select('id', 'name')
            ->get();

        return Inertia::render('reports/inventory', [
            'filters' => [
                'category_id' => $categoryId,
                'brand_id' => $brandId,
                'stock_filter' => $stockFilter,
            ],
            'summary' => [
                'total_products' => $totalProducts,
                'total_stock_value' => $totalStockValue,
                'low_stock_items' => $lowStockItems,
                'out_of_stock_items' => $outOfStockItems,
            ],
            'products' => $products,
            'topSellingProducts' => $topSellingProducts,
            'categories' => $categories,
            'brands' => $brands,
        ]);
    }

    public function customerAnalytics(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));
        $chartView = $request->get('chart_view', 'daily');

        // Check if demo mode is enabled
        if (getSetting('is_demo')) {
            $demoData = getDemoCustomerAnalyticsData($chartView);

            // Filter customer acquisition data based on date range
            $filteredCustomerAcquisition = collect($demoData['customerAcquisition'])->filter(function ($item) use ($dateFrom, $dateTo, $chartView) {
                if ($chartView === 'monthly') {
                    $fromMonth = substr($dateFrom, 0, 7);
                    $toMonth = substr($dateTo, 0, 7);
                    return $item['date'] >= $fromMonth && $item['date'] <= $toMonth;
                } else {
                    return $item['date'] >= $dateFrom && $item['date'] <= $dateTo;
                }
            })->values();

            // Calculate filtered summary
            $filteredNewCustomers = $filteredCustomerAcquisition->sum('new_customers');
            $filteredRepeatCustomers = round($filteredNewCustomers * 0.15); // 15% repeat rate

            $filteredSummary = [
                'total_customers' => $demoData['summary']['total_customers'],
                'new_customers' => $filteredNewCustomers,
                'repeat_customers' => $filteredRepeatCustomers
            ];

            $summaryToUse = $filteredCustomerAcquisition->isEmpty() ? $demoData['summary'] : $filteredSummary;

            return Inertia::render('reports/customer-analytics', [
                'filters' => [
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                    'chart_view' => $chartView,
                ],
                'summary' => $demoData['summary'],
                'topCustomers' => $demoData['topCustomers'],
                'customerAcquisition' => $filteredCustomerAcquisition,
            ]);
        }

        $totalCustomers = Customer::where('created_by', createdBy())->count();
        $newCustomers = Customer::where('created_by', createdBy())
            ->whereBetween('created_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->count();

        // Calculate repeat customers (customers with more than 1 sale in date range)
        $repeatCustomers = DB::table('sales')
            ->where('created_by', createdBy())
            ->whereBetween('sale_date', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->where('status', 'completed')
            ->select('customer_id', DB::raw('COUNT(*) as order_count'))
            ->groupBy('customer_id')
            ->havingRaw('COUNT(*) > 1')
            ->get()
            ->count();

        $topCustomers = DB::table('sales')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->where('sales.created_by', createdBy())
            ->whereBetween('sales.sale_date', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->where('sales.status', 'completed')
            ->select(
                'customers.name',
                'customers.email',
                'customers.phone',
                DB::raw('COUNT(sales.id) as total_orders'),
                DB::raw('SUM(sales.total_amount) as total_spent'),
                DB::raw('AVG(sales.total_amount) as avg_order_value')
            )
            ->groupBy('customers.id', 'customers.name', 'customers.email', 'customers.phone')
            ->orderBy('total_spent', 'desc')
            ->limit(10)
            ->get();

        // Chart data based on view type
        if ($chartView === 'monthly') {
            $customerAcquisition = Customer::where('created_by', createdBy())
                ->whereBetween('created_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
                ->select(
                    DB::raw('DATE_FORMAT(created_at, "%Y-%m") as date'),
                    DB::raw('COUNT(*) as new_customers')
                )
                ->groupBy(DB::raw('DATE_FORMAT(created_at, "%Y-%m")'))
                ->orderBy('date')
                ->get();
        } else {
            $customerAcquisition = Customer::where('created_by', createdBy())
                ->whereBetween('created_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(*) as new_customers')
                )
                ->groupBy('date')
                ->orderBy('date')
                ->get();
        }

        return Inertia::render('reports/customer-analytics', [
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'chart_view' => $chartView,
            ],
            'summary' => [
                'total_customers' => $totalCustomers,
                'new_customers' => $newCustomers,
                'repeat_customers' => $repeatCustomers,
            ],
            'topCustomers' => $topCustomers,
            'customerAcquisition' => $customerAcquisition,
        ]);
    }

    public function taxReport(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));
        $branchId = $request->get('branch_id');
        $cashRegisterId = $request->get('cash_register_id');
        $chartView = $request->get('chart_view', 'daily');

        // Check if demo mode is enabled
        if (getSetting('is_demo')) {
            $demoData = getDemoTaxReportData($chartView);

            $filteredDailyTaxCollection = collect($demoData['dailyTaxCollection'])->filter(function ($item) use ($dateFrom, $dateTo, $chartView) {
                if ($chartView === 'monthly') {
                    $fromMonth = substr($dateFrom, 0, 7);
                    $toMonth   = substr($dateTo, 0, 7);
                    return $item['date'] >= $fromMonth && $item['date'] <= $toMonth;
                }
                return $item['date'] >= $dateFrom && $item['date'] <= $dateTo;
            })->values();

            $filteredTaxCollected = $filteredDailyTaxCollection->sum('tax_collected');
            $filteredSalesAmount  = $filteredDailyTaxCollection->sum('total_sales');
            $filteredAvgTaxRate   = $filteredSalesAmount > 0 ? ($filteredTaxCollected / $filteredSalesAmount) * 100 : 0;

            $filteredSummary = [
                'total_tax_collected' => $filteredTaxCollected,
                'total_sales_amount'  => $filteredSalesAmount,
                'avg_tax_rate'        => $filteredAvgTaxRate,
            ];

            $summaryToUse = $filteredDailyTaxCollection->isEmpty() ? $demoData['summary'] : $filteredSummary;

            return Inertia::render('reports/tax', [
                'filters' => [
                    'date_from'        => $dateFrom,
                    'date_to'          => $dateTo,
                    'branch_id'        => $branchId,
                    'cash_register_id' => $cashRegisterId,
                    'chart_view'       => $chartView,
                ],
                'summary'             => $demoData['summary'],
                'dailyTaxCollection'  => $filteredDailyTaxCollection,
                'branches'            => $demoData['branches'],
                'cashRegisters'       => $demoData['cashRegisters'],
            ]);
        }

        $salesQuery = Sale::where('created_by', createdBy())
            ->whereBetween('sale_date', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->where('status', 'completed');
        if ($branchId) {
            $salesQuery->where('branch_id', $branchId);
        }

        if ($cashRegisterId) {
            $salesQuery->where('cash_register_id', $cashRegisterId);
        }

        $totalTaxCollected = $salesQuery->sum('tax_amount');
        $totalSalesAmount = $salesQuery->sum('total_amount');
        $totalSubtotal = $salesQuery->sum('subtotal');
        $avgTaxRate = $totalSubtotal > 0 ? ($totalTaxCollected / $totalSubtotal) * 100 : 0;
        $dailyTaxCollection = $salesQuery->clone()
            ->select(
                DB::raw('DATE(sale_date) as date'),
                DB::raw('SUM(tax_amount) as tax_collected'),
                DB::raw('SUM(total_amount) as total_sales')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Get branches and cash registers for dropdowns
        $branches = Branch::where('created_by', createdBy())
            ->where('status', 1)
            ->select('id', 'name')
            ->get();

        $cashRegisters = CashRegister::where('created_by', createdBy())
            ->where('status', 1)
            ->with('branch:id,name')
            ->select('id', 'name', 'branch_id')
            ->get();

        return Inertia::render('reports/tax', [
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'branch_id' => $branchId,
                'cash_register_id' => $cashRegisterId,
            ],
            'summary' => [
                'total_tax_collected' => $totalTaxCollected,
                'total_sales_amount' => $totalSalesAmount,
                'avg_tax_rate' => $avgTaxRate,
            ],
            'dailyTaxCollection' => $dailyTaxCollection,
            'branches' => $branches,
            'cashRegisters' => $cashRegisters,
        ]);
    }

    public function purchaseReport(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));
        $vendorId = $request->get('vendor_id');
        $status = $request->get('status');
        $chartView = $request->get('chart_view', 'daily');

        // Check if demo mode is enabled
        if (getSetting('is_demo')) {
            $demoData = getDemoPurchaseReportData($chartView);

            // Fetch real purchases from DB for demo (no filters applied)
            $demoPurchases = Purchase::with(['vendor:id,name,email', 'items.product'])
                ->orderBy('purchase_date', 'desc')
                ->limit(50)
                ->get();

            // Fetch real vendors from DB for demo dropdown
            $demoVendors = \App\Models\Vendor::where('status', 1)
                ->select('id', 'name')
                ->get();

            // Filter monthly trend based on date range
            $filteredMonthlyTrend = collect($demoData['monthlyTrend'])->filter(function ($item) use ($dateFrom, $dateTo, $chartView) {
                if ($chartView === 'monthly') {
                    $fromMonth = substr($dateFrom, 0, 7);
                    $toMonth = substr($dateTo, 0, 7);
                    return $item['month'] >= $fromMonth && $item['month'] <= $toMonth;
                } else {
                    return $item['month'] >= $dateFrom && $item['month'] <= $dateTo;
                }
            })->values();

            // Calculate filtered summary
            $filteredTotalAmount = $filteredMonthlyTrend->sum('total_amount');
            $filteredTotalPurchases = $filteredMonthlyTrend->sum('purchase_count');
            $filteredAvgPurchaseValue = $filteredTotalPurchases > 0 ? $filteredTotalAmount / $filteredTotalPurchases : 0;

            $filteredSummary = [
                'total_purchases' => $filteredTotalPurchases,
                'total_amount' => $filteredTotalAmount,
                'avg_purchase_value' => $filteredAvgPurchaseValue
            ];

            return Inertia::render('reports/purchase', [
                'filters' => [
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                    'vendor_id' => $vendorId,
                    'status' => $status,
                    'chart_view' => $chartView,
                ],
                'summary' => $demoData['summary'],
                'purchases' => $demoPurchases->isNotEmpty() ? $demoPurchases : $demoData['purchases'],
                'monthlyTrend' => $filteredMonthlyTrend,
                'vendors' => $demoVendors->isNotEmpty() ? $demoVendors : $demoData['vendors'],
            ]);
        }

        $query = Purchase::where('created_by', createdBy())
            ->whereBetween('purchase_date', [$dateFrom, $dateTo])
            ->with(['vendor', 'items.product']);

        if ($vendorId) {
            $query->where('vendor_id', $vendorId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $purchases = $query->get();

        // Get vendors for dropdown
        $vendors = \App\Models\Vendor::where('created_by', createdBy())
            ->where('status', 1)
            ->select('id', 'name')
            ->get();

        $totalPurchases = $purchases->count();
        $totalAmount = $purchases->sum('total_amount');
        $avgPurchaseValue = $totalPurchases > 0 ? $totalAmount / $totalPurchases : 0;

        $statusBreakdown = Purchase::where('created_by', createdBy())
            ->whereBetween('purchase_date', [$dateFrom, $dateTo])
            ->select('status', DB::raw('COUNT(*) as count'), DB::raw('SUM(total_amount) as total'))
            ->groupBy('status')
            ->get();

        // Chart data based on view type
        $chartView = $request->get('chart_view', 'daily');
        if ($chartView === 'monthly') {
            $monthlyTrend = $query->clone()
                ->select(
                    DB::raw('DATE_FORMAT(purchase_date, "%Y-%m") as month'),
                    DB::raw('COUNT(*) as purchase_count'),
                    DB::raw('SUM(total_amount) as total_amount')
                )
                ->groupBy(DB::raw('DATE_FORMAT(purchase_date, "%Y-%m")'))
                ->orderBy('month')
                ->get();
        } else {
            $monthlyTrend = $query->clone()
                ->select(
                    DB::raw('DATE(purchase_date) as month'),
                    DB::raw('COUNT(*) as purchase_count'),
                    DB::raw('SUM(total_amount) as total_amount')
                )
                ->groupBy(DB::raw('DATE(purchase_date)'))
                ->orderBy('month')
                ->get();
        }

        return Inertia::render('reports/purchase', [
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'vendor_id' => $vendorId,
                'status' => $status,
                'chart_view' => $chartView,
            ],
            'summary' => [
                'total_purchases' => $totalPurchases,
                'total_amount' => $totalAmount,
                'avg_purchase_value' => $avgPurchaseValue,
            ],
            'purchases' => $purchases,
            'monthlyTrend' => $monthlyTrend,
            'vendors' => $vendors,
        ]);
    }

    public function expenseReport(Request $request)
    {
        try {
            $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
            $dateTo = $request->get('date_to', now()->format('Y-m-d'));
            $categoryId = $request->get('category_id');
            $branchId = $request->get('branch_id');
            $status = $request->get('status');
            $chartView = $request->get('chart_view', 'daily');

            // Check if demo mode is enabled
            if (getSetting('is_demo')) {
                $demoData = getDemoExpenseReportData($chartView);

                // Filter monthly trend based on date range
                $filteredMonthlyTrend = collect($demoData['monthlyTrend'])->filter(function ($item) use ($dateFrom, $dateTo, $chartView) {
                    if ($chartView === 'monthly') {
                        $fromMonth = substr($dateFrom, 0, 7);
                        $toMonth = substr($dateTo, 0, 7);
                        return $item['month'] >= $fromMonth && $item['month'] <= $toMonth;
                    } else {
                        return $item['month'] >= $dateFrom && $item['month'] <= $dateTo;
                    }
                })->values();

                // Calculate filtered summary
                $filteredTotalAmount = $filteredMonthlyTrend->sum('total_amount');
                $filteredTotalExpenses = $filteredMonthlyTrend->sum('expense_count');
                $filteredApprovedAmount = round($filteredTotalAmount * 0.78); // 78% approved
                $filteredPendingAmount = $filteredTotalAmount - $filteredApprovedAmount;

                $filteredSummary = [
                    'total_expenses' => $filteredTotalExpenses,
                    'total_amount' => $filteredTotalAmount,
                    'approved_amount' => $filteredApprovedAmount,
                    'pending_amount' => $filteredPendingAmount
                ];

                $summaryToUse = $filteredMonthlyTrend->isEmpty() ? $demoData['summary'] : $filteredSummary;

                return Inertia::render('reports/expense', [
                    'filters' => [
                        'date_from' => $dateFrom,
                        'date_to' => $dateTo,
                        'category_id' => $categoryId,
                        'branch_id' => $branchId,
                        'status' => $status,
                        'chart_view' => $chartView,
                    ],
                    'summary' => $demoData['summary'],
                    'expenses' => $demoData['expenses'],
                    'categoryBreakdown' => $demoData['categoryBreakdown'],
                    'monthlyTrend' => $filteredMonthlyTrend,
                    'statusBreakdown' => $demoData['statusBreakdown'],
                    'categories' => $demoData['categories'],
                    'branches' => $demoData['branches'],
                ]);
            }

            $query = Expense::where('created_by', createdBy())
                ->whereBetween('expense_date', [$dateFrom, $dateTo])
                ->with(['expenseCategory', 'branch']);

            if ($categoryId) {
                $query->where('expense_category_id', $categoryId);
            }

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            if ($status) {
                $query->where('status', $status);
            }

            $expenses = $query->get();

            // Get categories and branches for dropdowns
            $categories = \App\Models\ExpenseCategory::where('created_by', createdBy())
                ->where('status', 1)
                ->select('id', 'name')
                ->get();

            $branches = \App\Models\Branch::where('created_by', createdBy())
                ->where('status', 1)
                ->select('id', 'name')
                ->get();

            $totalExpenses = $expenses->count();
            $totalAmount = (float) $expenses->sum('amount');
            $approvedAmount = (float) $expenses->where('status', 'approved')->sum('amount');
            $pendingAmount = (float) $expenses->where('status', 'pending')->sum('amount');

            // Simple category breakdown
            $categoryBreakdown = collect([
                ['name' => 'All Categories', 'expense_count' => $totalExpenses, 'total_amount' => $totalAmount]
            ]);

            // Chart data based on view type
            $chartView = $request->get('chart_view', 'daily');
            if ($chartView === 'monthly') {
                $monthlyTrend = $query->clone()
                    ->select(
                        DB::raw('DATE_FORMAT(expense_date, "%Y-%m") as month'),
                        DB::raw('COUNT(*) as expense_count'),
                        DB::raw('SUM(amount) as total_amount')
                    )
                    ->groupBy(DB::raw('DATE_FORMAT(expense_date, "%Y-%m")'))
                    ->orderBy('month')
                    ->get();
            } else {
                $monthlyTrend = $query->clone()
                    ->select(
                        DB::raw('DATE(expense_date) as month'),
                        DB::raw('COUNT(*) as expense_count'),
                        DB::raw('SUM(amount) as total_amount')
                    )
                    ->groupBy(DB::raw('DATE(expense_date)'))
                    ->orderBy('month')
                    ->get();
            }

            // Status breakdown
            $statusBreakdown = Expense::where('created_by', createdBy())
                ->whereBetween('expense_date', [$dateFrom, $dateTo])
                ->select('status', DB::raw('COUNT(*) as count'), DB::raw('SUM(amount) as total'))
                ->groupBy('status')
                ->get();

            return Inertia::render('reports/expense', [
                'filters' => [
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                    'category_id' => $categoryId,
                    'branch_id' => $branchId,
                    'status' => $status,
                    'chart_view' => $chartView,
                ],
                'summary' => [
                    'total_expenses' => $totalExpenses,
                    'total_amount' => $totalAmount,
                    'approved_amount' => $approvedAmount,
                    'pending_amount' => $pendingAmount,
                ],
                'expenses' => $expenses,
                'categoryBreakdown' => $categoryBreakdown,
                'monthlyTrend' => $monthlyTrend,
                'statusBreakdown' => $statusBreakdown,
                'categories' => $categories,
                'branches' => $branches,
            ]);
        } catch (\Exception $e) {
            \Log::error('Expense Report Error: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Unable to load expense report']);
        }
    }

    public function vendorReport(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));
        $vendorId = $request->get('vendor_id');
        $chartView = $request->get('chart_view', 'daily');

        // Check if demo mode is enabled
        if (getSetting('is_demo')) {
            $demoData = getDemoVendorReportData($chartView);

            // Filter chart data based on date range
            $filteredChartData = collect($demoData['chartData'])->filter(function ($item) use ($dateFrom, $dateTo, $chartView) {
                if ($chartView === 'monthly') {
                    $fromMonth = substr($dateFrom, 0, 7);
                    $toMonth = substr($dateTo, 0, 7);
                    return $item['period'] >= $fromMonth && $item['period'] <= $toMonth;
                } else {
                    return $item['period'] >= $dateFrom && $item['period'] <= $dateTo;
                }
            })->values();

            // Calculate filtered summary
            $filteredTotalPurchaseAmount = $filteredChartData->sum('total');
            $filteredTotalOrders = $filteredChartData->sum('orders');
            $filteredAvgOrderValue = $filteredTotalOrders > 0 ? $filteredTotalPurchaseAmount / $filteredTotalOrders : 0;

            $filteredSummary = [
                'total_vendors' => $demoData['summary']['total_vendors'],
                'total_purchase_amount' => $filteredTotalPurchaseAmount,
                'total_orders' => $filteredTotalOrders,
                'avg_order_value' => $filteredAvgOrderValue
            ];

            $summaryToUse = $filteredChartData->isEmpty() ? $demoData['summary'] : $filteredSummary;

            return Inertia::render('reports/vendor', [
                'filters' => [
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                    'vendor_id' => $vendorId,
                    'chart_view' => $chartView,
                ],
                'summary' => $demoData['summary'],
                'chartData' => $filteredChartData,
                'topVendors' => $demoData['topVendors'],
                'vendors' => $demoData['vendors'],
            ]);
        }

        // Base query for purchases
        $purchaseQuery = Purchase::where('created_by', createdBy())
            ->whereBetween('purchase_date', [$dateFrom, $dateTo]);

        if ($vendorId) {
            $purchaseQuery->where('vendor_id', $vendorId);
        }

        // Summary statistics
        $totalVendors = \App\Models\Vendor::where('created_by', createdBy())->where('status', 1)->count();
        $totalPurchaseAmount = $purchaseQuery->sum('total_amount');
        $totalOrders = $purchaseQuery->count();
        $avgOrderValue = $totalOrders > 0 ? $totalPurchaseAmount / $totalOrders : 0;

        // Chart data based on view type
        if ($chartView === 'monthly') {
            $chartData = $purchaseQuery->clone()
                ->select(
                    DB::raw('DATE_FORMAT(purchase_date, "%Y-%m") as period'),
                    DB::raw('SUM(total_amount) as total'),
                    DB::raw('COUNT(*) as orders')
                )
                ->groupBy(DB::raw('DATE_FORMAT(purchase_date, "%Y-%m")'))
                ->orderBy('period')
                ->get();
        } else {
            $chartData = $purchaseQuery->clone()
                ->select(
                    DB::raw('DATE(purchase_date) as period'),
                    DB::raw('SUM(total_amount) as total'),
                    DB::raw('COUNT(*) as orders')
                )
                ->groupBy(DB::raw('DATE(purchase_date)'))
                ->orderBy('period')
                ->get();
        }

        // Top vendors by purchase amount
        $topVendorsQuery = DB::table('purchases')
            ->join('vendors', 'purchases.vendor_id', '=', 'vendors.id')
            ->where('purchases.created_by', createdBy())
            ->whereBetween('purchases.purchase_date', [$dateFrom, $dateTo]);

        if ($vendorId) {
            $topVendorsQuery->where('purchases.vendor_id', $vendorId);
        }

        $topVendors = $topVendorsQuery
            ->select(
                'vendors.name',
                'vendors.email',
                'vendors.phone',
                DB::raw('COUNT(purchases.id) as total_orders'),
                DB::raw('SUM(purchases.total_amount) as total_purchase_amount'),
                DB::raw('AVG(purchases.total_amount) as avg_order_value'),
                DB::raw('MAX(purchases.purchase_date) as last_order_date')
            )
            ->groupBy('vendors.id', 'vendors.name', 'vendors.email', 'vendors.phone')
            ->orderBy('total_purchase_amount', 'desc')
            ->limit(10)
            ->get();

        // Get vendors for dropdown
        $vendors = \App\Models\Vendor::where('created_by', createdBy())
            ->where('status', 1)
            ->select('id', 'name')
            ->get();

        return Inertia::render('reports/vendor', [
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'vendor_id' => $vendorId,
                'chart_view' => $chartView,
            ],
            'summary' => [
                'total_vendors' => $totalVendors,
                'total_purchase_amount' => $totalPurchaseAmount,
                'total_orders' => $totalOrders,
                'avg_order_value' => $avgOrderValue,
            ],
            'chartData' => $chartData,
            'topVendors' => $topVendors,
            'vendors' => $vendors,
        ]);
    }

    public function exportSalesReport(Request $request)
    {
        $filters = [
            'date_from' => $request->get('date_from', now()->startOfMonth()->format('Y-m-d')),
            'date_to' => $request->get('date_to', now()->format('Y-m-d')),
            'branch_id' => $request->get('branch_id'),
            'cash_register_id' => $request->get('cash_register_id'),
            'customer_id' => $request->get('customer_id'),
        ];

        return Excel::download(new SalesReportExport($filters), 'sales-report-' . now()->format('Y-m-d') . '.xlsx');
    }

    public function exportInventoryReport(Request $request)
    {
        $filters = [
            'category_id' => $request->get('category_id'),
            'brand_id' => $request->get('brand_id'),
            'stock_filter' => $request->get('stock_filter'),
        ];

        return Excel::download(new InventoryReportExport($filters), 'inventory-report-' . now()->format('Y-m-d') . '.xlsx');
    }

    public function exportPurchaseReport(Request $request)
    {
        $filters = [
            'date_from' => $request->get('date_from', now()->startOfMonth()->format('Y-m-d')),
            'date_to' => $request->get('date_to', now()->format('Y-m-d')),
            'vendor_id' => $request->get('vendor_id'),
            'status' => $request->get('status'),
        ];

        return Excel::download(new PurchaseReportExport($filters), 'purchase-report-' . now()->format('Y-m-d') . '.xlsx');
    }

    public function exportExpenseReport(Request $request)
    {
        $filters = [
            'date_from' => $request->get('date_from', now()->startOfMonth()->format('Y-m-d')),
            'date_to' => $request->get('date_to', now()->format('Y-m-d')),
            'category_id' => $request->get('category_id'),
            'branch_id' => $request->get('branch_id'),
            'status' => $request->get('status'),
        ];

        return Excel::download(new ExpenseReportExport($filters), 'expense-report-' . now()->format('Y-m-d') . '.xlsx');
    }

    public function exportFinancialReport(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));
        $branchId = $request->get('branch_id');
        $chartView = $request->get('chart_view', 'daily');

        // Check if demo mode is enabled
        if (getSetting('is_demo')) {
            $demoData = getDemoFinancialReportData($chartView);

            // Filter monthly data based on date range
            $filteredMonthlyData = collect($demoData['monthlyData'])->filter(function ($item) use ($dateFrom, $dateTo, $chartView) {
                if ($chartView === 'monthly') {
                    $fromMonth = substr($dateFrom, 0, 7);
                    $toMonth = substr($dateTo, 0, 7);
                    return $item['month'] >= $fromMonth && $item['month'] <= $toMonth;
                } else {
                    return $item['month'] >= $dateFrom && $item['month'] <= $dateTo;
                }
            })->values();

            // Apply branch filter reduction if needed
            $reductionFactor = ($branchId && $branchId !== 'all') ? 0.7 : 1;

            // If filtering by specific date range, calculate proportional values
            if ($filteredMonthlyData->isNotEmpty()) {
                $filteredRevenue = $filteredMonthlyData->sum('revenue') * $reductionFactor;

                // Calculate proportional expenses and costs based on revenue ratio
                $totalDemoRevenue = collect($demoData['monthlyData'])->sum('revenue');
                $revenueRatio = $totalDemoRevenue > 0 ? $filteredRevenue / $totalDemoRevenue : 0;

                $filteredExpenses = round($demoData['summary']['total_expenses'] * $revenueRatio);
                $filteredPurchaseCosts = round($demoData['summary']['purchase_costs'] * $revenueRatio);
                $filteredGrossProfit = $filteredRevenue - $filteredPurchaseCosts;
                $filteredNetProfit = $filteredGrossProfit - $filteredExpenses;
                $filteredProfitMargin = $filteredRevenue > 0 ? ($filteredNetProfit / $filteredRevenue) * 100 : 0;
                $filteredTax = round($demoData['summary']['total_tax'] * $revenueRatio);
                $filteredDiscount = round($demoData['summary']['total_discount'] * $revenueRatio);
            } else {
                // If no data in range, use zero values
                $filteredRevenue = 0;
                $filteredExpenses = 0;
                $filteredPurchaseCosts = 0;
                $filteredGrossProfit = 0;
                $filteredNetProfit = 0;
                $filteredProfitMargin = 0;
                $filteredTax = 0;
                $filteredDiscount = 0;
            }

            $data = [
                ['Total Revenue', round($filteredRevenue)],
                ['Total Expenses', round($filteredExpenses)],
                ['Purchase Costs', round($filteredPurchaseCosts)],
                ['Gross Profit', round($filteredGrossProfit)],
                ['Net Profit', round($filteredNetProfit)]
            ];

            return Excel::download(new FinancialReportExport($data), 'financial-report-' . now()->format('Y-m-d') . '.xlsx');
        }

        $salesQuery = Sale::where('created_by', createdBy())
            ->whereBetween('sale_date', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->where('status', 'completed');

        if ($branchId) {
            $salesQuery->where('branch_id', $branchId);
        }

        $expensesQuery = Expense::where('created_by', createdBy())
            ->whereBetween('expense_date', [$dateFrom, $dateTo])
            ->where('status', 'approved');

        if ($branchId) {
            $expensesQuery->where('branch_id', $branchId);
        }

        $totalRevenue = $salesQuery->sum('total_amount');
        $totalExpenses = $expensesQuery->sum('amount');
        $purchaseCosts = Purchase::where('created_by', createdBy())->whereBetween('purchase_date', [$dateFrom, $dateTo])->where('status', 'received')->sum('total_amount');

        $data = [
            ['Total Revenue', $totalRevenue],
            ['Total Expenses', $totalExpenses],
            ['Purchase Costs', $purchaseCosts],
            ['Gross Profit', $totalRevenue - $purchaseCosts],
            ['Net Profit', ($totalRevenue - $purchaseCosts) - $totalExpenses],
        ];

        return Excel::download(new FinancialReportExport($data), 'financial-report-' . now()->format('Y-m-d') . '.xlsx');
    }

    public function exportCustomerAnalytics(Request $request)
    {
        $filters = [
            'date_from' => $request->get('date_from', now()->startOfMonth()->format('Y-m-d')),
            'date_to' => $request->get('date_to', now()->format('Y-m-d')),
        ];

        return Excel::download(new CustomerAnalyticsExport($filters), 'customer-analytics-' . now()->format('Y-m-d') . '.xlsx');
    }

    public function exportTaxReport(Request $request)
    {
        // Check if demo mode is enabled
        if (getSetting('is_demo')) {
            $demoData = getDemoTaxReportData();
            $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
            $dateTo = $request->get('date_to', now()->format('Y-m-d'));

            $filteredData = collect($demoData['dailyTaxCollection'])->filter(function($item) use ($dateFrom, $dateTo) {
                return $item['date'] >= $dateFrom && $item['date'] <= $dateTo;
            })->values();

            // Add headers
            $exportData = [['Date', 'Tax Collected', 'Total Sales', 'Tax Rate (%)']];
            foreach ($filteredData as $item) {
                $taxRate = isset($item['tax_rate']) ? $item['tax_rate'] : (($item['total_sales'] - $item['tax_collected']) > 0 ? ($item['tax_collected'] / ($item['total_sales'] - $item['tax_collected'])) * 100 : 0);
                $exportData[] = [$item['date'], $item['tax_collected'], $item['total_sales'], round($taxRate, 2)];
            }

            return Excel::download(new SimpleArrayExport($exportData), 'tax-report-' . now()->format('Y-m-d') . '.xlsx');
        }

        $filters = [
            'date_from' => $request->get('date_from', now()->startOfMonth()->format('Y-m-d')),
            'date_to' => $request->get('date_to', now()->format('Y-m-d')),
            'branch_id' => $request->get('branch_id'),
            'cash_register_id' => $request->get('cash_register_id'),
        ];

        return Excel::download(new TaxReportExport($filters), 'tax-report-' . now()->format('Y-m-d') . '.xlsx');
    }

    public function exportVendorReport(Request $request)
    {
        $filters = [
            'date_from' => $request->get('date_from', now()->startOfMonth()->format('Y-m-d')),
            'date_to' => $request->get('date_to', now()->format('Y-m-d')),
            'vendor_id' => $request->get('vendor_id'),
        ];

        return Excel::download(new VendorReportExport($filters), 'vendor-report-' . now()->format('Y-m-d') . '.xlsx');
    }
}
