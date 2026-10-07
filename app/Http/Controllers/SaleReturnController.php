<?php

namespace App\Http\Controllers;

use App\Models\SaleReturn;
use App\Models\SaleReturnItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Branch;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use App\Events\SaleReturnCreated;


class SaleReturnController extends Controller
{
    public function index(Request $request)
    {
        // Set default year and month to actual current date (not system date)
        $actualCurrentYear = date('Y');
        $actualCurrentMonth = date('m');
        
        $year = $request->get('year', $actualCurrentYear);
        $month = $request->get('month', $actualCurrentMonth);
        
        $query = SaleReturn::where('created_by', createdBy())
            ->with(['sale', 'customer', 'branch', 'items.product', 'creator']);

        // Apply year and month filters
        if (!IsDemo()) {
            if ($year) {
                $query->whereYear('return_date', $year);
            }

            if ($month) {
                $query->whereMonth('return_date', $month);
            }
        }

        if ($request->has('search') && $request->search) {
            $query->where(function($q) use ($request) {
                $q->where('return_number', 'like', '%' . $request->search . '%')
                  ->orWhereHas('sale', function($saleQuery) use ($request) {
                      $saleQuery->where('sale_number', 'like', '%' . $request->search . '%');
                  })
                  ->orWhereHas('customer', function($customerQuery) use ($request) {
                      $customerQuery->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('branch_id') && $request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('customer_id') && $request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        $allowedSortFields = ['return_number', 'return_date', 'total_amount', 'status', 'created_at', 'updated_at'];
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

        $saleReturns = $query->paginate($perPage);
        
        // Calculate system-wide statistics for dashboard cards
        $createdByFilter = createdBy();
        
        // Calculate statistics for current filtered period (year/month)
        $statsQuery = SaleReturn::where('created_by', $createdByFilter);

        // Only apply year filter if year is provided
        if (!isDemo()) {
            if ($year) {
                $statsQuery->whereYear('return_date', $year);
            }

            // Only apply month filter if both year and month are provided and not 'all'
            if ($month && $month !== 'all') {
                $statsQuery->whereMonth('return_date', $month);
            }
        }
        
        $stats = [
            'total_returns' => (clone $statsQuery)->count(),
            'pending_returns' => (clone $statsQuery)->where('status', 'pending')->count(),
            'approved_returns' => (clone $statsQuery)->where('status', 'approved')->count(),
            'rejected_returns' => (clone $statsQuery)->where('status', 'rejected')->count(),
            'total_return_amount' => (float) (clone $statsQuery)->sum('total_amount')
        ];
        
        $sales = Sale::where('created_by', createdBy())
            ->where('status', 'completed')
            ->with(['customer', 'branch', 'items.product.taxes'])
            ->get()
            ->map(function ($sale) {
                $sale->items->each(function ($item) {
                    // Calculate returned quantity for each sale item
                    $returnedQty = SaleReturnItem::whereHas('saleReturn', function($q) {
                        $q->where('status', '!=', 'rejected');
                    })->where('sale_item_id', $item->id)->sum('quantity');
                    
                    $item->returned_quantity = $returnedQty;
                    
                    // Add individual tax information if product has taxes
                    if ($item->product && $item->product->taxes) {
                        $productTaxes = $item->product->taxes->where('type', 'percentage');
                        $combinedTaxRate = $productTaxes->sum('rate');
                        
                        if ($combinedTaxRate == $item->tax_rate && $productTaxes->count() > 0) {
                            // Tax rate matches combined taxes - provide individual tax info
                            $item->individual_taxes = $productTaxes->map(function($tax) {
                                return [
                                    'name' => $tax->name,
                                    'rate' => $tax->rate
                                ];
                            })->values()->toArray();
                        } else {
                            // Fallback: try to match individual tax rates
                            $matchingTax = $productTaxes->where('rate', $item->tax_rate)->first();
                            if ($matchingTax) {
                                $item->individual_taxes = [[
                                    'name' => $matchingTax->name,
                                    'rate' => $matchingTax->rate
                                ]];
                            } else {
                                $item->individual_taxes = [];
                            }
                        }
                    } else {
                        $item->individual_taxes = [];
                    }
                });
                return $sale;
            })
            ->filter(function ($sale) {
                // Only include sales that have at least one item with available quantity for return
                return $sale->items->some(function ($item) {
                    $availableQty = $item->quantity - ($item->returned_quantity ?? 0);
                    return $availableQty > 0;
                });
            })
            ->values(); // Reset array keys after filtering
            
        $customers = Customer::where('created_by', createdBy())
            ->where('status', 'active')
            ->get();
            
        $branches = Branch::where('created_by', createdBy())
            ->get();

        return Inertia::render('sale-returns/index', [
            'saleReturns' => array_merge($saleReturns->toArray(), ['stats' => $stats]),
            'sales' => $sales,
            'customers' => $customers,
            'branches' => $branches,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
                'branch_id' => $request->branch_id ?? '',
                'customer_id' => $request->customer_id ?? '',
                'year' => (string) $year, // Ensure it's a string
                'month' => (string) $month, // Ensure it's a string
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
            ]
        ]);
    }

    public function create()
    {
        $sales = Sale::where('created_by', createdBy())
            ->where('status', 'completed')
            ->with(['customer', 'items.product.taxes'])
            ->orderBy('sale_date', 'desc')
            ->get()
            ->map(function ($sale) {
                $sale->items->each(function ($item) {
                    // Calculate returned quantity for each sale item
                    $returnedQty = SaleReturnItem::whereHas('saleReturn', function($q) {
                        $q->where('status', '!=', 'rejected');
                    })->where('sale_item_id', $item->id)->sum('quantity');
                    
                    $item->returned_quantity = $returnedQty;
                    
                    // Add individual tax information if product has taxes
                    if ($item->product && $item->product->taxes) {
                        $productTaxes = $item->product->taxes->where('type', 'percentage');
                        $combinedTaxRate = $productTaxes->sum('rate');
                        
                        if ($combinedTaxRate == $item->tax_rate && $productTaxes->count() > 0) {
                            // Tax rate matches combined taxes - provide individual tax info
                            $item->individual_taxes = $productTaxes->map(function($tax) {
                                return [
                                    'name' => $tax->name,
                                    'rate' => $tax->rate
                                ];
                            })->values()->toArray();
                        } else {
                            // Fallback: try to match individual tax rates
                            $matchingTax = $productTaxes->where('rate', $item->tax_rate)->first();
                            if ($matchingTax) {
                                $item->individual_taxes = [[
                                    'name' => $matchingTax->name,
                                    'rate' => $matchingTax->rate
                                ]];
                            } else {
                                $item->individual_taxes = [];
                            }
                        }
                    } else {
                        $item->individual_taxes = [];
                    }
                });
                return $sale;
            })
            ->filter(function ($sale) {
                // Only include sales that have at least one item with available quantity for return
                return $sale->items->some(function ($item) {
                    $availableQty = $item->quantity - ($item->returned_quantity ?? 0);
                    return $availableQty > 0;
                });
            })
            ->values(); // Reset array keys after filtering

        $customers = Customer::where('created_by', createdBy())
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        $branches = Branch::where('created_by', createdBy())
            ->get();

        return Inertia::render('sale-returns/create', [
            'sales' => $sales,
            'customers' => $customers,
            'branches' => $branches,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'branch_id' => 'required|exists:branches,id',
            'return_date' => 'required|date',
            'reason' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.sale_item_id' => 'required|exists:sale_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $sale = Sale::where('created_by', createdBy())->findOrFail($request->sale_id);

                // Validate items belong to the sale and have sufficient quantity
                foreach ($request->items as $item) {
                    $saleItem = SaleItem::where('sale_id', $sale->id)
                        ->where('id', $item['sale_item_id'])
                        ->where('product_id', $item['product_id'])
                        ->firstOrFail();

                    // Check if return quantity doesn't exceed sold quantity
                    $alreadyReturned = SaleReturnItem::whereHas('saleReturn', function($q) {
                        $q->where('status', '!=', 'rejected');
                    })->where('sale_item_id', $saleItem->id)->sum('quantity');

                    $availableQuantity = $saleItem->quantity - $alreadyReturned;
                    if ($item['quantity'] > $availableQuantity) {
                        throw new \Exception("Cannot return {$item['quantity']} units of {$saleItem->product_name}. Only {$availableQuantity} units available for return.");
                    }
                }

                // Calculate totals
                $subtotal = 0;
                $totalTax = 0;
                $returnItems = [];

                foreach ($request->items as $item) {
                    $saleItem = SaleItem::findOrFail($item['sale_item_id']);
                    $lineSubtotal = $item['quantity'] * $item['unit_price'];
                    $lineTax = ($lineSubtotal * $saleItem->tax_rate) / 100;
                    $lineTotal = $lineSubtotal + $lineTax;

                    $subtotal += $lineSubtotal;
                    $totalTax += $lineTax;

                    $returnItems[] = [
                        'product_id' => $item['product_id'],
                        'sale_item_id' => $item['sale_item_id'],
                        'product_name' => $saleItem->product_name,
                        'product_sku' => $saleItem->product_sku,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'tax_rate' => $saleItem->tax_rate,
                        'tax_amount' => $lineTax,
                        'line_total' => $lineTotal,
                    ];
                }

                $totalAmount = $subtotal + $totalTax;

                // Create sale return
                $saleReturn = SaleReturn::create([
                    'sale_id' => $request->sale_id,
                    'customer_id' => $sale->customer_id ?? null,
                    'branch_id' => $request->branch_id,
                    'return_date' => $request->return_date,
                    'created_by' => createdBy(),
                    'subtotal' => $subtotal,
                    'tax_amount' => $totalTax,
                    'total_amount' => $totalAmount,
                    'status' => 'pending',
                    'reason' => $request->reason,
                    'notes' => $request->notes,
                ]);

                // Create sale return items
                foreach ($returnItems as $returnItem) {
                    $returnItem['sale_return_id'] = $saleReturn->id;
                    SaleReturnItem::create($returnItem);
                }

                // Send notification
                $customer = $sale->customer_id ? Customer::find($sale->customer_id) : null;
                $data = [
                    'customer_name' => $customer->name ?? '',
                    'vendor_name' => '',
                    'return_note' => $request->reason ?? '',
                    'staff_note' => $request->notes ?? '',
                    'user_name' => auth()->user()->name ?? auth()->user()->company_name ?? '',
                    'app_name' => config('app.name')
                ];

                // Fire SaleReturnCreated event for email notifications
                // if (!config('app.is_demo', true)) {
                //     try {
                //         $notificationService->sendNotification('new_return', $data, $customer->email);
                //         event(new SaleReturnCreated($saleReturn->load('sale.customer')));
                //     } catch (\Exception $e) {
                //         \Log::error('Sale Return email notification failed: ' . $e->getMessage());
                //     }
                // }

            return redirect()->back()->with('success', __('Sale return created successfully'));
            });
        } catch (\Exception $e) {
                        return redirect()->back()->with('success', __('Failed to create sale return: :error', ['error' => $e->getMessage()]));
        }
    }

    public function show(SaleReturn $saleReturn)
    {
        if ($saleReturn->created_by !== createdBy()) {
            abort(403, 'Unauthorized access to sale return.');
        }

        // Load all necessary relationships for the show page including taxes
        $saleReturn->load([
            'sale.items.product.taxes', 
            'customer', 
            'branch', 
            'items.product.taxes', 
            'items.saleItem.product.taxes', 
            'creator'
        ]);
        
        // Add tax information to sale return items (same logic as edit method)
        if ($saleReturn->items) {
            $saleReturn->items->each(function ($returnItem) {
                if ($returnItem->saleItem && $returnItem->saleItem->product && $returnItem->saleItem->product->taxes) {
                    $productTaxes = $returnItem->saleItem->product->taxes->where('type', 'percentage');
                    $combinedTaxRate = $productTaxes->sum('rate');
                    
                    if ($combinedTaxRate == $returnItem->tax_rate && $productTaxes->count() > 0) {
                        // Tax rate matches combined taxes - provide individual tax info
                        $returnItem->individual_taxes = $productTaxes->map(function($tax) {
                            return [
                                'name' => $tax->name,
                                'rate' => $tax->rate
                            ];
                        })->values()->toArray();
                    } else {
                        // Fallback: try to match individual tax rates
                        $matchingTax = $productTaxes->where('rate', $returnItem->tax_rate)->first();
                        if ($matchingTax) {
                            $returnItem->individual_taxes = [[
                                'name' => $matchingTax->name,
                                'rate' => $returnItem->tax_rate
                            ]];
                        } else {
                            $returnItem->individual_taxes = [];
                        }
                    }
                } else {
                    $returnItem->individual_taxes = [];
                }
            });
        }

        // Resolve creator avatar to full URL
        if ($saleReturn->creator && $saleReturn->creator->avatar) {
            $saleReturn->creator->avatar = check_file($saleReturn->creator->avatar) ? get_file($saleReturn->creator->avatar) : get_file('avatars/avatar.png');
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

        return Inertia::render('sale-returns/show', [
            'saleReturn'  => $saleReturn,
            'companyInfo' => $companyInfo,
        ]);
    }

    public function edit(SaleReturn $saleReturn)
    {
        if ($saleReturn->created_by !== createdBy()) {
            abort(403, 'Unauthorized access to sale return.');
        }

        $sales = Sale::where('created_by', createdBy())
            ->where('status', 'completed')
            ->with(['customer', 'items.product.taxes'])
            ->orderBy('sale_date', 'desc')
            ->get()
            ->map(function ($sale) use ($saleReturn) {
                $sale->items->each(function ($item) use ($saleReturn) {
                    // Calculate returned quantity for each sale item (excluding current return being edited)
                    $returnedQty = SaleReturnItem::whereHas('saleReturn', function($q) use ($saleReturn) {
                        $q->where('status', '!=', 'rejected')
                          ->where('id', '!=', $saleReturn->id);
                    })->where('sale_item_id', $item->id)->sum('quantity');
                    
                    $item->returned_quantity = $returnedQty;
                    
                    // Add tax name based on tax rate if product has taxes
                    if ($item->product && $item->product->taxes) {
                        $productTaxes = $item->product->taxes->where('type', 'percentage');
                        $combinedTaxRate = $productTaxes->sum('rate');
                        
                        if ($combinedTaxRate == $item->tax_rate && $productTaxes->count() > 0) {
                            // Tax rate matches combined taxes - show all tax names
                            if ($productTaxes->count() > 1) {
                                $item->tax_name = $productTaxes->pluck('name')->implode(' + ');
                            } else {
                                $item->tax_name = $productTaxes->first()->name;
                            }
                        } else {
                            // Fallback: try to match individual tax rates
                            $matchingTax = $productTaxes->where('rate', $item->tax_rate)->first();
                            $item->tax_name = $matchingTax ? $matchingTax->name : null;
                        }
                    }
                });
                return $sale;
            })
            ->filter(function ($sale) {
                // Only include sales that have at least one item with available quantity for return
                return $sale->items->some(function ($item) {
                    $availableQty = $item->quantity - ($item->returned_quantity ?? 0);
                    return $availableQty > 0;
                });
            })
            ->values(); // Reset array keys after filtering

        $customers = Customer::where('created_by', createdBy())
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        $branches = Branch::where('created_by', createdBy())
            ->get();

        // Load the sale return with all necessary relationships
        $saleReturn->load(['sale.items.product.taxes', 'customer', 'items.product.taxes', 'items.saleItem.product.taxes']);
        
        // Add tax names to existing sale return items
        if ($saleReturn->items) {
            $saleReturn->items->each(function ($returnItem) {
                if ($returnItem->saleItem && $returnItem->saleItem->product && $returnItem->saleItem->product->taxes) {
                    $productTaxes = $returnItem->saleItem->product->taxes->where('type', 'percentage');
                    $combinedTaxRate = $productTaxes->sum('rate');
                    
                    if ($combinedTaxRate == $returnItem->tax_rate && $productTaxes->count() > 0) {
                        // Tax rate matches combined taxes - provide individual tax info
                        $returnItem->individual_taxes = $productTaxes->map(function($tax) {
                            return [
                                'name' => $tax->name,
                                'rate' => $tax->rate
                            ];
                        })->values()->toArray();
                    } else {
                        // Fallback: try to match individual tax rates
                        $matchingTax = $productTaxes->where('rate', $returnItem->tax_rate)->first();
                        if ($matchingTax) {
                            $returnItem->individual_taxes = [[
                                'name' => $matchingTax->name,
                                'rate' => $matchingTax->rate
                            ]];
                        } else {
                            $returnItem->individual_taxes = [];
                        }
                    }
                } else {
                    $returnItem->individual_taxes = [];
                }
            });
        }

        return Inertia::render('sale-returns/edit', [
            'saleReturn' => $saleReturn,
            'sales' => $sales,
            'customers' => $customers,
            'branches' => $branches,
        ]);
    }

    public function update(Request $request, SaleReturn $saleReturn)
    {
        if ($saleReturn->created_by !== createdBy()) {
            abort(403, 'Unauthorized access to sale return.');
        }

        // Handle status changes for approved/rejected returns
        if (in_array($saleReturn->status, ['approved', 'rejected'])) {
            $request->validate([
                'status' => ['required', Rule::in(['approved', 'rejected'])],
            ]);

            try {
                return DB::transaction(function () use ($request, $saleReturn) {
                    $oldStatus = $saleReturn->status;
                    $newStatus = $request->status;

                    // Handle stock adjustments based on status change
                    if ($oldStatus === 'approved' && $newStatus === 'rejected') {
                        // Remove stock (was previously added back)
                        foreach ($saleReturn->items as $item) {
                            $product = Product::where('id', $item->product_id)
                                ->where('created_by', createdBy())
                                ->first();
                            if ($product) {
                                $product->decrement('stock_quantity', $item->quantity);
                            }
                        }
                    } elseif ($oldStatus === 'rejected' && $newStatus === 'approved') {
                        // Add stock back (return to inventory)
                        foreach ($saleReturn->items as $item) {
                            $product = Product::where('id', $item->product_id)
                                ->where('created_by', createdBy())
                                ->first();
                            if ($product) {
                                $product->increment('stock_quantity', $item->quantity);
                            }
                        }
                    }

                    $saleReturn->update(['status' => $newStatus]);

                    return redirect()->back()->with('success', __('Sale return status updated successfully'));
                });
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update status'));
            }
        }

        // Handle full updates for pending returns
        if ($saleReturn->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending sale returns can be fully edited');
        }

        $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'customer_id' => 'nullable|exists:customers,id',
            'return_date' => 'required|date',
            'reason' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.sale_item_id' => 'required|exists:sale_items,id',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            return DB::transaction(function () use ($request, $saleReturn) {
                $sale = Sale::where('created_by', createdBy())->findOrFail($request->sale_id);

                // Validate items belong to the sale and have sufficient quantity
                foreach ($request->items as $item) {
                    $saleItem = SaleItem::where('sale_id', $sale->id)
                        ->where('id', $item['sale_item_id'])
                        ->where('product_id', $item['product_id'])
                        ->firstOrFail();

                    // Check if return quantity doesn't exceed sold quantity (excluding current return)
                    $alreadyReturned = SaleReturnItem::whereHas('saleReturn', function($q) use ($saleReturn) {
                        $q->where('status', '!=', 'rejected')
                          ->where('id', '!=', $saleReturn->id);
                    })->where('sale_item_id', $saleItem->id)->sum('quantity');

                    $availableQuantity = $saleItem->quantity - $alreadyReturned;
                    if ($item['quantity'] > $availableQuantity) {
                        throw new \Exception("Cannot return {$item['quantity']} units of {$saleItem->product_name}. Only {$availableQuantity} units available for return.");
                    }
                }

                // Calculate totals
                $subtotal = 0;
                $totalTax = 0;
                $returnItems = [];

                foreach ($request->items as $item) {
                    $saleItem = SaleItem::findOrFail($item['sale_item_id']);
                    $lineSubtotal = $item['quantity'] * $item['unit_price'];
                    $lineTax = ($lineSubtotal * $saleItem->tax_rate) / 100;
                    $lineTotal = $lineSubtotal + $lineTax;

                    $subtotal += $lineSubtotal;
                    $totalTax += $lineTax;

                    $returnItems[] = [
                        'product_id' => $item['product_id'],
                        'sale_item_id' => $item['sale_item_id'],
                        'product_name' => $saleItem->product_name,
                        'product_sku' => $saleItem->product_sku,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'tax_rate' => $saleItem->tax_rate,
                        'tax_amount' => $lineTax,
                        'line_total' => $lineTotal,
                    ];
                }

                $totalAmount = $subtotal + $totalTax;

                // Update sale return
                $saleReturn->update([
                    'sale_id' => $request->sale_id,
                    'customer_id' => $sale->customer_id ?? null,
                    'branch_id' => $sale->branch_id,
                    'subtotal' => $subtotal,
                    'tax_amount' => $totalTax,
                    'total_amount' => $totalAmount,
                    'reason' => $request->reason,
                    'notes' => $request->notes,
                ]);

                // Delete existing items and create new ones
                $saleReturn->items()->delete();
                foreach ($returnItems as $returnItem) {
                    $returnItem['sale_return_id'] = $saleReturn->id;
                    SaleReturnItem::create($returnItem);
                }

                return redirect()->back()->with('success', __('Sale return updated successfully'));
            });
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update sale return'));
        }
    }

    public function destroy(SaleReturn $saleReturn)
    {
        if ($saleReturn->created_by !== createdBy()) {
            abort(403, 'Unauthorized access to sale return.');
        }



        try {
            $saleReturn->delete();
            return redirect()->back()->with('success', __('Sale return deleted successfully'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete sale return'));
        }
    }

    public function approve(SaleReturn $saleReturn)
    {
        if ($saleReturn->created_by !== createdBy()) {
            abort(403, 'Unauthorized access to sale return.');
        }

        if ($saleReturn->status !== 'pending') {
            return response()->json(['message' => __('Only pending sale returns can be approved')], 400);
        }

        try {
            return DB::transaction(function () use ($saleReturn) {
                // Load items if not already loaded
                $saleReturn->load('items');
                
                // Add stock back to inventory
                foreach ($saleReturn->items as $item) {
                    $product = Product::where('id', $item->product_id)
                        ->where('created_by', createdBy())
                        ->first();
                    
                    if ($product) {
                        $product->increment('stock_quantity', $item->quantity);
                        \Log::info('Stock incremented for product: ' . $product->name . ' by ' . $item->quantity . ' units');
                    } else {
                        \Log::error('Product not found for stock increment: ' . $item->product_id);
                    }
                }

                $saleReturn->update(['status' => 'approved']);

                return redirect()->back()->with('success', __('Sale return approved successfully'));
            });
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to approve sale return'));
        }
    }

    public function reject(SaleReturn $saleReturn)
    {
        if ($saleReturn->created_by !== createdBy()) {
            abort(403, 'Unauthorized access to sale return.');
        }

        if ($saleReturn->status !== 'pending') {
            return response()->json(['message' => __('Only pending sale returns can be rejected')], 400);
        }

        $saleReturn->update(['status' => 'rejected']);

        return redirect()->back()->with('success', __('Sale return rejected successfully'));
    }

    public function fileExport(Request $request)
    {
        // Get the same filters used in the index method
        $year = $request->get('year', date('Y'));
        $month = $request->get('month', date('m'));
        
        // Build query with same filters as index method
        $query = SaleReturn::where('created_by', createdBy())
            ->with(['sale', 'customer', 'branch', 'items.product']);

        // Apply year and month filters
        if (!IsDemo()) {
            if ($year) {
                $query->whereYear('return_date', $year);
            }

            if ($month) {
                $query->whereMonth('return_date', $month);
            }
        }

        // Apply other filters if provided
        if ($request->has('search') && $request->search) {
            $query->where(function($q) use ($request) {
                $q->where('return_number', 'like', '%' . $request->search . '%')
                  ->orWhereHas('sale', function($saleQuery) use ($request) {
                      $saleQuery->where('sale_number', 'like', '%' . $request->search . '%');
                  })
                  ->orWhereHas('customer', function($customerQuery) use ($request) {
                      $customerQuery->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('branch_id') && $request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('customer_id') && $request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        // Order by creation date
        $query->orderBy('created_at', 'desc');

        try {
            // Generate filename with year and month for clarity
            $filename = 'sale_returns_' . $year . '_' . str_pad($month, 2, '0', STR_PAD_LEFT) . '_' . date('Y-m-d_H-i-s');
            
            // Pass the filtered query to the export class
            return \Maatwebsite\Excel\Facades\Excel::download(
                new \App\Exports\SaleReturnExport($query), 
                $filename . '.xlsx'
            );
        } catch (\Exception $e) {
            \Log::error('Sale Returns export failed: ' . $e->getMessage());
            return response()->json(['error' => 'Export failed: ' . $e->getMessage()], 500);
        }
    }
}
