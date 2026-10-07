<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Vendor;
use App\Models\Product;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Events\PurchaseCreated;

class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        $query = Purchase::with(['vendor', 'items.product'])->where('created_by', createdBy());

        if ($request->has('search') && !empty($request->search)) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('purchase_number', 'like', '%' . $searchTerm . '%')
                  ->orWhereHas('vendor', function($vendorQuery) use ($searchTerm) {
                      $vendorQuery->where('name', 'like', '%' . $searchTerm . '%');
                  })
                  ->orWhereHas('items.product', function($productQuery) use ($searchTerm) {
                      $productQuery->where('name', 'like', '%' . $searchTerm . '%');
                  })
                  ->orWhere('purchase_date', 'like', '%' . $searchTerm . '%');
            });
        }

        if ($request->has('status') && $request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('vendor_id') && $request->vendor_id && $request->vendor_id !== 'all') {
            $query->where('vendor_id', $request->vendor_id);
        }

        if ($request->has('purchase_date_from') && $request->purchase_date_from) {
            $query->whereDate('purchase_date', '>=', $request->purchase_date_from);
        }

        if ($request->has('purchase_date_to') && $request->purchase_date_to) {
            $query->whereDate('purchase_date', '<=', $request->purchase_date_to);
        }

        // Handle sorting with validation
        $allowedSortFields = ['purchase_number', 'purchase_date', 'total_amount', 'status', 'created_at', 'updated_at'];
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        
        // Validate sort field
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }
        
        // Validate sort direction
        $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'desc';
        
        $query->orderBy($sortField, $sortDirection);

        // Handle pagination with validation
        $perPage = $request->input('per_page', 10);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }
        
        $purchases = $query->paginate($perPage);
        $vendors = Vendor::where('created_by', createdBy())->where('status', 'active')->get(['id', 'name']);
        $products = Product::with('taxes')->where('created_by', createdBy())->where('status', 'active')->get(['id', 'name', 'purchase_price']);

        // Stats query with same filters (except status) for filter-aware tab counts
        $statsQuery = Purchase::where('created_by', createdBy());
        if ($request->has('search') && !empty($request->search)) {
            $searchTerm = $request->search;
            $statsQuery->where(function($q) use ($searchTerm) {
                $q->where('purchase_number', 'like', '%' . $searchTerm . '%')
                  ->orWhereHas('vendor', function($vendorQuery) use ($searchTerm) {
                      $vendorQuery->where('name', 'like', '%' . $searchTerm . '%');
                  })
                  ->orWhereHas('items.product', function($productQuery) use ($searchTerm) {
                      $productQuery->where('name', 'like', '%' . $searchTerm . '%');
                  })
                  ->orWhere('purchase_date', 'like', '%' . $searchTerm . '%');
            });
        }
        if ($request->has('vendor_id') && $request->vendor_id && $request->vendor_id !== 'all') {
            $statsQuery->where('vendor_id', $request->vendor_id);
        }
        if ($request->has('purchase_date_from') && $request->purchase_date_from) {
            $statsQuery->whereDate('purchase_date', '>=', $request->purchase_date_from);
        }
        if ($request->has('purchase_date_to') && $request->purchase_date_to) {
            $statsQuery->whereDate('purchase_date', '<=', $request->purchase_date_to);
        }

        $statusCounts = [
            'total'    => (clone $statsQuery)->count(),
            'active'   => (clone $statsQuery)->where('status', 'active')->count(),
            'inactive' => (clone $statsQuery)->where('status', 'inactive')->count(),
        ];

        $globalStatsQuery = Purchase::where('created_by', createdBy());
        $stats = [
            'total_purchases'       => (clone $globalStatsQuery)->count(),
            'active_purchases'      => (clone $globalStatsQuery)->where('status', 'active')->count(),
            'inactive_purchases'    => (clone $globalStatsQuery)->where('status', 'inactive')->count(),
            'total_purchase_amount' => (float) (clone $globalStatsQuery)->sum('total_amount'),
            'this_month_count'      => (clone $globalStatsQuery)->whereYear('purchase_date', now()->year)->whereMonth('purchase_date', now()->month)->count(),
            'this_month_amount'     => (float) (clone $globalStatsQuery)->whereYear('purchase_date', now()->year)->whereMonth('purchase_date', now()->month)->sum('total_amount'),
        ];

        return Inertia::render('purchases/index', [
            'purchases' => array_merge($purchases->toArray(), ['stats' => $stats]),
            'vendors' => $vendors,
            'products' => $products,
            'statusCounts' => $statusCounts,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
                'vendor_id' => $request->vendor_id ?? '',
                'purchase_date_from' => $request->purchase_date_from ?? '',
                'purchase_date_to' => $request->purchase_date_to ?? '',
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function show(Purchase $purchase)
    {
        if ($purchase->created_by != createdBy()) {
            abort(403, 'Unauthorized access to purchase details.');
        }

        $purchase->load(['vendor', 'items.product.taxes', 'creator']);

        // Resolve creator avatar to full URL
        if ($purchase->creator && $purchase->creator->avatar) {
            $purchase->creator->avatar = check_file($purchase->creator->avatar) ? get_file($purchase->creator->avatar) : get_file('avatars/avatar.png');
        }

        $userId = createdBy();
        $companyInfo = [
            'name'      => getSetting('companyName', '', $userId),
            'address'   => getSetting('companyAddress', '', $userId),
            'city'      => getSetting('companyCity', '', $userId),
            'state'     => getSetting('companyState', '', $userId),
            'zip'       => getSetting('companyZipCode', '', $userId),
            'country'   => getSetting('companyCountry', '', $userId),
            'phone'     => getSetting('companyTelephone', '', $userId),
            'email'     => getSetting('companyEmail', '', $userId),
        ];

        return Inertia::render('purchases/show', [
            'purchase'    => $purchase,
            'companyInfo' => $companyInfo,
        ]);
    }

    public function create()
    {
        $vendors = Vendor::where('created_by', createdBy())->where('status', 'active')->get(['id', 'name', 'company_name', 'email', 'phone', 'billing_address', 'billing_city', 'billing_country']);
        $products = Product::with('taxes')->where('created_by', createdBy())->where('status', 'active')->get(['id', 'name', 'sku', 'purchase_price', 'image']);

        return Inertia::render('purchases/create', [
            'vendors' => $vendors,
            'products' => $products,
        ]);
    }

    public function edit(Purchase $purchase)
    {
        if ($purchase->created_by != createdBy()) {
            abort(403, 'Unauthorized access.');
        }

        $purchase->load(['items.product.taxes']);

        $vendors  = Vendor::where('created_by', createdBy())->where('status', 'active')->get(['id', 'name', 'company_name', 'email', 'phone', 'billing_address', 'billing_city', 'billing_country']);
        $products = Product::with('taxes')->where('created_by', createdBy())->where('status', 'active')->get(['id', 'name', 'sku', 'purchase_price', 'image']);

        return Inertia::render('purchases/edit', [
            'purchase' => $purchase,
            'vendors'  => $vendors,
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'vendor_id'              => 'required|exists:vendors,id',
            'purchase_date'          => 'required|date',
            'items'                  => 'required|array|min:1',
            'items.*.product_id'     => 'required|exists:products,id',
            'items.*.quantity'       => 'required|integer|min:1',
            'items.*.unit_price'     => 'required|numeric|min:0',
            'items.*.tax_amount'     => 'nullable|numeric|min:0',
            'items.*.taxes'          => 'nullable|array',
            'notes'                  => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $subtotal   = $item['quantity'] * $item['unit_price'];
                $taxAmount  = $item['tax_amount'] ?? 0;
                $totalAmount += $subtotal + $taxAmount;
            }

            $purchase = Purchase::create([
                'created_by'    => createdBy(),
                'vendor_id'     => $validated['vendor_id'],
                'purchase_date' => $validated['purchase_date'],
                'total_amount'  => $totalAmount,
                'status'        => 'active',
                'notes'         => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $taxAmount = $item['tax_amount'] ?? 0;
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id'  => $item['product_id'],
                    'quantity'    => $item['quantity'],
                    'unit_price'  => $item['unit_price'],
                    'total_price' => ($item['quantity'] * $item['unit_price']) + $taxAmount,
                    'tax_amount'  => $taxAmount,
                    'taxes'       => $item['taxes'] ?? [],
                ]);

                $product = Product::find($item['product_id']);
                if ($product) {
                    $product->increment('stock_quantity', $item['quantity']);
                }
            }

            // Send notification
            // $notificationService = app(NotificationService::class);
            // $vendor = Vendor::find($validated['vendor_id']);
            // $data = [
            //     'vendor_name' => $vendor->name,
            //     'vendor_email' => $vendor->email ?? '',
            //     'purchase_reference' => $purchase->purchase_number,
            //     'user_name' => auth()->user()->name ?? auth()->user()->company_name ?? '',
            //     'app_name' => config('app.name')
            // ];

            // Fire PurchaseCreate event for notifications
            if (!config('app.is_demo', true)) {
                try {
                    // $notificationService->sendNotification('new_purchase', $data, $vendor->email);
                    event(new PurchaseCreated($purchase->load('vendor', 'creator')));

                } catch (\Exception $e) {
                    \Log::error('Purchase notification failed: ' . $e->getMessage());
                }
            }

        });

        return redirect()->route('purchases.index')->with('success', __('Purchase created successfully.'));
    }

    public function update(Request $request, $purchaseId)
    {
        $purchase = Purchase::find($purchaseId);
        if (!$purchase) {
            return redirect()->back()->with('error', __('Purchase not found.'));
        }

        $validated = $request->validate([
                'vendor_id'          => 'required|exists:vendors,id',
                'purchase_date'      => 'required|date',
                'items'              => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity'   => 'required|integer|min:1',
                'items.*.unit_price' => 'required|numeric|min:0',
                'items.*.tax_amount' => 'nullable|numeric|min:0',
                'items.*.taxes'      => 'nullable|array',
                'notes'              => 'nullable|string',
            ]);

        try {
            DB::transaction(function () use ($purchase, $validated) {
                foreach ($purchase->items as $oldItem) {
                    $product = Product::find($oldItem->product_id);
                    if ($product) {
                        $product->decrement('stock_quantity', $oldItem->quantity);
                    }
                }

                $totalAmount = 0;
                foreach ($validated['items'] as $item) {
                    $taxAmount   = $item['tax_amount'] ?? 0;
                    $totalAmount += ($item['quantity'] * $item['unit_price']) + $taxAmount;
                }

                $purchase->update([
                    'vendor_id'     => $validated['vendor_id'],
                    'purchase_date' => $validated['purchase_date'],
                    'total_amount'  => $totalAmount,
                    'notes'         => $validated['notes'] ?? null,
                ]);

                $purchase->items()->delete();

                foreach ($validated['items'] as $item) {
                    $taxAmount = $item['tax_amount'] ?? 0;
                    PurchaseItem::create([
                        'purchase_id' => $purchase->id,
                        'product_id'  => $item['product_id'],
                        'quantity'    => $item['quantity'],
                        'unit_price'  => $item['unit_price'],
                        'total_price' => ($item['quantity'] * $item['unit_price']) + $taxAmount,
                        'tax_amount'  => $taxAmount,
                        'taxes'       => $item['taxes'] ?? [],
                    ]);

                    $product = Product::find($item['product_id']);
                    if ($product) {
                        $product->increment('stock_quantity', $item['quantity']);
                    }
                }
            });

            if ($request->expectsJson() || $request->ajax() || $request->wantsJson()) {
                return redirect()->route('purchases.index')->with('success', __('Purchase updated successfully'));
            }
            return redirect()->route('purchases.index')->with('success', __('Purchase updated successfully'));
        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->ajax() || $request->wantsJson()) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update purchase'));
            }
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update purchase'));
        }
    }

    public function destroy($purchaseId)
    {
        $purchase = Purchase::find($purchaseId);
        if (!$purchase) {
            return response()->json(['message' => __('Purchase not found.')], 404);
        }

        try {
            // Revert stock quantities before deleting
            foreach ($purchase->items as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $product->decrement('stock_quantity', $item->quantity);
                }
            }

            $purchase->items()->delete();
            $purchase->delete();

            return response()->json(['message' => __('Purchase deleted successfully.')]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage() ?: __('Failed to delete purchase')], 500);
        }
    }

    public function toggleStatus(Purchase $purchase)
    {
        if ($purchase) {
            try {
                $purchase->status = $purchase->status === 'active' ? 'inactive' : 'active';
                $purchase->save();

                return response()->json(['message' => __('Purchase status updated successfully')]);
            } catch (\Exception $e) {
                return response()->json(['message' => $e->getMessage() ?: __('Failed to update purchase status')], 500);
            }
        } else {
            return response()->json(['message' => __('Purchase Not Found.')], 404);
        }
    }

    public function fileExport()
    {
        try {
            $name = 'purchases_' . date('Y-m-d_H-i-s');
            return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\PurchaseExport(), $name . '.xlsx');
        } catch (\Exception $e) {
            \Log::error('Purchase export failed: ' . $e->getMessage());
            return response()->json(['error' => 'Export failed: ' . $e->getMessage()], 500);
        }
    }

    public function export(Request $request)
    {
        try {
            $filename = 'purchases_export_' . date('Y-m-d_H-i-s') . '.xlsx';
            return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\PurchaseExport($request), $filename);
        } catch (\Exception $e) {
            \Log::error('Purchase export failed: ' . $e->getMessage());
            return response()->json(['error' => 'Export failed: ' . $e->getMessage()], 500);
        }
    }
}
