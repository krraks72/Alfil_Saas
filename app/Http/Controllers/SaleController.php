<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Customer;
use App\Models\CashRegister;
use App\Models\PosSession;
use App\Models\PosCart;
use App\Models\Setting;
use App\Services\AliaddoInvoiceException;
use App\Services\AliaddoInvoiceService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class SaleController extends Controller
{
    public function store(Request $request)
    {
        try {
            $request->validate([
                'customer_id' => 'nullable|exists:customers,id',
                'cash_register_id' => 'required|exists:cash_registers,id',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_price' => 'required|numeric|min:0',
                'payment_method' => ['nullable', Rule::in(['cash', 'card', 'digital_wallet', 'bank_transfer', 'mixed'])],
                'paid_amount' => 'nullable|numeric|min:0',
                'discount_amount' => 'nullable|numeric|min:0',
            ]);

            $saleId = DB::transaction(function () use ($request) {
                $user = auth()->user();

                // Ensure cash register belongs to the company
                $cashRegister = CashRegister::where('created_by', createdBy())
                    ->findOrFail($request->cash_register_id);

                // Ensure customer belongs to the company (nullable for walk-in)
                $customer = null;
                if ($request->customer_id) {
                    $customer = Customer::where('created_by', createdBy())
                        ->findOrFail($request->customer_id);
                }

                // Validate stock availability and ensure products belong to company
                foreach ($request->items as $item) {
                    $product = Product::where('created_by', createdBy())
                        ->findOrFail($item['product_id']);
                    if ($product->stock_quantity < $item['quantity']) {
                        throw new \Exception(__('Insufficient stock for product') . ": {$product->name}");
                    }
                }

                // Calculate totals
                $subtotal = 0;
                $totalTax = 0;
                $saleItems = [];

                foreach ($request->items as $item) {
                    $product = Product::where('created_by', createdBy())
                        ->with('taxes')->findOrFail($item['product_id']);
                    $lineSubtotal = $item['quantity'] * $item['unit_price'];

                    // Calculate tax for this line item
                    $lineTax = 0;
                    foreach ($product->taxes as $tax) {
                        if ($tax->type === 'percentage') {
                            $lineTax += ($lineSubtotal * $tax->rate / 100);
                        } else { // fixed
                            $lineTax += ($tax->rate * $item['quantity']);
                        }
                    }

                    $lineTotal = $lineSubtotal + $lineTax;
                    $subtotal += $lineSubtotal;
                    $totalTax += $lineTax;

                    // Calculate combined tax rate for display (percentage taxes only)
                    $displayTaxRate = $product->taxes->where('type', 'percentage')->sum('rate');

                    $saleItems[] = [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'product_sku' => $product->sku,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'tax_rate' => $displayTaxRate,
                        'tax_amount' => $lineTax,
                        'discount_amount' => 0, // Individual item discounts can be added later
                        'line_total' => $lineTotal,
                    ];
                }

                $discountAmount = $request->discount_amount ?? 0;
                $totalAmount = $subtotal + $totalTax - $discountAmount;
                // Default payment method to cash; default paid amount to total
                $paymentMethod = $request->payment_method ?? 'cash';
                $paidAmount = $request->paid_amount ?? $totalAmount;
                $changeAmount = max(0, $paidAmount - $totalAmount);

                // Create sale
                $sale = Sale::create([
                    'created_by' => createdBy(),
                    'branch_id' => $cashRegister->branch_id,
                    'cash_register_id' => $request->cash_register_id,
                    'customer_id' => $request->customer_id ?? null,
                    'subtotal' => $subtotal,
                    'tax_amount' => $totalTax,
                    'discount_amount' => $discountAmount,
                    'total_amount' => $totalAmount,
                    'paid_amount' => $paidAmount,
                    'change_amount' => $changeAmount,
                    'payment_method' => $paymentMethod,
                    'status' => 'completed',
                    'notes' => $request->notes,
                    'payment_details' => $request->payment_details,
                ]);

                // Create sale items and update stock
                foreach ($saleItems as $saleItem) {
                    $saleItem['sale_id'] = $sale->id;
                    SaleItem::create($saleItem);

                    // Update product stock - ensure company filtering and stock maintenance
                    $product = Product::where('created_by', createdBy())
                        ->findOrFail($saleItem['product_id']);

                    // Calculate new stock and update
                    $oldStock = $product->stock_quantity;
                    $newStock = max(0, $oldStock - $saleItem['quantity']);

                    // Update stock using direct database update
                    Product::where('id', $saleItem['product_id'])
                        ->where('created_by', createdBy())
                        ->update(['stock_quantity' => $newStock]);
                }

                // Update cash register balance for cash payments
                if ($paymentMethod === 'cash') {
                    $cashRegister->increment('current_balance', $totalAmount);
                }

                // Update POS session statistics
                $activeSession = PosSession::forUser($user->id)
                    ->forCashRegister($request->cash_register_id)
                    ->active()
                    ->first();

                if ($activeSession) {
                    $activeSession->increment('total_sales');
                    $activeSession->increment('total_sales_amount', $totalAmount);

                    // Mark the active cart as completed and remove its items
                    $activeCart = PosCart::forSession($activeSession->id)
                        ->forCompany(createdBy())
                        ->active()
                        ->first();

                    if ($activeCart) {
                        $activeCart->items()->delete();
                        $activeCart->delete();
                    }
                }

                // Send notification
                // $notificationService = app(NotificationService::class);
                // $data = [
                //     'customer_name' => $customer->name,
                //     'customer_email' => $customer->email ?? '',
                //     'sale_reference' => $sale->sale_number,
                //     'user_name' => auth()->user()->name ?? auth()->user()->company_name ?? '',
                //     'app_name' => config('app.name')
                // ];


                if (!config('app.is_demo', true)) {
                    try {
                        // $notificationService->sendNotification('new_sales', $data, $customer->email);
                        event(new \App\Events\SaleCreate($sale->load('customer', 'creator')));
                    } catch (\Exception $e) {
                        \Log::error('Sale notification failed: ' . $e->getMessage());
                    }
                }

                return $sale->id;
            });

            $warning = null;
            try {
                app(AliaddoInvoiceService::class)->issueForSale(Sale::findOrFail($saleId));
            } catch (AliaddoInvoiceException $exception) {
                $warning = $exception->getMessage();
            }

            $redirect = redirect()->back()->with('success', __('Sale completed successfully'));

            return $warning
                ? $redirect->with('warning', __('The sale was completed, but its electronic invoice was not issued: :reason', ['reason' => $warning]))
                : $redirect;
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to complete sale'));
        }
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        
        // Set default year and month to actual current date (not system date)
        $actualCurrentYear = date('Y');
        $actualCurrentMonth = date('m');
        
        $year = $request->get('year', $actualCurrentYear);
        $month = $request->get('month', $actualCurrentMonth);
        
        $query = Sale::where('created_by', createdBy())
            ->with(['customer', 'branch', 'cashRegister.branch', 'items', 'creator' => function($query) {
                $query->with(['creator' => function($subQuery) {
                    $subQuery->where('type', 'company');
                }]);
            }]);

        if (!IsDemo()) {
            if ($year) {
                $query->whereYear('sale_date', $year);
            }
            if ($month) {
                $query->whereMonth('sale_date', $month);
            }
        }

        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('sale_date', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('sale_date', '<=', $request->date_to);
        }

        if ($request->has('branch_id') && $request->branch_id) {
            $query->whereHas('cashRegister', function($cashRegisterQuery) use ($request) {
                $cashRegisterQuery->where('branch_id', $request->branch_id);
            });
        }

        if ($request->has('customer_id') && $request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('cash_register_id') && $request->cash_register_id) {
            $query->where('cash_register_id', $request->cash_register_id);
        }

        if ($request->has('payment_method') && $request->payment_method) {
            $query->where('payment_method', $request->payment_method);
        }

        if ($request->has('search') && $request->search) {
            $query->where(function($q) use ($request) {
                $q->where('sale_number', 'like', '%' . $request->search . '%')
                  ->orWhereHas('customer', function($customerQuery) use ($request) {
                      $customerQuery->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        $allowedSortFields = ['sale_number', 'sale_date', 'total_amount', 'paid_amount', 'payment_method', 'payment_status', 'status', 'created_at', 'updated_at'];
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');

        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }

        $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'desc';

        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->input('per_page', 10);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }

        // Calculate statistics for current filtered period (year/month, skipped in demo mode)
        $statsQuery = Sale::where('created_by', createdBy());
        if (!IsDemo()) {
            $statsQuery->whereYear('sale_date', $year)
                       ->whereMonth('sale_date', $month);
        }
            
        $salesStats = [
            'totalSales' => $statsQuery->count(),
            'totalRevenue' => $statsQuery->sum('total_amount'),
            'totalCustomers' => Customer::where('created_by', createdBy())->count(),
            'avgOrderValue' => $statsQuery->count() > 0 ? $statsQuery->sum('total_amount') / $statsQuery->count() : 0
        ];

        // For web requests, return Inertia response
        if ($request->wantsJson()) {
            $sales = $query->paginate($perPage);
            return response()->json($sales);
        }

        $sales = $query->paginate($perPage);

        // Get branches and customers for filter dropdowns
        $branches = \App\Models\Branch::where('created_by', createdBy())->get();
        $customers = \App\Models\Customer::where('created_by', createdBy())
            ->where('status', 'active')
            ->get();

        return \Inertia\Inertia::render('sales/index', [
            'sales' => $sales,
            'branches' => $branches,
            'customers' => $customers,
            'salesStats' => $salesStats,
            'filters' => [
                'search' => $request->search ?? '',
                'year' => (string) $year, // Ensure it's a string
                'month' => (string) $month, // Ensure it's a string
                'date_from' => $request->date_from ?? '',
                'date_to' => $request->date_to ?? '',
                'branch_id' => $request->branch_id ?? '',
                'customer_id' => $request->customer_id ?? '',
                'cash_register_id' => $request->cash_register_id ?? '',
                'payment_method' => $request->payment_method ?? '',
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
            ]
        ]);
    }

    public function show(Sale $sale)
    {
        // Ensure sale belongs to the company
        if ($sale->created_by !== createdBy()) {
            abort(403, __('Unauthorized access to sale.'));
        }

        return response()->json(
            $sale->load(['items.product', 'customer', 'branch', 'cashRegister.branch', 'creator' => function($query) {
                $query->with(['creator' => function($subQuery) {
                    $subQuery->where('type', 'company');
                }]);
            }])
        );
    }



    public function fileExport(Request $request)
    {
        // Get the same filters used in the index method
        $year = $request->get('year', date('Y'));
        $month = $request->get('month', date('m'));
        
        // Build query with same filters as index method
        $query = Sale::where('created_by', createdBy())
            ->with(['customer', 'branch', 'cashRegister.branch', 'items']);

        // Apply year and month filters (skip in demo mode)
        if (!IsDemo()) {
            if ($year) {
                $query->whereYear('sale_date', $year);
            }
            if ($month) {
                $query->whereMonth('sale_date', $month);
            }
        }

        // Apply other filters if provided
        if ($request->has('search') && $request->search) {
            $query->where(function($q) use ($request) {
                $q->where('sale_number', 'like', '%' . $request->search . '%')
                  ->orWhereHas('customer', function($customerQuery) use ($request) {
                      $customerQuery->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        if ($request->has('branch_id') && $request->branch_id) {
            $query->whereHas('cashRegister', function($cashRegisterQuery) use ($request) {
                $cashRegisterQuery->where('branch_id', $request->branch_id);
            });
        }

        if ($request->has('customer_id') && $request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('payment_method') && $request->payment_method) {
            $query->where('payment_method', $request->payment_method);
        }

        // Order by creation date
        $query->orderBy('created_at', 'desc');

        try {
            // Generate filename with year and month for clarity
            $filename = 'sales_' . $year . '_' . str_pad($month, 2, '0', STR_PAD_LEFT) . '_' . date('Y-m-d_H-i-s');
            
            // Pass the filtered query to the export class
            return \Maatwebsite\Excel\Facades\Excel::download(
                new \App\Exports\SaleExport($query), 
                $filename . '.xlsx'
            );
        } catch (\Exception $e) {
            \Log::error('Sales export failed: ' . $e->getMessage());
            return response()->json(['error' => 'Export failed: ' . $e->getMessage()], 500);
        }
    }
}
