<?php

namespace App\Http\Controllers;

use App\Exports\ProcessedProductExport;
use App\Models\Category;
use App\Models\Brand;
use App\Models\ProcessedProduct;
use App\Models\Product;
use App\Models\Unit;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ProcessedProductController extends Controller
{
    public function index(Request $request)
    {
        $userId = createdBy();
        $applyOutputFilters = function ($query) use ($request) {
            if ($request->filled('category') && $request->input('category') !== 'all') {
                $query->where('category_id', $request->input('category'));
            }

            if ($request->filled('brand') && $request->input('brand') !== 'all') {
                $query->where('brand_id', $request->input('brand'));
            }
        };

        $baseOutputProducts = Product::where('created_by', $userId)
            ->whereIn('id', ProcessedProduct::where('created_by', $userId)->select('output_product_id'));
        $productStats = [
            'totalProducts' => (clone $baseOutputProducts)->count(),
            'activeProducts' => (clone $baseOutputProducts)->where('status', 'active')->count(),
            'inactiveProducts' => (clone $baseOutputProducts)->where('status', 'inactive')->count(),
            'outOfStock' => (clone $baseOutputProducts)->where('stock_quantity', '<=', 0)->count(),
            'lowStock' => (clone $baseOutputProducts)
                ->where('stock_quantity', '>', 0)
                ->whereColumn('stock_quantity', '<=', 'min_stock_level')
                ->count(),
        ];

        $buildFilteredQuery = function () use ($userId, $request, $applyOutputFilters) {
            $query = ProcessedProduct::query()
                ->where('created_by', $userId)
                ->whereHas('outputProduct', function ($query) use ($applyOutputFilters) {
                    $applyOutputFilters($query);
                });

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($query) use ($search) {
                    $query->whereHas('outputProduct', function ($query) use ($search) {
                        $query->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                    })->orWhereHas('items.product', function ($query) use ($search) {
                        $query->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                    });
                });
            }

            return $query;
        };

        $filteredProcessedProducts = $buildFilteredQuery();
        $statusCounts = [
            'all' => (clone $filteredProcessedProducts)->count(),
            'active' => (clone $filteredProcessedProducts)->whereHas('outputProduct', fn ($query) => $query->where('status', 'active'))->count(),
            'inactive' => (clone $filteredProcessedProducts)->whereHas('outputProduct', fn ($query) => $query->where('status', 'inactive'))->count(),
        ];

        $query = $buildFilteredQuery();
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->whereHas('outputProduct', fn ($query) => $query->where('status', $request->input('status')));
        }

        $processedProducts = $query->with([
            'outputProduct:id,name,sku,stock_quantity,min_stock_level,status,category_id,brand_id',
            'outputProduct.category:id,name',
            'outputProduct.brand:id,name',
            'items.product:id,name,sku,stock_quantity',
        ])
            ->latest('processed_date')
            ->latest('id')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return Inertia::render('processed-products/index', [
            'processedProducts' => $processedProducts,
            'productStats' => $productStats,
            'statusCounts' => $statusCounts,
            'categories' => Category::where('created_by', $userId)->where('status', 'active')->orderBy('name')->get(['id', 'name']),
            'brands' => Brand::where('created_by', $userId)->where('status', 'active')->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $request->input('status', 'all'),
                'category' => $request->input('category', 'all'),
                'brand' => $request->input('brand', 'all'),
                'per_page' => $request->integer('per_page', 15),
                'view' => $request->input('view', 'list'),
            ],
        ]);
    }

    public function create()
    {
        $userId = createdBy();

        return Inertia::render('processed-products/create', [
            'products' => Product::where('created_by', $userId)
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name', 'sku', 'stock_quantity', 'min_stock_level', 'selling_price', 'image']),
            'categories' => Category::where('created_by', $userId)
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name']),
            'units' => Unit::where('created_by', $userId)
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function export()
    {
        $filename = 'processed_products_export_'.now()->format('Y-m-d_H-i-s').'.xlsx';

        return Excel::download(new ProcessedProductExport, $filename);
    }

    public function store(Request $request)
    {
        $userId = createdBy();

        $validated = $request->validate([
            'output_mode' => ['required', 'in:existing,new'],
            'output_product_id' => [
                'exclude_if:output_mode,new',
                'required_if:output_mode,existing',
                'integer',
                Rule::exists('products', 'id')->where(fn (Builder $query) => $query->where('created_by', $userId)->where('status', 'active')),
            ],
            'produced_quantity' => ['required', 'integer', 'min:1'],
            'processed_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'product.name' => ['exclude_if:output_mode,existing', 'required', 'string', 'max:255', Rule::unique('products', 'name')->where('created_by', $userId)],
            'product.sku' => ['exclude_if:output_mode,existing', 'required', 'string', 'max:255', Rule::unique('products', 'sku')],
            'product.category_id' => [
                'exclude_if:output_mode,existing',
                'required',
                Rule::exists('categories', 'id')->where(fn (Builder $query) => $query->where('created_by', $userId)->where('status', 'active')),
            ],
            'product.unit_id' => [
                'exclude_if:output_mode,existing',
                'required',
                Rule::exists('units', 'id')->where(fn (Builder $query) => $query->where('created_by', $userId)->where('status', 'active')),
            ],
            'product.purchase_price' => ['exclude_if:output_mode,existing', 'required', 'numeric', 'min:0'],
            'product.selling_price' => ['exclude_if:output_mode,existing', 'required', 'numeric', 'min:0'],
            'product.min_stock_level' => ['exclude_if:output_mode,existing', 'required', 'integer', 'min:0'],
            'product.image' => ['exclude_if:output_mode,existing', 'nullable', 'string', 'max:2048'],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.product_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('products', 'id')->where(fn (Builder $query) => $query->where('created_by', $userId)->where('status', 'active')),
            ],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        DB::transaction(function () use ($validated, $userId) {
            $items = collect($validated['items']);
            $lockedIds = $items->pluck('product_id')->all();
            if ($validated['output_mode'] === 'existing') {
                $lockedIds[] = $validated['output_product_id'];
                if ($items->contains(fn ($item) => (string) $item['product_id'] === (string) $validated['output_product_id'])) {
                    throw ValidationException::withMessages([
                        'output_product_id' => __('The output product cannot also be used as an input.'),
                    ]);
                }
            }

            $products = Product::where('created_by', $userId)
                ->whereIn('id', $lockedIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($items as $index => $item) {
                $product = $products->get($item['product_id']);
                if (! $product || $product->status !== 'active') {
                    throw ValidationException::withMessages([
                        "items.{$index}.product_id" => __('The selected input product is no longer available.'),
                    ]);
                }

                if ($product->stock_quantity < $item['quantity']) {
                    throw ValidationException::withMessages([
                        "items.{$index}.quantity" => __('Insufficient stock for :product. Available: :available.', [
                            'product' => $product->name,
                            'available' => $product->stock_quantity,
                        ]),
                    ]);
                }
            }

            if ($validated['output_mode'] === 'existing') {
                $outputProduct = $products->get($validated['output_product_id']);
                if (! $outputProduct || $outputProduct->status !== 'active') {
                    throw ValidationException::withMessages([
                        'output_product_id' => __('The selected output product is no longer available.'),
                    ]);
                }
            } else {
                $outputProduct = Product::create([
                    'created_by' => $userId,
                    'name' => $validated['product']['name'],
                    'sku' => $validated['product']['sku'],
                    'category_id' => $validated['product']['category_id'],
                    'unit_id' => $validated['product']['unit_id'],
                    'purchase_price' => $validated['product']['purchase_price'],
                    'selling_price' => $validated['product']['selling_price'],
                    'stock_quantity' => $validated['produced_quantity'],
                    'min_stock_level' => $validated['product']['min_stock_level'],
                    'image' => $this->convertToRelativePath($validated['product']['image'] ?? '') ?: null,
                    'status' => 'active',
                ]);
            }

            $processedProduct = ProcessedProduct::create([
                'created_by' => $userId,
                'output_product_id' => $outputProduct->id,
                'produced_quantity' => $validated['produced_quantity'],
                'processed_date' => $validated['processed_date'],
                'notes' => $validated['notes'] ?? null,
            ]);

            if ($validated['output_mode'] === 'existing') {
                $outputProduct->increment('stock_quantity', $validated['produced_quantity']);
            }

            foreach ($items as $item) {
                $product = $products->get($item['product_id']);
                $product->decrement('stock_quantity', $item['quantity']);
                $processedProduct->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                ]);
            }
        });

        return redirect()
            ->route('processed-products.index')
            ->with('success', __('Processed product created successfully.'));
    }

    private function convertToRelativePath(string $url): string
    {
        if (! str_starts_with($url, 'http')) {
            return $url;
        }

        $storageIndex = strpos($url, '/storage/');

        return $storageIndex !== false ? substr($url, $storageIndex) : $url;
    }
}
