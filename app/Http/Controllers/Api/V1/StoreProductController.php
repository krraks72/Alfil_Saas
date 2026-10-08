<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $ownerId = $this->storeOwnerId();

        if ($ownerId === null) {
            return $this->storeNotConfigured();
        }

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'integer', 'min:1'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $products = $this->storeProducts($ownerId)
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when(
                $filters['category_id'] ?? null,
                fn (Builder $query, int $categoryId) => $query->where('category_id', $categoryId)
            )
            ->orderBy('name')
            ->paginate(24);

        $currencyCode = $this->currencyCode($ownerId);

        return response()->json([
            'data' => collect($products->items())
                ->map(fn (Product $product): array => $this->productData($product))
                ->values(),
            'meta' => [
                'currency_code' => $currencyCode,
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function show(int $product): JsonResponse
    {
        $ownerId = $this->storeOwnerId();

        if ($ownerId === null) {
            return $this->storeNotConfigured();
        }

        $storeProduct = $this->storeProducts($ownerId)->findOrFail($product);

        return response()->json([
            'data' => $this->productData($storeProduct),
            'meta' => [
                'currency_code' => $this->currencyCode($ownerId),
            ],
        ]);
    }

    private function storeProducts(int $ownerId): Builder
    {
        return Product::query()
            ->where('created_by', $ownerId)
            ->where('status', 'active')
            ->whereHas('category', fn (Builder $query) => $query
                ->where('created_by', $ownerId)
                ->where('status', 'active'))
            ->whereHas('unit', fn (Builder $query) => $query
                ->where('created_by', $ownerId)
                ->where('status', 'active'))
            ->with([
                'category:id,name',
                'brand' => fn (BelongsTo $query) => $query
                    ->where('created_by', $ownerId)
                    ->where('status', 'active')
                    ->select(['id', 'name']),
                'unit:id,name,short_name',
            ]);
    }

    private function productData(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'description' => $product->description,
            'price' => $product->selling_price,
            'image' => $product->image !== '' ? $product->image : null,
            'available' => $product->stock_quantity > 0,
            'category' => [
                'id' => $product->category->id,
                'name' => $product->category->name,
            ],
            'brand' => $product->brand ? [
                'id' => $product->brand->id,
                'name' => $product->brand->name,
            ] : null,
            'unit' => [
                'name' => $product->unit->name,
                'short_name' => $product->unit->short_name,
            ],
        ];
    }

    private function currencyCode(int $ownerId): string
    {
        return Setting::query()
            ->where('user_id', $ownerId)
            ->where('key', 'defaultCurrency')
            ->value('value') ?? 'USD';
    }

    private function storeOwnerId(): ?int
    {
        $ownerId = filter_var(config('app.mobile_store_owner_id'), FILTER_VALIDATE_INT);

        return $ownerId !== false && $ownerId > 0 ? $ownerId : null;
    }

    private function storeNotConfigured(): JsonResponse
    {
        return response()->json([
            'message' => 'The mobile storefront is not configured.',
        ], 503);
    }
}
