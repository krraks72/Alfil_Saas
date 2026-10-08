<?php

use App\Models\Category;
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
    Setting::query()->create([
        'user_id' => $owner->id,
        'key' => 'defaultCurrency',
        'value' => 'MXN',
    ]);

    $this->getJson('/api/v1/store/products')
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

it('does not expose another store product by its identifier', function () {
    $owner = User::factory()->create();
    $otherOwner = User::factory()->create();
    Config::set('app.mobile_store_owner_id', $owner->id);

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

    $this->getJson("/api/v1/store/products/{$product->id}")
        ->assertNotFound();
});
