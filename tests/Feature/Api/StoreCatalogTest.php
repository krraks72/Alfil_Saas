<?php

use App\Models\Branch;
use App\Models\Category;
use App\Models\MobileStoreOrder;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Support\Facades\Config;

it('fails closed when the storefront owner is not configured', function () {
    Config::set('app.mobile_store_owner_id', null);

    $this->getJson('/api/v1/store/products')
        ->assertServiceUnavailable()
        ->assertJson([
            'message' => 'The mobile storefront is not configured.',
        ]);
});

it('returns only public active catalog fields for the configured store', function () {
    $owner = User::factory()->create();
    $otherOwner = User::factory()->create();
    Config::set('app.mobile_store_owner_id', $owner->id);
    $branch = Branch::query()->create([
        'created_by' => $owner->id,
        'name' => 'Sucursal Centro',
        'address' => 'Calle 1',
        'status' => 'active',
    ]);
    Branch::query()->create([
        'created_by' => $otherOwner->id,
        'name' => 'Otra tienda',
        'address' => 'Calle 2',
        'status' => 'active',
    ]);

    $category = Category::query()->create([
        'created_by' => $owner->id,
        'name' => 'Bebidas',
        'slug' => 'bebidas',
        'status' => 'active',
    ]);
    $otherCategory = Category::query()->create([
        'created_by' => $otherOwner->id,
        'name' => 'Privado',
        'slug' => 'privado',
        'status' => 'active',
    ]);
    $unit = Unit::query()->create([
        'created_by' => $owner->id,
        'name' => 'Pieza',
        'short_name' => 'pz',
        'status' => 'active',
    ]);
    $otherUnit = Unit::query()->create([
        'created_by' => $otherOwner->id,
        'name' => 'Caja',
        'short_name' => 'cj',
        'status' => 'active',
    ]);

    $product = Product::query()->create([
        'created_by' => $owner->id,
        'name' => 'Agua',
        'sku' => 'AGUA-001',
        'description' => 'Agua natural',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
        'purchase_price' => 4.50,
        'selling_price' => 8.00,
        'stock_quantity' => 5,
        'min_stock_level' => 1,
        'status' => 'active',
    ]);
    Product::query()->create([
        'created_by' => $otherOwner->id,
        'name' => 'Producto de otra tienda',
        'sku' => 'OTRA-001',
        'category_id' => $otherCategory->id,
        'unit_id' => $otherUnit->id,
        'selling_price' => 99.00,
        'status' => 'active',
    ]);
    Product::query()->create([
        'created_by' => $owner->id,
        'name' => 'Producto inactivo',
        'sku' => 'INACTIVO-001',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
        'selling_price' => 3.00,
        'status' => 'inactive',
    ]);
    Product::query()->create([
        'created_by' => $owner->id,
        'name' => 'Producto agotado',
        'sku' => 'AGOTADO-001',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
        'selling_price' => 3.00,
        'stock_quantity' => 0,
        'status' => 'active',
    ]);
    Setting::query()->create([
        'user_id' => $owner->id,
        'key' => 'defaultCurrency',
        'value' => 'MXN',
    ]);

    $this->getJson('/api/v1/store/branches')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $branch->id);

    $this->getJson("/api/v1/store/products?branch_id={$branch->id}")
        ->assertOk()
        ->assertJsonPath('data.0.id', $product->id)
        ->assertJsonPath('data.0.name', 'Agua')
        ->assertJsonPath('data.0.price', '8.00')
        ->assertJsonPath('data.0.available', true)
        ->assertJsonPath('data.0.category.name', 'Bebidas')
        ->assertJsonPath('data.0.unit.short_name', 'pz')
        ->assertJsonPath('meta.currency_code', 'MXN')
        ->assertJsonPath('meta.total', 1)
        ->assertJsonMissingPath('data.0.sku')
        ->assertJsonMissingPath('data.0.purchase_price')
        ->assertJsonMissingPath('data.0.stock_quantity');
});

it('creates a pending request for the selected branch without changing global stock', function () {
    $owner = User::factory()->create();
    Config::set('app.mobile_store_owner_id', $owner->id);
    $branch = Branch::query()->create([
        'created_by' => $owner->id,
        'name' => 'Sucursal Norte',
        'address' => 'Avenida 5',
        'status' => 'active',
    ]);
    $category = Category::query()->create([
        'created_by' => $owner->id,
        'name' => 'Abarrotes',
        'slug' => 'abarrotes',
        'status' => 'active',
    ]);
    $unit = Unit::query()->create([
        'created_by' => $owner->id,
        'name' => 'Pieza',
        'short_name' => 'pz',
        'status' => 'active',
    ]);
    $product = Product::query()->create([
        'created_by' => $owner->id,
        'name' => 'Arroz',
        'sku' => 'ARROZ-001',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
        'purchase_price' => 10,
        'selling_price' => 15,
        'stock_quantity' => 4,
        'status' => 'active',
    ]);

    $this->postJson('/api/v1/store/orders', [
        'branch_id' => $branch->id,
        'customer_name' => 'Cliente de prueba',
        'customer_phone' => '5551234567',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 2],
        ],
    ])
        ->assertCreated()
        ->assertJsonPath('data.branch_id', $branch->id)
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.subtotal', '30.00')
        ->assertJsonPath('data.items.0.product_name', 'Arroz')
        ->assertJsonPath('data.items.0.line_total', '30.00');

    expect(MobileStoreOrder::query()->count())->toBe(1)
        ->and($product->fresh()->stock_quantity)->toBe(4);
});

it('does not expose products from another store through a selected branch', function () {
    $owner = User::factory()->create();
    $otherOwner = User::factory()->create();
    Config::set('app.mobile_store_owner_id', $owner->id);
    $branch = Branch::query()->create([
        'created_by' => $owner->id,
        'name' => 'Sucursal propia',
        'address' => 'Calle 8',
        'status' => 'active',
    ]);

    $category = Category::query()->create([
        'created_by' => $otherOwner->id,
        'name' => 'Otra',
        'slug' => 'otra',
        'status' => 'active',
    ]);
    $unit = Unit::query()->create([
        'created_by' => $otherOwner->id,
        'name' => 'Pieza',
        'short_name' => 'pz',
        'status' => 'active',
    ]);
    $product = Product::query()->create([
        'created_by' => $otherOwner->id,
        'name' => 'No visible',
        'sku' => 'NO-VISIBLE-001',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
        'selling_price' => 20,
        'status' => 'active',
    ]);

    $this->getJson("/api/v1/store/products/{$product->id}?branch_id={$branch->id}")
        ->assertNotFound();
});

it('rejects order requests for a branch outside the configured store', function () {
    $owner = User::factory()->create();
    $otherOwner = User::factory()->create();
    Config::set('app.mobile_store_owner_id', $owner->id);
    $foreignBranch = Branch::query()->create([
        'created_by' => $otherOwner->id,
        'name' => 'Sucursal ajena',
        'address' => 'Calle 9',
        'status' => 'active',
    ]);

    $this->postJson('/api/v1/store/orders', [
        'branch_id' => $foreignBranch->id,
        'customer_name' => 'Cliente',
        'customer_phone' => '5551234567',
        'items' => [
            ['product_id' => 1, 'quantity' => 1],
        ],
    ])->assertNotFound();
});

it('rejects a requested quantity above global stock without creating an order', function () {
    $owner = User::factory()->create();
    Config::set('app.mobile_store_owner_id', $owner->id);
    $branch = Branch::query()->create([
        'created_by' => $owner->id,
        'name' => 'Sucursal Sur',
        'address' => 'Calle 12',
        'status' => 'active',
    ]);
    $category = Category::query()->create([
        'created_by' => $owner->id,
        'name' => 'Lácteos',
        'slug' => 'lacteos',
        'status' => 'active',
    ]);
    $unit = Unit::query()->create([
        'created_by' => $owner->id,
        'name' => 'Pieza',
        'short_name' => 'pz',
        'status' => 'active',
    ]);
    $product = Product::query()->create([
        'created_by' => $owner->id,
        'name' => 'Leche',
        'sku' => 'LECHE-001',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
        'selling_price' => 20,
        'stock_quantity' => 2,
        'status' => 'active',
    ]);

    $this->postJson('/api/v1/store/orders', [
        'branch_id' => $branch->id,
        'customer_name' => 'Cliente',
        'customer_phone' => '5551234567',
        'items' => [
            ['product_id' => $product->id, 'quantity' => 3],
        ],
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('items');

    expect(MobileStoreOrder::query()->count())->toBe(0)
        ->and($product->fresh()->stock_quantity)->toBe(2);
});
