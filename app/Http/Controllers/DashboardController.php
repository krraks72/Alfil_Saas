<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Plan;
use App\Models\PlanOrder;
use App\Models\PlanRequest;
use App\Models\Notification;


class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Super admin always gets dashboard
        if ($user->type === 'superadmin' || $user->type === 'super admin') {
            return $this->renderDashboard();
        }

        // Check if user has dashboard permission (skip if permission doesn't exist)
        try {
            if ($user->hasPermissionTo('manage-dashboard')) {
                return $this->renderDashboard();
            }
        } catch (\Exception $e) {
            // Permission doesn't exist, continue to dashboard for authenticated users
            return $this->renderDashboard();
        }

        // Redirect to first available page
        return $this->redirectToFirstAvailablePage();
    }

    public function redirectToFirstAvailablePage()
    {
        $user = auth()->user();

        // Define available routes with their permissions
        $routes = [
            ['route' => 'users.index', 'permission' => 'manage-users'],
            ['route' => 'roles.index', 'permission' => 'manage-roles'],

            ['route' => 'plans.index', 'permission' => 'manage-plans'],
            ['route' => 'referral.index', 'permission' => 'manage-referral'],
            ['route' => 'settings.index', 'permission' => 'manage-settings'],
        ];

        // Find first available route
        foreach ($routes as $routeData) {
            if ($user->hasPermissionTo($routeData['permission'])) {
                return redirect()->route($routeData['route']);
            }
        }

        // If no permissions found, logout user
        auth()->logout();
        return redirect()->route('login')->with('error', __('No access permissions found.'));
    }

    private function renderDashboard()
    {
        $user = auth()->user();

        if ($user->type === 'superadmin' || $user->type === 'super admin') {
            return $this->renderSuperAdminDashboard();
        } else {
            return $this->renderCompanyDashboard();
        }
    }

    private function renderSuperAdminDashboard()
    {
        // Get system-wide statistics
        $totalCompanies = User::where('type', 'company')->count();
        $totalActivePlanCompanies = User::where('type', 'company')->where('plan_is_active', '1')->count();
        $totalUsers = User::where('type', '!=', 'superadmin')->count();
        $totalRevenue = PlanOrder::where('status', 'approved')->sum('final_price') ?? 0;
        $activePlans = Plan::where('is_plan_enable', true)->orWhere('is_plan_enable','on')->count();
        $pendingRequests = PlanRequest::where('status', 'pending')->count();
        $activeCoupons = Coupon::where('status', true)->count();

        // Calculate monthly growth for companies
        $currentMonthCompanies = User::where('type', 'company')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
        $previousMonthCompanies = User::where('type', 'company')
            ->whereMonth('created_at', now()->subMonth()->month)
            ->whereYear('created_at', now()->subMonth()->year)
            ->count();
        $monthlyGrowth =  isDemo() ? 90 : ( $previousMonthCompanies > 0
            ? round((($currentMonthCompanies - $previousMonthCompanies) / $previousMonthCompanies) * 100, 1)
            : ($currentMonthCompanies > 0 ? 100 : 0));

        // Monthly revenue chart data
        $revenueYear = request('revenueYear', now()->year);
        $availableYears = range(now()->year + 2, now()->year - 4);

        if (isDemo()) {
            $demoRevenue = [4200, 5800, 3900, 7100, 6400, 8900, 7600, 9200, 8100, 10500, 9800, 12400];
            $monthlyRevenue = [];
            for ($i = 1; $i <= 12; $i++) {
                $monthlyRevenue[] = [
                    'month' => date('F Y', mktime(0, 0, 0, $i, 1, $revenueYear)),
                    'short' => date('M', mktime(0, 0, 0, $i, 1, $revenueYear)),
                    'revenue' => (float) $demoRevenue[$i - 1],
                ];
            }
        } else {
            $monthlyRevenue = [];
            for ($m = 1; $m <= 12; $m++) {
                $revenue = PlanOrder::where('status', 'approved')
                    ->whereYear('created_at', $revenueYear)
                    ->whereMonth('created_at', $m)
                    ->sum('final_price') ?? 0;
                $monthlyRevenue[] = [
                    'month' => date('F Y', mktime(0, 0, 0, $m, 1, $revenueYear)),
                    'short' => date('M', mktime(0, 0, 0, $m, 1)),
                    'revenue' => (float) $revenue,
                ];
            }
        }

        // Monthly companies chart data
        $companiesYear = request('companiesYear', now()->year);

        if (isDemo()) {
            $demoCompanies = [3, 5, 4, 7, 6, 9, 8, 11, 7, 13, 10, 15];
            $monthlyCompanies = [];
            for ($i = 1; $i <= 12; $i++) {
                $monthlyCompanies[] = [
                    'month' => date('F Y', mktime(0, 0, 0, $i, 1, $companiesYear)),
                    'short' => date('M', mktime(0, 0, 0, $i, 1, $companiesYear)),
                    'count' => $demoCompanies[$i - 1],
                ];
            }
        } else {
            $monthlyCompanies = [];
            for ($m = 1; $m <= 12; $m++) {
                $count = User::where('type', 'company')
                    ->whereYear('created_at', $companiesYear)
                    ->whereMonth('created_at', $m)
                    ->count();
                $monthlyCompanies[] = [
                    'month' => date('F Y', mktime(0, 0, 0, $m, 1, $companiesYear)),
                    'short' => date('M', mktime(0, 0, 0, $m, 1)),
                    'count' => $count,
                ];
            }
        }

        $dashboardData = [
            'stats' => [
                'totalCompanies' => $totalCompanies,
                'totalActivePlanCompanies' => $totalActivePlanCompanies,
                'totalUsers' => $totalUsers,
                'totalRevenue' => $totalRevenue,
                'activePlans' => $activePlans,
                'pendingRequests' => $pendingRequests,
                'monthlyGrowth' => $monthlyGrowth,
                'activeCoupons' => $activeCoupons
            ],
            'recentCompanies' => User::where('type', 'company')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get()
                ->map(function ($user) {
                    return [
                        'id'            => $user->id,
                        'name'          => $user->name,
                        'email'         => $user->email,
                        'registered_at' => $user->created_at->diffForHumans(),
                        'status'        => $user->status ?? 'active',
                        'avatar'        => check_file($user->avatar) ? get_file($user->avatar) : get_file('avatars/avatar.png'),
                    ];
                }),
            'topPlans' => Plan::withCount('users')
                ->orderBy('users_count', 'desc')
                ->take(3)
                ->get()
                ->map(function ($plan) {
                    return [
                        'name' => $plan->name,
                        'subscribers' => $plan->users_count,
                        'revenue' => $plan->users_count * $plan->price,
                    ];
                }),
            'monthlyCompanies'      => $monthlyCompanies,
            'companiesYear'         => (int) $companiesYear,
            'availableYears'        => $availableYears,
            'monthlyRevenue'        => $monthlyRevenue,
            'revenueYear'           => (int) $revenueYear,
            'revenueAvailableYears' => $availableYears,
        ];

        return Inertia::render('superadmin/dashboard', [
            'dashboardData' => $dashboardData
        ]);
    }

    private function getRecentActivity()
    {
        $activities = collect();

        // Get recent companies
        $recentCompanies = User::where('type', 'company')
            ->orderBy('created_at', 'desc')
            ->limit(3)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'type' => 'company',
                    'message' => 'New company registered: ' . $user->name,
                    'time' => $user->created_at->diffForHumans(),
                    'status' => 'success'
                ];
            });

        // Get recent plan requests
        $recentRequests = PlanRequest::orderBy('created_at', 'desc')
            ->limit(3)
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'type' => 'plan',
                    'message' => 'Plan upgrade request',
                    'time' => $request->created_at->diffForHumans(),
                    'status' => $request->status === 'pending' ? 'warning' : 'success'
                ];
            });

        // Get recent payments
        $recentPayments = PlanOrder::where('status', 'approved')
            ->orderBy('created_at', 'desc')
            ->limit(3)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'type' => 'payment',
                    'message' => 'Payment received: ' . formatPlanPrice($order->final_price),
                    'time' => $order->created_at->diffForHumans(),
                    'status' => 'success'
                ];
            });

        $activities = $activities->concat($recentCompanies)
            ->concat($recentRequests)
            ->concat($recentPayments)
            ->sortByDesc('id')
            ->take(3)
            ->values();

        // If no dynamic data, return static fallback
        if ($activities->isEmpty()) {
            return [
                ['id' => 1, 'type' => 'company', 'message' => 'New company registered', 'time' => '2 hours ago', 'status' => 'success'],
                ['id' => 2, 'type' => 'plan', 'message' => 'Plan upgrade request', 'time' => '4 hours ago', 'status' => 'warning'],
                ['id' => 3, 'type' => 'payment', 'message' => 'Payment received', 'time' => '6 hours ago', 'status' => 'success'],
            ];
        }

        return $activities->toArray();
    }

    private function renderCompanyDashboard()
    {
        $user = auth()->user();
        $createdBy = createdBy();

        // Get POS statistics
        $totalProducts = \App\Models\Product::where('created_by', $createdBy)->count();
        $totalSales = (\App\Models\Sale::where('created_by', $createdBy)->sum('total_amount') ?? 0) - (\App\Models\SaleReturn::where('created_by', $createdBy)->sum('total_amount') ?? 0);
        $totalCustomers = \App\Models\Customer::where('created_by', $createdBy)->count();

        // Calculate monthly growth
        $currentMonthSales = (\App\Models\Sale::where('created_by', $createdBy)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('total_amount') ?? 0) - (\App\Models\SaleReturn::where('created_by', $createdBy)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('total_amount') ?? 0);
        $previousMonthSales = (\App\Models\Sale::where('created_by', $createdBy)
            ->whereMonth('created_at', now()->subMonth()->month)
            ->whereYear('created_at', now()->subMonth()->year)
            ->sum('total_amount') ?? 0) - (\App\Models\SaleReturn::where('created_by', $createdBy)
            ->whereMonth('created_at', now()->subMonth()->month)
            ->whereYear('created_at', now()->subMonth()->year)
            ->sum('total_amount') ?? 0);
        $monthlyGrowth = isDemo() ? 89 : ($previousMonthSales > 0
            ? round((($currentMonthSales - $previousMonthSales) / $previousMonthSales) * 100, 1)
            : ($currentMonthSales > 0 ? 100 : 0));

        // Get total purchases, today sales, today purchases, total expenses, total vendors, and out of stock items
        $totalPurchases = (\App\Models\Purchase::where('created_by', $createdBy)->sum('total_amount') ?? 0) - (\App\Models\PurchaseReturn::where('created_by', $createdBy)->sum('total_amount') ?? 0);
        $todaySales = isDemo() ? 3250.00 : ((\App\Models\Sale::where('created_by', $createdBy)
            ->whereDate('created_at', now())
            ->sum('total_amount') ?? 0) - (\App\Models\SaleReturn::where('created_by', $createdBy)
            ->whereDate('created_at', now())
            ->sum('total_amount') ?? 0));
        $todayPurchases = (\App\Models\Purchase::where('created_by', $createdBy)
            ->whereDate('created_at', now())
            ->sum('total_amount') ?? 0) - (\App\Models\PurchaseReturn::where('created_by', $createdBy)
            ->whereDate('created_at', now())
            ->sum('total_amount') ?? 0);
        $totalExpenses = \App\Models\Expense::where('created_by', $createdBy)->where('status','approved')->sum('amount') ?? 0;
        $totalVendors = \App\Models\Vendor::where('created_by', $createdBy)->count();
        $outOfStockItems = \App\Models\Product::where('created_by', $createdBy)
            ->where('stock_quantity', 0)
            ->count();
        $lowStockItems = \App\Models\Product::where('created_by', $createdBy)
            ->where('stock_quantity', '>', 0)
            ->whereRaw('stock_quantity <= min_stock_level')
            ->count();

        // Get monthly purchases
        $monthlyPurchases = isDemo() ? 18500.00 : ((\App\Models\Purchase::where('created_by', $createdBy)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('total_amount') ?? 0) - (\App\Models\PurchaseReturn::where('created_by', $createdBy)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('total_amount') ?? 0));

        if (isDemo()) {
            $currentMonthSales = 24750.00;
        }

        // Get last 10 days data
        if (config('app.is_demo') !== true) {
            $last10DaysData = [];
            for ($i = 9; $i >= 0; $i--) {
                $date = now()->subDays($i);
                $dayName = $date->format('M d');
                $daySales = (\App\Models\Sale::where('created_by', $createdBy)
                    ->whereDate('created_at', $date)
                    ->sum('total_amount') ?? 0) - (\App\Models\SaleReturn::where('created_by', $createdBy)
                    ->whereDate('created_at', $date)
                    ->sum('total_amount') ?? 0);
                $dayPurchases = (\App\Models\Purchase::where('created_by', $createdBy)
                    ->whereDate('created_at', $date)
                    ->sum('total_amount') ?? 0) - (\App\Models\PurchaseReturn::where('created_by', $createdBy)
                    ->whereDate('created_at', $date)
                    ->sum('total_amount') ?? 0);
                $last10DaysData[] = [
                    'date' => $dayName,
                    'sales' => $daySales,
                    'purchases' => $dayPurchases,
                ];
            }
        }else{
            $last10DaysData = [];
            for ($i = 9; $i >= 0; $i--) {
                $date = now()->subDays($i);
                $dayName = $date->format('M d');
                $staticAmounts = [1200, 1450, 1100, 1800, 2100, 1650, 1900, 2300, 1750, 2500];
                $staticPurchases = [800, 950, 700, 1200, 1400, 1100, 1300, 1600, 1150, 1800];
                $last10DaysData[] = [
                    'date' => $dayName,
                    'sales' => $staticAmounts[9 - $i],
                    'purchases' => $staticPurchases[9 - $i],
                ];
            }
        }

        // Get recent transactions
        $createdBy = createdBy();
        $recentSales = \App\Models\Sale::where('created_by', $createdBy)
            ->orderBy('created_at', 'desc')
            ->limit(3)
            ->get()
            ->map(function ($sale) {
                return [
                    'type' => 'sale',
                    'reference' => $sale->sale_number,
                    'amount' => $sale->total_amount,
                    'date' => $sale->created_at,
                ];
            });

        $recentPurchases = \App\Models\Purchase::where('created_by', $createdBy)
            ->orderBy('created_at', 'desc')
            ->limit(3)
            ->get()
            ->map(function ($purchase) {
                return [
                    'type' => 'purchase',
                    'reference' => $purchase->purchase_number,
                    'amount' => $purchase->total_amount,
                    'date' => $purchase->created_at,
                ];
            });

        $recentTransactions = $recentSales->concat($recentPurchases)
            ->sortByDesc('date')
            ->take(6)
            ->values();

        // Get storage usage data
        $currentPlan = $user->getCurrentPlan();
        if (isDemo()) {
            $planStorageLimit = 5;
            $storageUsedBytes = ($planStorageLimit * 1024 * 1024 * 1024) / 4;
            $storageUsagePercentage = 25;
        } else {
            $storageUsedBytes = $user->getStorageUsage();
            $planStorageLimit = $currentPlan ? $currentPlan->storage_limit : 5;
            $storageUsagePercentage = $user->getStorageUsagePercentage();
        }

        // Plan overview usage
        $planOverview = [
            'plan_name'         => $currentPlan ? $currentPlan->name : 'No Plan',
            'customer_limit'    => $currentPlan ? (int) $currentPlan->total_customers : 0,
            'vendor_limit'      => $currentPlan ? (int) $currentPlan->total_vendors : 0,
            'user_limit'        => $currentPlan ? (int) $currentPlan->max_users : 0,
            'storage_limit_gb'  => $currentPlan ? (float) $currentPlan->storage_limit : 5,
            'customer_used'     => \App\Models\Customer::where('created_by', $createdBy)->count(),
            'vendor_used'       => \App\Models\Vendor::where('created_by', $createdBy)->count(),
            'user_used'         => \App\Models\User::where('created_by', $createdBy)->count(),
            'storage_used_bytes'=> $storageUsedBytes,
            'storage_used_pct'  => $storageUsagePercentage,
            'monthly_price'     => $currentPlan ? (float) $currentPlan->price : 0,
            'yearly_price'      => $currentPlan ? (float) $currentPlan->getPriceForCycle('yearly') : 0,
            'expire_date'       => $user->plan_expire_date ? $user->plan_expire_date->format('M d, Y') : null,
            'expire_days_left'  => $user->plan_expire_date ? max(0, (int) now()->diffInDays($user->plan_expire_date, false)) : null,
            'is_expired'        => $user->plan_expire_date ? $user->plan_expire_date < now() : false,
        ];

        // Get purchase chart data based on period
        $purchasePeriod = request('purchasePeriod', 'today');
        if (isDemo()) {
            $demoPurchaseMap = [
                'today' => [
                    ['label' => '00:00', 'purchases' => 90],  ['label' => '01:00', 'purchases' => 60],
                    ['label' => '02:00', 'purchases' => 40],  ['label' => '03:00', 'purchases' => 30],
                    ['label' => '04:00', 'purchases' => 35],  ['label' => '05:00', 'purchases' => 70],
                    ['label' => '06:00', 'purchases' => 180], ['label' => '07:00', 'purchases' => 320],
                    ['label' => '08:00', 'purchases' => 450], ['label' => '09:00', 'purchases' => 580],
                    ['label' => '10:00', 'purchases' => 640], ['label' => '11:00', 'purchases' => 710],
                    ['label' => '12:00', 'purchases' => 780], ['label' => '13:00', 'purchases' => 740],
                    ['label' => '14:00', 'purchases' => 670], ['label' => '15:00', 'purchases' => 720],
                    ['label' => '16:00', 'purchases' => 650], ['label' => '17:00', 'purchases' => 590],
                    ['label' => '18:00', 'purchases' => 490], ['label' => '19:00', 'purchases' => 400],
                    ['label' => '20:00', 'purchases' => 330], ['label' => '21:00', 'purchases' => 260],
                    ['label' => '22:00', 'purchases' => 180], ['label' => '23:00', 'purchases' => 110],
                ],
                '7d' => [
                    ['label' => now()->subDays(6)->format('M d'), 'purchases' => 1450],
                    ['label' => now()->subDays(5)->format('M d'), 'purchases' => 1980],
                    ['label' => now()->subDays(4)->format('M d'), 'purchases' => 1620],
                    ['label' => now()->subDays(3)->format('M d'), 'purchases' => 2340],
                    ['label' => now()->subDays(2)->format('M d'), 'purchases' => 1870],
                    ['label' => now()->subDays(1)->format('M d'), 'purchases' => 2650],
                    ['label' => now()->format('M d'),             'purchases' => 2200],
                ],
                '14d' => [
                    ['label' => now()->subDays(13)->format('M d'), 'purchases' => 980],
                    ['label' => now()->subDays(12)->format('M d'), 'purchases' => 1280],
                    ['label' => now()->subDays(11)->format('M d'), 'purchases' => 1100],
                    ['label' => now()->subDays(10)->format('M d'), 'purchases' => 1560],
                    ['label' => now()->subDays(9)->format('M d'),  'purchases' => 1740],
                    ['label' => now()->subDays(8)->format('M d'),  'purchases' => 1430],
                    ['label' => now()->subDays(7)->format('M d'),  'purchases' => 1920],
                    ['label' => now()->subDays(6)->format('M d'),  'purchases' => 1450],
                    ['label' => now()->subDays(5)->format('M d'),  'purchases' => 1980],
                    ['label' => now()->subDays(4)->format('M d'),  'purchases' => 1620],
                    ['label' => now()->subDays(3)->format('M d'),  'purchases' => 2340],
                    ['label' => now()->subDays(2)->format('M d'),  'purchases' => 1870],
                    ['label' => now()->subDays(1)->format('M d'),  'purchases' => 2650],
                    ['label' => now()->format('M d'),              'purchases' => 2200],
                ],
                '30d' => [
                    ['label' => now()->subDays(29)->format('M d'), 'purchases' => 780],
                    ['label' => now()->subDays(28)->format('M d'), 'purchases' => 950],
                    ['label' => now()->subDays(27)->format('M d'), 'purchases' => 720],
                    ['label' => now()->subDays(26)->format('M d'), 'purchases' => 1100],
                    ['label' => now()->subDays(25)->format('M d'), 'purchases' => 1250],
                    ['label' => now()->subDays(24)->format('M d'), 'purchases' => 890],
                    ['label' => now()->subDays(23)->format('M d'), 'purchases' => 1380],
                    ['label' => now()->subDays(22)->format('M d'), 'purchases' => 980],
                    ['label' => now()->subDays(21)->format('M d'), 'purchases' => 1280],
                    ['label' => now()->subDays(20)->format('M d'), 'purchases' => 1100],
                    ['label' => now()->subDays(19)->format('M d'), 'purchases' => 1560],
                    ['label' => now()->subDays(18)->format('M d'), 'purchases' => 1740],
                    ['label' => now()->subDays(17)->format('M d'), 'purchases' => 1430],
                    ['label' => now()->subDays(16)->format('M d'), 'purchases' => 1920],
                    ['label' => now()->subDays(15)->format('M d'), 'purchases' => 1150],
                    ['label' => now()->subDays(14)->format('M d'), 'purchases' => 1380],
                    ['label' => now()->subDays(13)->format('M d'), 'purchases' => 980],
                    ['label' => now()->subDays(12)->format('M d'), 'purchases' => 1280],
                    ['label' => now()->subDays(11)->format('M d'), 'purchases' => 1100],
                    ['label' => now()->subDays(10)->format('M d'), 'purchases' => 1560],
                    ['label' => now()->subDays(9)->format('M d'),  'purchases' => 1740],
                    ['label' => now()->subDays(8)->format('M d'),  'purchases' => 1430],
                    ['label' => now()->subDays(7)->format('M d'),  'purchases' => 1920],
                    ['label' => now()->subDays(6)->format('M d'),  'purchases' => 1450],
                    ['label' => now()->subDays(5)->format('M d'),  'purchases' => 1980],
                    ['label' => now()->subDays(4)->format('M d'),  'purchases' => 1620],
                    ['label' => now()->subDays(3)->format('M d'),  'purchases' => 2340],
                    ['label' => now()->subDays(2)->format('M d'),  'purchases' => 1870],
                    ['label' => now()->subDays(1)->format('M d'),  'purchases' => 2650],
                    ['label' => now()->format('M d'),              'purchases' => 2200],
                ],
            ];
            $purchaseChartData = $demoPurchaseMap[$purchasePeriod] ?? $demoPurchaseMap['7d'];
        } else {
            $purchaseChartData = [];
            if ($purchasePeriod === 'today') {
                for ($h = 0; $h < 24; $h++) {
                    $amount = (\App\Models\Purchase::where('created_by', $createdBy)
                        ->whereDate('created_at', now())
                        ->whereRaw('HOUR(created_at) = ?', [$h])
                        ->sum('total_amount') ?? 0) - (\App\Models\PurchaseReturn::where('created_by', $createdBy)
                        ->whereDate('created_at', now())
                        ->whereRaw('HOUR(created_at) = ?', [$h])
                        ->sum('total_amount') ?? 0);
                    $purchaseChartData[] = ['label' => str_pad($h, 2, '0', STR_PAD_LEFT) . ':00', 'purchases' => max(0, $amount)];
                }
            } else {
                $days = $purchasePeriod === '14d' ? 14 : ($purchasePeriod === '30d' ? 30 : 7);
                for ($i = $days - 1; $i >= 0; $i--) {
                    $date   = now()->subDays($i);
                    $amount = (\App\Models\Purchase::where('created_by', $createdBy)
                        ->whereDate('created_at', $date)
                        ->sum('total_amount') ?? 0) - (\App\Models\PurchaseReturn::where('created_by', $createdBy)
                        ->whereDate('created_at', $date)
                        ->sum('total_amount') ?? 0);
                    $purchaseChartData[] = ['label' => $date->format('M d'), 'purchases' => max(0, $amount)];
                }
            }
        }

        // Get sales chart data based on period
        $salesPeriod = request('salesPeriod', 'today');
        if (isDemo()) {
            $demoMap = [
                'today' => [
                    ['label' => '00:00', 'sales' => 120], ['label' => '01:00', 'sales' => 80],
                    ['label' => '02:00', 'sales' => 60],  ['label' => '03:00', 'sales' => 45],
                    ['label' => '04:00', 'sales' => 55],  ['label' => '05:00', 'sales' => 90],
                    ['label' => '06:00', 'sales' => 210], ['label' => '07:00', 'sales' => 380],
                    ['label' => '08:00', 'sales' => 520], ['label' => '09:00', 'sales' => 680],
                    ['label' => '10:00', 'sales' => 750], ['label' => '11:00', 'sales' => 820],
                    ['label' => '12:00', 'sales' => 910], ['label' => '13:00', 'sales' => 870],
                    ['label' => '14:00', 'sales' => 790], ['label' => '15:00', 'sales' => 840],
                    ['label' => '16:00', 'sales' => 760], ['label' => '17:00', 'sales' => 690],
                    ['label' => '18:00', 'sales' => 580], ['label' => '19:00', 'sales' => 470],
                    ['label' => '20:00', 'sales' => 390], ['label' => '21:00', 'sales' => 310],
                    ['label' => '22:00', 'sales' => 220], ['label' => '23:00', 'sales' => 150],
                ],
                '7d' => [
                    ['label' => now()->subDays(6)->format('M d'), 'sales' => 1850],
                    ['label' => now()->subDays(5)->format('M d'), 'sales' => 2340],
                    ['label' => now()->subDays(4)->format('M d'), 'sales' => 1920],
                    ['label' => now()->subDays(3)->format('M d'), 'sales' => 2780],
                    ['label' => now()->subDays(2)->format('M d'), 'sales' => 2150],
                    ['label' => now()->subDays(1)->format('M d'), 'sales' => 3100],
                    ['label' => now()->format('M d'),             'sales' => 2650],
                ],
                '14d' => [
                    ['label' => now()->subDays(13)->format('M d'), 'sales' => 1200],
                    ['label' => now()->subDays(12)->format('M d'), 'sales' => 1580],
                    ['label' => now()->subDays(11)->format('M d'), 'sales' => 1350],
                    ['label' => now()->subDays(10)->format('M d'), 'sales' => 1900],
                    ['label' => now()->subDays(9)->format('M d'),  'sales' => 2100],
                    ['label' => now()->subDays(8)->format('M d'),  'sales' => 1750],
                    ['label' => now()->subDays(7)->format('M d'),  'sales' => 2300],
                    ['label' => now()->subDays(6)->format('M d'),  'sales' => 1850],
                    ['label' => now()->subDays(5)->format('M d'),  'sales' => 2340],
                    ['label' => now()->subDays(4)->format('M d'),  'sales' => 1920],
                    ['label' => now()->subDays(3)->format('M d'),  'sales' => 2780],
                    ['label' => now()->subDays(2)->format('M d'),  'sales' => 2150],
                    ['label' => now()->subDays(1)->format('M d'),  'sales' => 3100],
                    ['label' => now()->format('M d'),              'sales' => 2650],
                ],
                '30d' => [
                    ['label' => now()->subDays(29)->format('M d'), 'sales' => 980],
                    ['label' => now()->subDays(28)->format('M d'), 'sales' => 1150],
                    ['label' => now()->subDays(27)->format('M d'), 'sales' => 870],
                    ['label' => now()->subDays(26)->format('M d'), 'sales' => 1320],
                    ['label' => now()->subDays(25)->format('M d'), 'sales' => 1480],
                    ['label' => now()->subDays(24)->format('M d'), 'sales' => 1100],
                    ['label' => now()->subDays(23)->format('M d'), 'sales' => 1650],
                    ['label' => now()->subDays(22)->format('M d'), 'sales' => 1200],
                    ['label' => now()->subDays(21)->format('M d'), 'sales' => 1580],
                    ['label' => now()->subDays(20)->format('M d'), 'sales' => 1350],
                    ['label' => now()->subDays(19)->format('M d'), 'sales' => 1900],
                    ['label' => now()->subDays(18)->format('M d'), 'sales' => 2100],
                    ['label' => now()->subDays(17)->format('M d'), 'sales' => 1750],
                    ['label' => now()->subDays(16)->format('M d'), 'sales' => 2300],
                    ['label' => now()->subDays(15)->format('M d'), 'sales' => 1420],
                    ['label' => now()->subDays(14)->format('M d'), 'sales' => 1680],
                    ['label' => now()->subDays(13)->format('M d'), 'sales' => 1200],
                    ['label' => now()->subDays(12)->format('M d'), 'sales' => 1580],
                    ['label' => now()->subDays(11)->format('M d'), 'sales' => 1350],
                    ['label' => now()->subDays(10)->format('M d'), 'sales' => 1900],
                    ['label' => now()->subDays(9)->format('M d'),  'sales' => 2100],
                    ['label' => now()->subDays(8)->format('M d'),  'sales' => 1750],
                    ['label' => now()->subDays(7)->format('M d'),  'sales' => 2300],
                    ['label' => now()->subDays(6)->format('M d'),  'sales' => 1850],
                    ['label' => now()->subDays(5)->format('M d'),  'sales' => 2340],
                    ['label' => now()->subDays(4)->format('M d'),  'sales' => 1920],
                    ['label' => now()->subDays(3)->format('M d'),  'sales' => 2780],
                    ['label' => now()->subDays(2)->format('M d'),  'sales' => 2150],
                    ['label' => now()->subDays(1)->format('M d'),  'sales' => 3100],
                    ['label' => now()->format('M d'),              'sales' => 2650],
                ],
            ];
            $salesChartData = $demoMap[$salesPeriod] ?? $demoMap['7d'];
        } else {
            $salesChartData = [];
            if ($salesPeriod === 'today') {
                for ($h = 0; $h < 24; $h++) {
                    $amount = (\App\Models\Sale::where('created_by', $createdBy)
                        ->whereDate('created_at', now())
                        ->whereRaw('HOUR(created_at) = ?', [$h])
                        ->sum('total_amount') ?? 0) - (\App\Models\SaleReturn::where('created_by', $createdBy)
                        ->whereDate('created_at', now())
                        ->whereRaw('HOUR(created_at) = ?', [$h])
                        ->sum('total_amount') ?? 0);
                    $salesChartData[] = ['label' => str_pad($h, 2, '0', STR_PAD_LEFT) . ':00', 'sales' => max(0, $amount)];
                }
            } else {
                $days = $salesPeriod === '14d' ? 14 : ($salesPeriod === '30d' ? 30 : 7);
                for ($i = $days - 1; $i >= 0; $i--) {
                    $date   = now()->subDays($i);
                    $amount = (\App\Models\Sale::where('created_by', $createdBy)
                        ->whereDate('created_at', $date)
                        ->sum('total_amount') ?? 0) - (\App\Models\SaleReturn::where('created_by', $createdBy)
                        ->whereDate('created_at', $date)
                        ->sum('total_amount') ?? 0);
                    $salesChartData[] = ['label' => $date->format('M d'), 'sales' => max(0, $amount)];
                }
            }
        }

        // Get top 10 products by total sales quantity
        $topProducts = \App\Models\Product::where('products.created_by', $createdBy)
            ->join('sale_items', 'products.id', '=', 'sale_items.product_id')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.created_by', $createdBy)
            ->selectRaw('products.id, products.name, products.image, products.sku, products.selling_price, products.stock_quantity, SUM(sale_items.quantity) as total_sold')
            ->groupBy('products.id', 'products.name', 'products.sku', 'products.selling_price', 'products.stock_quantity', 'products.image')
            ->orderByDesc('total_sold')
            ->limit(10)
            ->get()
            ->map(function ($product) {
                return [
                    'id'            => $product->id,
                    'name'          => $product->name,
                    'sku'           => $product->sku,
                    'selling_price' => $product->selling_price,
                    'stock_quantity'=> $product->stock_quantity,
                    'total_sold'    => (int) $product->total_sold,
                    'image'         => $product->image ?: null,
                ];
            });

        // Get low stock products (stock_quantity < min_stock_level)
        $lowStockProducts = \App\Models\Product::where('created_by', $createdBy)
            ->whereColumn('stock_quantity', '<', 'min_stock_level')
            ->orderBy('stock_quantity', 'asc')
            ->limit(10)
            ->get()
            ->map(function ($product) {
                return [
                    'id'              => $product->id,
                    'name'            => $product->name,
                    'sku'             => $product->sku,
                    'stock_quantity'  => $product->stock_quantity,
                    'min_stock_level' => $product->min_stock_level,
                    'image'           => $product->image ?: null,
                ];
            });

        // Get category wise sales data
        $categoryWiseSales = [];
        if (isDemo())
        {
            $demoSalesAmounts = [12450, 9800, 7650, 14200, 6300, 11100, 8750, 5400, 13600, 4900];
            $categories = \App\Models\Category::where('created_by',$createdBy);
            $categoryWiseSales = $categories->withCount('products')->get()->map(function ($category, $index) use ($demoSalesAmounts) {
                return [
                    'name'          => $category->name,
                    'total_sales'   => $demoSalesAmounts[$index % count($demoSalesAmounts)],
                    'product_count' => $category->products_count,
                ];
            });
        } else {
        $categoryWiseSales = \App\Models\Category::where('categories.created_by', $createdBy)
            ->join('products', 'categories.id', '=', 'products.category_id')
            ->join('sale_items', 'products.id', '=', 'sale_items.product_id')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.created_by', $createdBy)
            ->selectRaw('categories.id, categories.name, SUM(sale_items.line_total) as total_sales')
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('total_sales')
            ->get()
            ->map(function ($cat) {
                return [
                    'name'        => $cat->name,
                    'total_sales' => (float) $cat->total_sales,
                ];
            });
        }


        // Get recent sale returns (last 10)
        $recentSaleReturns = \App\Models\SaleReturn::where('created_by', $createdBy)
            ->with('customer:id,name,email')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($r) {
                return [
                    'id'            => $r->id,
                    'return_number' => $r->return_number,
                    'customer'      => $r->customer?->name ?? 'Walk-in Customer',
                    'customer_email'=> $r->customer?->email,
                    'total_amount'  => $r->total_amount,
                    'status'        => $r->status,
                    'return_date'   => $r->return_date?->toISOString() ?? $r->created_at->toISOString(),
                ];
            });

        // Get recent purchase returns (last 10)
        $recentPurchaseReturns = \App\Models\PurchaseReturn::where('created_by', $createdBy)
            ->with('vendor:id,name,email')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($r) {
                return [
                    'id'            => $r->id,
                    'return_number' => $r->return_number,
                    'vendor'        => $r->vendor?->name ?? '-',
                    'vendor_email'  => $r->vendor?->email ?? '-',
                    'total_amount'  => $r->total_amount,
                    'status'        => $r->status,
                    'return_date'   => $r->return_date?->toISOString() ?? $r->created_at->toISOString(),
                ];
            });

        // Get recent customers (last 10)
        $recentCustomers = \App\Models\Customer::where('created_by', $createdBy)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($customer) {
                return [
                    'id'         => $customer->id,
                    'name'       => $customer->name,
                    'email'      => $customer->email,
                    'phone'      => $customer->phone,
                    'status'     => $customer->status ?? 'active',
                    'created_at' => $customer->created_at->diffForHumans(),
                ];
            });

        // Get recent vendors (last 10)
        $recentVendors = \App\Models\Vendor::where('created_by', $createdBy)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($vendor) {
                return [
                    'id'           => $vendor->id,
                    'name'         => $vendor->name,
                    'company_name' => $vendor->company_name,
                    'email'        => $vendor->email,
                    'phone'        => $vendor->phone,
                    'status'       => $vendor->status ?? 'active',
                    'created_at'   => $vendor->created_at->diffForHumans(),
                ];
            });

        // Sales heatmap: last 7 days × 24 hours
        if (isDemo()) {
            $demoHeatmap = [];
            $days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
            $busyHours = [8,9,10,11,12,13,14,15,16,17,18,19,20,21];
            foreach ($days as $di => $dayName) {
                for ($h = 0; $h < 24; $h++) {
                    $isBusy = in_array($h, $busyHours);
                    $base = $isBusy ? rand(2, 12) : rand(0, 2);
                    if ($di === 2 && $h === 8)  $base = 18;
                    if ($di === 2 && $h === 21) $base = 16;
                    $demoHeatmap[] = [
                        'day'          => $dayName,
                        'day_index'    => $di,
                        'hour'         => $h,
                        'transactions' => $base,
                        'items_sold'   => $base * rand(2, 5),
                        'total_amount' => round($base * rand(50, 200), 2),
                    ];
                }
            }
            $salesHeatmap = $demoHeatmap;
        } else {
            $salesHeatmap = [];
            $dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
            for ($di = 6; $di >= 0; $di--) {
                $date    = now()->subDays($di);
                $dayIdx  = (int)$date->format('N') - 1; // 0=Mon..6=Sun
                $dayName = $dayNames[$dayIdx];
                for ($h = 0; $h < 24; $h++) {
                    $transactions = \App\Models\Sale::where('created_by', $createdBy)
                        ->whereDate('created_at', $date)
                        ->whereRaw('HOUR(created_at) = ?', [$h])
                        ->count();
                    $itemsSold = \App\Models\SaleItem::whereHas('sale', function ($q) use ($createdBy, $date, $h) {
                        $q->where('created_by', $createdBy)
                          ->whereDate('created_at', $date)
                          ->whereRaw('HOUR(created_at) = ?', [$h]);
                    })->sum('quantity');
                    $totalAmount = \App\Models\Sale::where('created_by', $createdBy)
                        ->whereDate('created_at', $date)
                        ->whereRaw('HOUR(created_at) = ?', [$h])
                        ->sum('total_amount') ?? 0;
                    $salesHeatmap[] = [
                        'day'          => $dayName,
                        'day_index'    => $dayIdx,
                        'hour'         => $h,
                        'transactions' => (int) $transactions,
                        'items_sold'   => (int) $itemsSold,
                        'total_amount' => (float) $totalAmount,
                    ];
                }
            }
        }

        // Get active notifications
        $activeNotifications = Notification::where('created_by', $createdBy)
            ->currentlyActive()
            ->orderBy('created_at', 'desc')
            ->get();

        $dashboardData = [
            'stats' => [
                'totalProducts' => $totalProducts,
                'totalSales' => $totalSales,
                'totalPurchases' => $totalPurchases,
                'totalCustomers' => $totalCustomers,
                'monthlyGrowth' => $monthlyGrowth,
                'monthlySales' => $currentMonthSales,
                'monthlyPurchases' => $monthlyPurchases,
                'todaySales' => $todaySales,
                'todayPurchases' => $todayPurchases,
                'totalExpenses' => $totalExpenses,
                'totalVendors' => $totalVendors,
                'outOfStockItems' => $outOfStockItems,
                'lowStockItems' => $lowStockItems,
                'last10DaysData' => $last10DaysData,
                'recentTransactions' => $recentTransactions,
                'storageUsedBytes' => $storageUsedBytes,
                'planStorageLimit' => $planStorageLimit,
                'storageUsagePercentage' => $storageUsagePercentage,
            ],
            'recentCustomers'       => $recentCustomers,
            'recentVendors'         => $recentVendors,
            'topProducts'           => $topProducts,
            'lowStockProducts'      => $lowStockProducts,
            'salesChartData'        => $salesChartData,
            'salesPeriod'           => $salesPeriod,
            'purchaseChartData'     => $purchaseChartData,
            'purchasePeriod'        => $purchasePeriod,
            'recentSaleReturns'     => $recentSaleReturns,
            'recentPurchaseReturns' => $recentPurchaseReturns,
            'categoryWiseSales'     => $categoryWiseSales,
            'notifications'         => $activeNotifications,
            'planOverview'          => $planOverview,
            'salesHeatmap'          => $salesHeatmap,
        ];

        return Inertia::render('dashboard', [
            'dashboardData' => $dashboardData
        ]);
    }
}
