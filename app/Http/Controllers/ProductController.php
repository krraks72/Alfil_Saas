<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Unit;
use App\Models\Tax;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'brand', 'unit', 'taxes'])->where('created_by', createdBy());

        if ($request->has('search') && !empty($request->search)) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('sku', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        // Apply status filter
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Apply category filter
        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category_id', $request->category);
        }

        // Apply brand filter
        if ($request->has('brand') && $request->brand !== 'all') {
            $query->where('brand_id', $request->brand);
        }

        // Handle sorting with validation
        $allowedSortFields = ['name', 'sku', 'purchase_price', 'selling_price', 'stock_quantity', 'status', 'created_at', 'updated_at'];
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        if (config('app.is_demo'))
        {
            $sortDirection = $request->input('sort_direction', 'asc');
        }
        
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
        
        $products = $query->paginate($perPage)->withQueryString();
        $categories = Category::where('created_by', createdBy())->where('status', 'active')->get(['id', 'name']);
        $brands = Brand::where('created_by', createdBy())->where('status', 'active')->get(['id', 'name']);
        $units = Unit::where('created_by', createdBy())->where('status', 'active')->get(['id', 'name']);
        $taxes = Tax::where('created_by', createdBy())->where('status', 'active')->get(['id', 'name', 'rate', 'type']);

        $statsQuery = Product::where('created_by', createdBy());

        if ($request->has('search') && !empty($request->search)) {
            $statsQuery->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('sku', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('category') && $request->category !== 'all') {
            $statsQuery->where('category_id', $request->category);
        }

        if ($request->has('brand') && $request->brand !== 'all') {
            $statsQuery->where('brand_id', $request->brand);
        }

        $baseQuery = Product::where('created_by', createdBy());
        $productStats = [
            'totalProducts'    => (clone $baseQuery)->count(),
            'activeProducts'   => (clone $baseQuery)->where('status', 'active')->count(),
            'inactiveProducts' => (clone $baseQuery)->where('status', 'inactive')->count(),
            'outOfStock'       => (clone $baseQuery)->where('stock_quantity', '<=', 0)->count(),
            'lowStock'         => (clone $baseQuery)->where('stock_quantity', '>', 0)->whereColumn('stock_quantity', '<=', 'min_stock_level')->count(),
            'tabCounts' => [
                'total'    => (clone $statsQuery)->count(),
                'active'   => (clone $statsQuery)->where('status', 'active')->count(),
                'inactive' => (clone $statsQuery)->where('status', 'inactive')->count(),
            ],
        ];

        return Inertia::render('products/index', [
            'products' => $products,
            'categories' => $categories,
            'brands' => $brands,
            'units' => $units,
            'taxes' => $taxes,
            'productStats' => $productStats,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? 'all',
                'category' => $request->category ?? 'all',
                'brand' => $request->brand ?? 'all',
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        $categories = Category::where('created_by', createdBy())->where('status', 'active')->get(['id', 'name']);
        $brands     = Brand::where('created_by', createdBy())->where('status', 'active')->get(['id', 'name']);
        $units      = Unit::where('created_by', createdBy())->where('status', 'active')->get(['id', 'name']);
        $taxes      = Tax::where('created_by', createdBy())->where('status', 'active')->get(['id', 'name', 'rate', 'type']);

        return Inertia::render('products/create', compact('categories', 'brands', 'units', 'taxes'));
    }

    public function show($productId)
    {
        $product = Product::with(['category', 'brand', 'unit', 'taxes'])
            ->where('id', $productId)
            ->where('created_by', createdBy())
            ->firstOrFail();

        $now        = now();
        $current30  = $now->copy()->subDays(30);
        $previous30 = $now->copy()->subDays(60);
        $isDemo     = (bool) config('app.is_demo');

        if ($isDemo) {
            // In demo mode anchor the window to the most recent sale date for this product
            // so the table always has data and dates always fall within the shown period.
            $latestSaleDate = \App\Models\SaleItem::where('product_id', $productId)
                ->whereHas('sale', fn($q) => $q->where('created_by', createdBy()))
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->max('sales.sale_date');

            if ($latestSaleDate) {
                $anchor    = \Carbon\Carbon::parse($latestSaleDate);
                $current30  = $anchor->copy()->subDays(30);
                $previous30 = $anchor->copy()->subDays(60);
            }
        }

        $recentSales = \App\Models\SaleItem::with(['sale.customer'])
            ->where('product_id', $productId)
            ->whereHas('sale', function ($q) use ($current30) {
                $q->where('created_by', createdBy())
                  ->where('sale_date', '>=', $current30);
            })
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($item) {
                return [
                    'sale_date'       => $item->sale->sale_date,
                    'sale_number'     => $item->sale->sale_number,
                    'customer_name'   => $item->sale->customer->name ?? '-',
                    'customer_email'   => $item->sale->customer->email ?? '-',
                    'quantity'        => $item->quantity,
                    'unit_price'      => $item->unit_price,
                    'discount_amount' => $item->discount_amount,
                    'tax_amount'      => $item->tax_amount,
                    'tax_rate'        => $item->tax_rate,
                    'line_total'      => $item->line_total,
                ];
            });

        // Current period aggregates (already loaded — avoid duplicate query)
        $currentQty    = $recentSales->sum('quantity');
        $currentAmount = $recentSales->sum('line_total');

        // Previous 30-day aggregates
        $prevItems = \App\Models\SaleItem::where('product_id', $productId)
            ->whereHas('sale', function ($q) use ($previous30, $current30) {
                $q->where('created_by', createdBy())
                  ->whereBetween('sale_date', [$previous30, $current30]);
            })
            ->selectRaw('SUM(quantity) as total_qty, SUM(line_total) as total_amount')
            ->first();

        $prevQty    = (float) ($prevItems->total_qty    ?? 0);
        $prevAmount = (float) ($prevItems->total_amount ?? 0);

        $calcPct = function (float $current, float $previous): array {
            if ($previous == 0) {
                return ['pct' => $current > 0 ? 100 : 0, 'trend' => $current > 0 ? 'increase' : 'no-change'];
            }
            $pct = (($current - $previous) / $previous) * 100;
            return [
                'pct'   => round(abs($pct), 1),
                'trend' => $pct > 0 ? 'increase' : ($pct < 0 ? 'decrease' : 'no-change'),
            ];
        };

        $amountComparison  = $calcPct((float) $currentAmount, $prevAmount);
        $quantityComparison = $calcPct((float) $currentQty, $prevQty);

        $salesComparison = [
            'current_amount'   => (float) $currentAmount,
            'previous_amount'  => $prevAmount,
            'amount_pct'       => $amountComparison['pct'],
            'amount_trend'     => $amountComparison['trend'],
            'current_qty'      => (int) $currentQty,
            'previous_qty'     => (int) $prevQty,
            'qty_pct'          => $quantityComparison['pct'],
            'qty_trend'        => $quantityComparison['trend'],
        ];

        return Inertia::render('products/show', [
            'product'         => $product,
            'recentSales'     => $recentSales,
            'salesComparison' => $salesComparison,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                \Illuminate\Validation\Rule::unique('products', 'name')
                    ->where('created_by', createdBy())
            ],
            'sku' => [
                'required',
                'string',
                'max:255',
                \Illuminate\Validation\Rule::unique('products', 'sku')
                    ->where('created_by', createdBy())
            ],
            'description' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'unit_id' => 'required|exists:units,id',
            'aliaddo_unit_measurement_code' => 'nullable|in:94,EA,C62,DZN,SET,KGM,GRM,TNE,LBR,ONZ,LTR,MLT,MTQ,GLL',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'min_stock_level' => 'required|integer|min:0',
            'image' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
            'tax_ids' => 'nullable|array',
            'tax_ids.*' => 'exists:taxes,id',
        ]);

        try {
            // Handle MediaPicker URLs - convert to relative paths
            if (!empty($validated['image'])) {
                $validated['image'] = $this->convertToRelativePath($validated['image']);
            }

            $validated['created_by'] = createdBy();
            $validated['status'] = $validated['status'] ?? 'active';
            $taxIds = $validated['tax_ids'] ?? [];
            unset($validated['tax_ids']);

            $product = Product::create($validated);
            if (!empty($taxIds)) {
                $product->taxes()->attach($taxIds);
            }

            return redirect()->route('products.index')->with('success', __('Product created successfully.'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to create product'));
        }
    }

    public function edit($productId)
    {
        $product    = Product::with(['taxes'])->where('id', $productId)->where('created_by', createdBy())->firstOrFail();
        $categories = Category::where('created_by', createdBy())->where('status', 'active')->get(['id', 'name']);
        $brands     = Brand::where('created_by', createdBy())->where('status', 'active')->get(['id', 'name']);
        $units      = Unit::where('created_by', createdBy())->where('status', 'active')->get(['id', 'name']);
        $taxes      = Tax::where('created_by', createdBy())->where('status', 'active')->get(['id', 'name', 'rate', 'type']);

        return Inertia::render('products/edit', compact('product', 'categories', 'brands', 'units', 'taxes'));
    }

    public function update(Request $request, $productId)
    {
        $product = Product::where('id', $productId)
            ->where('created_by', createdBy())
            ->first();

        if ($product) {
            $validated = $request->validate([
                'name' => [
                    'required',
                    'string',
                    'max:255',
                    \Illuminate\Validation\Rule::unique('products', 'name')
                        ->where('created_by', createdBy())
                        ->ignore($productId)
                ],
                'sku' => [
                    'required',
                    'string',
                    'max:255',
                    \Illuminate\Validation\Rule::unique('products', 'sku')
                        ->where('created_by', createdBy())
                        ->ignore($productId)
                ],
                'description' => 'nullable|string',
                'category_id' => 'required|exists:categories,id',
                'brand_id' => 'nullable|exists:brands,id',
                'unit_id' => 'required|exists:units,id',
                'aliaddo_unit_measurement_code' => 'nullable|in:94,EA,C62,DZN,SET,KGM,GRM,TNE,LBR,ONZ,LTR,MLT,MTQ,GLL',
                'purchase_price' => 'required|numeric|min:0',
                'selling_price' => 'required|numeric|min:0',
                'stock_quantity' => 'required|integer|min:0',
                'min_stock_level' => 'required|integer|min:0',
                'image' => 'nullable|string',
                'status' => 'nullable|in:active,inactive',
                'tax_ids' => 'nullable|array',
                'tax_ids.*' => 'exists:taxes,id',
            ]);

            try {
                // Handle MediaPicker URLs - convert to relative paths
                if (isset($validated['image'])) {
                    if (!empty($validated['image'])) {
                        $validated['image'] = $this->convertToRelativePath($validated['image']);
                    } else {
                        $validated['image'] = null;
                    }
                }

                $taxIds = $validated['tax_ids'] ?? [];
                unset($validated['tax_ids']);

                $product->update($validated);
                $product->taxes()->sync($taxIds);

                return redirect()->route('products.index')->with('success', __('Product updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update product'));
            }
        } else {
            return redirect()->back()->with('error', __('Product Not Found.'));
        }
    }

    public function destroy($productId)
    {
        $product = Product::where('id', $productId)
            ->where('created_by', createdBy())
            ->first();

        if ($product) {
            try {
                $product->taxes()->detach();
                $product->delete();
                return redirect()->back()->with('success', __('Product deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete product'));
            }
        } else {
            return redirect()->back()->with('error', __('Product Not Found.'));
        }
    }

    public function toggleStatus($productId)
    {
        $product = Product::where('id', $productId)
            ->where('created_by', createdBy())
            ->first();

        if ($product) {
            try {
                $product->status = $product->status === 'active' ? 'inactive' : 'active';
                $product->save();

                return redirect()->back()->with('success', __('Product status updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update product status'));
            }
        } else {
            return redirect()->back()->with('error', __('Product Not Found.'));
        }
    }

    /**
     * Convert full URL to relative path for storage
     */
    private function convertToRelativePath(string $url): string
    {
        if (!$url) return $url;
        
        // If it's already a relative path, return as is
        if (!str_starts_with($url, 'http')) {
            return $url;
        }
        
        // Extract the path after /storage/
        $storageIndex = strpos($url, '/storage/');
        if ($storageIndex !== false) {
            return substr($url, $storageIndex);
        }
        
        return $url;
    }

    public function fileExport()
    {
        $name = 'products_' . date('Y-m-d_H-i-s');
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\ProductExport(), $name . '.xlsx');
    }

    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|mimes:xlsx,xls,csv|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());
            
            if ($extension === 'csv') {
                return $this->importFromCsv($file);
            }
            
            $importClass = new \App\Imports\ProductImport();
            \Maatwebsite\Excel\Facades\Excel::import($importClass, $file);
            
            $results = $importClass->getResults();

            return response()->json([
                'success' => true,
                'message' => "{$results['inserted_count']} products imported, {$results['skipped_count']} skipped.",
                'data' => $results
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Import failed: ' . $e->getMessage()], 500);
        }
    }

    private function importFromCsv($file)
    {
        try {
            $csvData = array_map('str_getcsv', file($file->getRealPath()));
            $headers = array_shift($csvData);
            
            $imported = 0;
            $skipped = 0;
            $seen = [];
            
            foreach ($csvData as $rowIndex => $row) {
                $mappedData = [];
                foreach ($headers as $index => $header) {
                    $mappedData[$header] = $row[$index] ?? null;
                }
                
                $uniqueKey = strtolower(trim($mappedData['sku'] ?? '')) . '|' . strtolower(trim($mappedData['name'] ?? ''));
                
                if (isset($seen[$uniqueKey]) || $this->checkDuplicateProduct($mappedData)) {
                    $skipped++;
                    continue;
                }
                $seen[$uniqueKey] = true;
                
                Product::create(array_merge($mappedData, ['created_by' => Auth::id()]));
                $imported++;
            }
            
            return response()->json([
                'success' => true,
                'message' => "{$imported} products imported, {$skipped} skipped.",
                'data' => [
                    'inserted_count' => $imported,
                    'skipped_count' => $skipped
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Import failed: ' . $e->getMessage()], 500);
        }
    }

    private function checkDuplicateProduct($data)
    {
        $createdBy = Auth::id();
        
        // Check for duplicate SKU
        if (!empty($data['sku'])) {
            $skuExists = Product::where('sku', $data['sku'])
                ->where('created_by', $createdBy)
                ->exists();
            if ($skuExists) return true;
        }
        
        // Check for duplicate name
        if (!empty($data['name'])) {
            $nameExists = Product::where('name', $data['name'])
                ->where('created_by', $createdBy)
                ->exists();
            if ($nameExists) return true;
        }
        
        return false;
    }

    public function export(Request $request)
    {
        try {
            $filename = 'products_export_' . date('Y-m-d_H-i-s') . '.xlsx';
            $export = new \App\Exports\ProductExport($request);
            return \Maatwebsite\Excel\Facades\Excel::download($export, $filename);
        } catch (\Exception $e) {
            \Log::error('Product export failed: ' . $e->getMessage());
            return response()->json(['error' => 'Export failed: ' . $e->getMessage()], 500);
        }
    }
}
