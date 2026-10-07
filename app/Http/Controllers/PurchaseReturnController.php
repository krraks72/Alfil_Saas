<?php

namespace App\Http\Controllers;

use App\Models\PurchaseReturn;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Vendor;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Events\PurchaseReturnCreated;

class PurchaseReturnController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseReturn::with(['purchase', 'vendor', 'branch', 'creator', 'items.product'])
            ->where('created_by', createdBy());

        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('return_number', 'like', '%' . $request->search . '%')
                  ->orWhereHas('vendor', function ($vendor) use ($request) {
                      $vendor->where('name', 'like', '%' . $request->search . '%');
                  })
                  ->orWhereHas('purchase', function ($purchase) use ($request) {
                      $purchase->where('purchase_number', 'like', '%' . $request->search . '%');
                  });
            });
        }

        if ($request->has('status') && $request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('branch_id') && $request->branch_id && $request->branch_id !== 'all') {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('vendor_id') && $request->vendor_id && $request->vendor_id !== 'all') {
            $query->where('vendor_id', $request->vendor_id);
        }

        if ($request->has('return_date_from') && $request->return_date_from) {
            $query->whereDate('return_date', '>=', $request->return_date_from);
        }

        if ($request->has('return_date_to') && $request->return_date_to) {
            $query->whereDate('return_date', '<=', $request->return_date_to);
        }

        // Handle sorting with validation
        $allowedSortFields = ['return_number', 'return_date', 'total_amount','grand_total', 'status', 'created_at', 'updated_at'];
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
        
        $purchaseReturns = $query->paginate($perPage);

        // Filtered status counts for tabs (respects search/branch/vendor/date filters, but NOT status filter)
        $countsQuery = PurchaseReturn::where('created_by', createdBy());

        if ($request->has('search') && !empty($request->search)) {
            $countsQuery->where(function ($q) use ($request) {
                $q->where('return_number', 'like', '%' . $request->search . '%')
                  ->orWhereHas('vendor', function ($vendor) use ($request) {
                      $vendor->where('name', 'like', '%' . $request->search . '%');
                  })
                  ->orWhereHas('purchase', function ($purchase) use ($request) {
                      $purchase->where('purchase_number', 'like', '%' . $request->search . '%');
                  });
            });
        }

        if ($request->has('branch_id') && $request->branch_id && $request->branch_id !== 'all') {
            $countsQuery->where('branch_id', $request->branch_id);
        }

        if ($request->has('vendor_id') && $request->vendor_id && $request->vendor_id !== 'all') {
            $countsQuery->where('vendor_id', $request->vendor_id);
        }

        if ($request->has('return_date_from') && $request->return_date_from) {
            $countsQuery->whereDate('return_date', '>=', $request->return_date_from);
        }

        if ($request->has('return_date_to') && $request->return_date_to) {
            $countsQuery->whereDate('return_date', '<=', $request->return_date_to);
        }

        $statusCounts = [
            'total'    => (clone $countsQuery)->count(),
            'pending'  => (clone $countsQuery)->where('status', 'pending')->count(),
            'approved' => (clone $countsQuery)->where('status', 'approved')->count(),
            'rejected' => (clone $countsQuery)->where('status', 'rejected')->count(),
        ];

        // Build stats for KPI cards
        $statsQuery = PurchaseReturn::where('created_by', createdBy());

        $stats = [
            'total_returns'       => (clone $statsQuery)->count(),
            'pending_returns'     => (clone $statsQuery)->where('status', 'pending')->count(),
            'approved_returns'    => (clone $statsQuery)->where('status', 'approved')->count(),
            'rejected_returns'    => (clone $statsQuery)->where('status', 'rejected')->count(),
            'total_return_amount' => (float) (clone $statsQuery)->sum('grand_total'),
        ];

        $purchases = Purchase::with(['vendor', 'items.product'])
            ->where('created_by', createdBy())
            ->where('status', 'active')
            ->get();

        $vendors = Vendor::where('created_by', createdBy())->get();
        $branches = Branch::where('created_by', createdBy())->get();

        return Inertia::render('purchase-returns/index', [
            'purchaseReturns' => array_merge($purchaseReturns->toArray(), ['stats' => $stats]),
            'statusCounts' => $statusCounts,
            'purchases' => $purchases,
            'vendors' => $vendors,
            'branches' => $branches,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
                'branch_id' => $request->branch_id ?? '',
                'vendor_id' => $request->vendor_id ?? '',
                'return_date_from' => $request->return_date_from ?? '',
                'return_date_to' => $request->return_date_to ?? '',
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
            ],
        ]);
    }



    public function store(Request $request)
    {
        $validated = $request->validate([
            'purchase_id' => 'required|exists:purchases,id',
            'branch_id' => 'required|exists:branches,id',
            'return_date' => 'required|date',
            'reason' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.purchase_item_id' => 'required|exists:purchase_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        try {
            DB::beginTransaction();

            // Get purchase and vendor info
            $purchase = Purchase::findOrFail($validated['purchase_id']);

            $totalAmount = 0;
            $totalTaxAmount = 0;

            // Calculate totals
            foreach ($validated['items'] as $item) {
                $itemTotal = $item['quantity'] * $item['unit_price'];
                $taxAmount = $itemTotal * ($item['tax_rate'] ?? 0) / 100;
                $totalAmount += $itemTotal;
                $totalTaxAmount += $taxAmount;
            }

            $purchaseReturn = PurchaseReturn::create([
                'purchase_id' => $validated['purchase_id'],
                'vendor_id' => $purchase->vendor_id,
                'branch_id' => $validated['branch_id'],
                'return_date' => $validated['return_date'],
                'reason' => $validated['reason'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'total_amount' => $totalAmount,
                'tax_amount' => $totalTaxAmount,
                'grand_total' => $totalAmount + $totalTaxAmount,
                'created_by' => createdBy(),
            ]);

            // Validate and create return items
            foreach ($validated['items'] as $item) {
                $purchaseItem = \App\Models\PurchaseItem::findOrFail($item['purchase_item_id']);

                // Check if return quantity exceeds purchased quantity
                if ($item['quantity'] > $purchaseItem->quantity) {
                    throw new \Exception(__("Cannot return :qty units of :product. Maximum available: :max", [
                        'qty' => $item['quantity'],
                        'product' => $purchaseItem->product->name ?? 'Unknown Product',
                        'max' => $purchaseItem->quantity
                    ]));
                }

                $itemTotal = $item['quantity'] * $item['unit_price'];
                $taxAmount = $itemTotal * ($item['tax_rate'] ?? 0) / 100;

                $purchaseReturn->items()->create([
                    'product_id' => $item['product_id'],
                    'purchase_item_id' => $item['purchase_item_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $itemTotal,
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'tax_amount' => $taxAmount,
                ]);
            }

            // Fire PurchaseReturnCreated event for email notifications
            if (!config('app.is_demo', true)) {
                try {
                    event(new PurchaseReturnCreated($purchaseReturn->load('purchase.vendor')));
                } catch (\Exception $e) {
                    \Log::error('Purchase return email notification failed: ' . $e->getMessage());
                }
            }

            DB::commit();
            return redirect()->back()->with('success', __('Purchase return created successfully'));

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to create purchase return'));
        }
    }

    public function create()
    {
        $purchases = Purchase::with(['vendor', 'items.product.taxes'])
            ->where('created_by', createdBy())
            ->where('status', 'active')
            ->get()
            ->map(function ($purchase) {
                $purchase->items->each(function ($item) {
                    $returnedQty = \App\Models\PurchaseReturnItem::whereHas('purchaseReturn', function ($q) {
                        $q->where('status', '!=', 'rejected');
                    })->where('purchase_item_id', $item->id)->sum('quantity');
                    $item->returned_quantity = $returnedQty;
                });
                return $purchase;
            });

        $branches = Branch::where('created_by', createdBy())->get();

        return Inertia::render('purchase-returns/create', [
            'purchases' => $purchases,
            'branches'  => $branches,
        ]);
    }

    public function show(PurchaseReturn $purchaseReturn)
    {
        if ($purchaseReturn->created_by !== createdBy()) {
            abort(403, 'Unauthorized access to purchase return.');
        }

        $purchaseReturn->load(['purchase', 'vendor', 'branch', 'creator', 'items.product.taxes', 'items.purchaseItem']);

        if ($purchaseReturn->creator && $purchaseReturn->creator->avatar) {
            $purchaseReturn->creator->avatar = check_file($purchaseReturn->creator->avatar) ? get_file($purchaseReturn->creator->avatar) : get_file('avatars/avatar.png');
        }

        $userId = createdBy();
        $companyInfo = [
            'name'    => getSetting('companyName', '', $userId),
            'address' => getSetting('companyAddress', '', $userId),
            'city'    => getSetting('companyCity', '', $userId),
            'state'   => getSetting('companyState', '', $userId),
            'zip'     => getSetting('companyZipCode', '', $userId),
            'country' => getSetting('companyCountry', '', $userId),
            'phone'   => getSetting('companyTelephone', '', $userId),
            'email'   => getSetting('companyEmail', '', $userId),
        ];

        return Inertia::render('purchase-returns/show', [
            'purchaseReturn' => $purchaseReturn,
            'companyInfo'    => $companyInfo,
        ]);
    }

    public function edit(PurchaseReturn $purchaseReturn)
    {
        if ($purchaseReturn->created_by !== createdBy()) {
            abort(403, 'Unauthorized access to purchase return.');
        }

        $purchaseReturn->load(['purchase', 'vendor', 'branch', 'items.product.taxes', 'items.purchaseItem']);

        $purchases = Purchase::with(['vendor', 'items.product.taxes'])
            ->where('created_by', createdBy())
            ->where('status', 'active')
            ->get()
            ->map(function ($purchase) use ($purchaseReturn) {
                $purchase->items->each(function ($item) use ($purchaseReturn) {
                    $returnedQty = \App\Models\PurchaseReturnItem::whereHas('purchaseReturn', function ($q) use ($purchaseReturn) {
                        $q->where('status', '!=', 'rejected')
                          ->where('id', '!=', $purchaseReturn->id);
                    })->where('purchase_item_id', $item->id)->sum('quantity');
                    $item->returned_quantity = $returnedQty;
                });
                return $purchase;
            });

        $branches = Branch::where('created_by', createdBy())->get();

        return Inertia::render('purchase-returns/edit', [
            'purchaseReturn' => $purchaseReturn,
            'purchases'      => $purchases,
            'branches'       => $branches,
        ]);
    }

    public function update(Request $request, PurchaseReturn $purchaseReturn)
    {
        // Simple status update for approved and rejected returns
        if (in_array($purchaseReturn->status, ['approved', 'rejected']) && $request->has('status')) {
            $validated = $request->validate([
                'status' => 'required|in:approved,rejected'
            ]);

            try {
                $oldStatus = $purchaseReturn->status;
                $purchaseReturn->update(['status' => $validated['status']]);

                // Handle stock adjustments based on status change
                if ($oldStatus === 'approved' && $validated['status'] === 'rejected') {
                    // Restore stock (was previously reduced when approved)
                    foreach ($purchaseReturn->items as $returnItem) {
                        $product = $returnItem->product;
                        if ($product) {
                            $product->increment('stock_quantity', $returnItem->quantity);
                        }
                    }
                } elseif ($oldStatus === 'rejected' && $validated['status'] === 'approved') {
                    // Reduce stock (approving the return)
                    foreach ($purchaseReturn->items as $returnItem) {
                        $product = $returnItem->product;
                        if ($product) {
                            $product->decrement('stock_quantity', $returnItem->quantity);
                        }
                    }
                }

                return redirect()->back()->with('success', __('Purchase re  turn status updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update status'));
            }
        }

        // Full update for pending returns
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'return_date' => 'required|date',
            'reason' => 'nullable|string',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.purchase_item_id' => 'required|exists:purchase_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        try {
            DB::beginTransaction();

            $totalAmount = 0;
            $totalTaxAmount = 0;

            // Calculate totals
            foreach ($validated['items'] as $item) {
                $itemTotal = $item['quantity'] * $item['unit_price'];
                $taxAmount = $itemTotal * ($item['tax_rate'] ?? 0) / 100;
                $totalAmount += $itemTotal;
                $totalTaxAmount += $taxAmount;
            }

            // Update purchase return
            $purchaseReturn->update([
                'branch_id' => $validated['branch_id'],
                'return_date' => $validated['return_date'],
                'reason' => $validated['reason'],
                'notes' => $validated['notes'],
                'total_amount' => $totalAmount,
                'tax_amount' => $totalTaxAmount,
                'grand_total' => $totalAmount + $totalTaxAmount,
            ]);

            // Delete existing items and create new ones
            $purchaseReturn->items()->delete();

            foreach ($validated['items'] as $item) {
                $itemTotal = $item['quantity'] * $item['unit_price'];
                $taxAmount = $itemTotal * ($item['tax_rate'] ?? 0) / 100;

                $purchaseReturn->items()->create([
                    'product_id' => $item['product_id'],
                    'purchase_item_id' => $item['purchase_item_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $itemTotal,
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'tax_amount' => $taxAmount,
                ]);
            }

            DB::commit();
            return redirect()->back()->with('success', __('Purchase return updated successfully'));

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update purchase return'));
        }
    }

    public function destroy(PurchaseReturn $purchaseReturn)
    {

        try {
            $purchaseReturn->delete();
            return redirect()->back()->with('success', __('Purchase return deleted successfully'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete purchase return'));
        }
    }

    public function approve(PurchaseReturn $purchaseReturn)
    {
        try {
            DB::beginTransaction();

            // Update status to approved
            $purchaseReturn->update(['status' => 'approved']);

            // Reduce stock for each returned item
            foreach ($purchaseReturn->items as $returnItem) {
                $product = $returnItem->product;
                if ($product) {
                    // Reduce stock quantity (returning items to vendor)
                    $product->decrement('stock_quantity', $returnItem->quantity);
                }
            }

            DB::commit();

            return redirect()->back()->with('success', __('Purchase return approved successfully'));

        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to approve purchase return'));
        }
    }

    public function reject(PurchaseReturn $purchaseReturn)
    {
        try {
            $purchaseReturn->update(['status' => 'rejected']);

            return redirect()->back()->with('success', __('Purchase return rejected successfully'));

        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to reject purchase return'));
        }
    }
}
