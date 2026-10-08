<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\MobileStoreOrder;
use App\Models\MobileStoreOrderItem;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StoreProductController extends Controller
{
    public function branches(): JsonResponse
    {
        $ownerId = $this->storeOwnerId();

        if ($ownerId === null) {
            return $this->storeNotConfigured();
        }

        return response()->json([
            'data' => Branch::query()
                ->where('created_by', $ownerId)
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name', 'address', 'phone']),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $ownerId = $this->storeOwnerId();

        if ($ownerId === null) {
            return $this->storeNotConfigured();
        }

        $filters = $request->validate([
            'branch_id' => ['required', 'integer', 'min:1'],
            'search' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'integer', 'min:1'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
        $branch = $this->findStoreBranch($ownerId, $filters['branch_id']);

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
                'branch' => [
                    'id' => $branch->id,
                    'name' => $branch->name,
                ],
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function show(Request $request, int $product): JsonResponse
    {
        $ownerId = $this->storeOwnerId();

        if ($ownerId === null) {
            return $this->storeNotConfigured();
        }

        $filters = $request->validate([
            'branch_id' => ['required', 'integer', 'min:1'],
        ]);
        $branch = $this->findStoreBranch($ownerId, $filters['branch_id']);
        $storeProduct = $this->storeProducts($ownerId)->findOrFail($product);

        return response()->json([
            'data' => $this->productData($storeProduct),
            'meta' => [
                'currency_code' => $this->currencyCode($ownerId),
                'branch' => [
                    'id' => $branch->id,
                    'name' => $branch->name,
                ],
            ],
        ]);
    }

    public function storeOrder(Request $request): JsonResponse
    {
        $ownerId = $this->storeOwnerId();

        if ($ownerId === null) {
            return $this->storeNotConfigured();
        }

        $orderData = $request->validate([
            'branch_id' => ['required', 'integer', 'min:1'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.product_id' => ['required', 'integer', 'distinct'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);
        $branch = $this->findStoreBranch($ownerId, $orderData['branch_id']);

        $order = DB::transaction(function () use ($ownerId, $branch, $orderData): MobileStoreOrder {
            $requestedItems = collect($orderData['items'])->keyBy('product_id');
            $products = Product::query()
                ->where('created_by', $ownerId)
                ->where('status', 'active')
                ->whereIn('id', $requestedItems->keys())
                ->where('stock_quantity', '>', 0)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if ($products->count() !== $requestedItems->count()) {
                throw ValidationException::withMessages([
                    'items' => 'One or more products are unavailable in this store.',
                ]);
            }

            foreach ($requestedItems as $productId => $item) {
                if ($products->get($productId)->stock_quantity < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => "The requested quantity for product {$productId} is not available.",
                    ]);
                }
            }

            $currencyCode = $this->currencyCode($ownerId);
            $subtotal = $requestedItems->sum(
                fn (array $item): float => (float) $products->get($item['product_id'])->selling_price
                    * $item['quantity']
            );
            $subtotal = round($subtotal, 2);
            $order = MobileStoreOrder::query()->create([
                'order_number' => 'MOB-'.now()->format('Ymd').'-'.Str::upper(Str::random(8)),
                'created_by' => $ownerId,
                'branch_id' => $branch->id,
                'customer_name' => $orderData['customer_name'],
                'customer_email' => $orderData['customer_email'] ?? null,
                'customer_phone' => $orderData['customer_phone'],
                'notes' => $orderData['notes'] ?? null,
                'subtotal' => $subtotal,
                'currency_code' => $currencyCode,
                'status' => 'pending',
            ]);

            foreach ($requestedItems as $productId => $item) {
                $product = $products->get($productId);
                $unitPrice = (float) $product->selling_price;

                MobileStoreOrderItem::query()->create([
                    'mobile_store_order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $item['quantity'],
                    'unit_price' => $unitPrice,
                    'line_total' => round($unitPrice * $item['quantity'], 2),
                ]);
            }

            return $order->load('items');
        });

        return response()->json([
            'data' => $order,
            'message' => 'Order request sent to the selected branch.',
        ], 201);
    }

    private function storeProducts(int $ownerId): Builder
    {
        return Product::query()
            ->where('created_by', $ownerId)
            ->where('status', 'active')
            ->where('stock_quantity', '>', 0)
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

    private function findStoreBranch(int $ownerId, int $branchId): Branch
    {
        return Branch::query()
            ->where('created_by', $ownerId)
            ->where('status', 'active')
            ->findOrFail($branchId);
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
