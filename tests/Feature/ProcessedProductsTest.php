<?php

use App\Http\Middleware\CheckInstallation;
use App\Http\Middleware\CheckPlanAccess;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\Category;
use App\Models\CommerceType;
use App\Models\Customer;
use App\Models\Plan;
use App\Models\ProcessedProduct;
use App\Models\Product;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Support\Facades\Config;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->withoutMiddleware([CheckInstallation::class, CheckPlanAccess::class, HandleInertiaRequests::class]);
    $this->company = User::factory()->create(['type' => 'company']);
    $permissions = [
        Permission::findOrCreate('view-products', 'web'),
        Permission::findOrCreate('view-processed-products', 'web'),
        Permission::findOrCreate('create-products', 'web'),
        Permission::findOrCreate('view-pos', 'web'),
        Permission::findOrCreate('create-sales', 'web'),
    ];
    $this->company->givePermissionTo($permissions);

    $commerceType = CommerceType::create([
        'name' => 'Processed Products Test Commerce',
        'permissions_initialized' => true,
    ]);
    $plan = Plan::create([
        'name' => 'Processed Products Test Plan',
        'price' => 0,
        'duration' => 'monthly',
        'total_customers' => 0,
        'total_vendors' => 0,
        'max_users' => 5,
        'storage_limit' => 5,
        'is_plan_enable' => 'on',
        'is_default' => false,
        'commerce_type_id' => $commerceType->id,
    ]);
    $this->company->update([
        'plan_id' => $plan->id,
        'plan_is_active' => 1,
        'plan_expire_date' => now()->addMonth(),
    ]);
    $commerceType->permissions()->sync(collect($permissions)->pluck('id'));

    $this->actingAs($this->company);

    $this->category = Category::create([
        'created_by' => $this->company->id,
        'name' => 'Processed goods',
        'status' => 'active',
    ]);
    $this->unit = Unit::create([
        'created_by' => $this->company->id,
        'name' => 'Piece',
        'short_name' => 'pc',
        'status' => 'active',
    ]);
});

function processedProductPayload(array $items, array $overrides = []): array
{
    return array_replace_recursive([
        'output_mode' => 'new',
        'output_product_id' => '',
        'produced_quantity' => 3,
        'processed_date' => now()->toDateString(),
        'notes' => '',
        'product' => [
            'name' => 'Processed item',
            'sku' => 'PROC-001',
            'category_id' => 1,
            'unit_id' => 1,
            'purchase_price' => 2.50,
            'selling_price' => 5.00,
            'min_stock_level' => 0,
            'image' => '',
        ],
        'items' => $items,
    ], $overrides);
}

test('creating a processed product deducts inputs and creates the output inventory', function () {
    $input = Product::create([
        'created_by' => $this->company->id,
        'name' => 'Raw material',
        'sku' => 'RAW-001',
        'category_id' => $this->category->id,
        'unit_id' => $this->unit->id,
        'stock_quantity' => 8,
        'status' => 'active',
    ]);

    $response = $this->post(route('processed-products.store'), processedProductPayload([
        ['product_id' => $input->id, 'quantity' => 4],
    ], [
        'product' => [
            'category_id' => $this->category->id,
            'unit_id' => $this->unit->id,
            'image' => 'https://example.test/storage/products/processed-item.png',
        ],
    ]));

    $response->assertSessionHasNoErrors()
        ->assertRedirect(route('processed-products.index'));

    $this->assertSame(4, $input->fresh()->stock_quantity);
    $this->assertDatabaseHas('products', [
        'created_by' => $this->company->id,
        'name' => 'Processed item',
        'stock_quantity' => 3,
        'image' => '/storage/products/processed-item.png',
    ]);
    $this->assertDatabaseHas('processed_products', [
        'created_by' => $this->company->id,
        'produced_quantity' => 3,
    ]);
    $this->assertDatabaseHas('processed_product_items', [
        'processed_product_id' => ProcessedProduct::firstOrFail()->id,
        'product_id' => $input->id,
        'quantity' => 4,
    ]);
});

test('processing can add output quantity to an existing product', function () {
    $input = Product::create([
        'created_by' => $this->company->id,
        'name' => 'Raw material',
        'sku' => 'RAW-002',
        'category_id' => $this->category->id,
        'unit_id' => $this->unit->id,
        'stock_quantity' => 8,
        'status' => 'active',
    ]);
    $output = Product::create([
        'created_by' => $this->company->id,
        'name' => 'Existing output',
        'sku' => 'OUT-001',
        'category_id' => $this->category->id,
        'unit_id' => $this->unit->id,
        'stock_quantity' => 5,
        'status' => 'active',
    ]);

    $response = $this->post(route('processed-products.store'), processedProductPayload([
        ['product_id' => $input->id, 'quantity' => 2],
    ], [
        'output_mode' => 'existing',
        'output_product_id' => $output->id,
    ]));

    $response->assertSessionHasNoErrors()
        ->assertRedirect(route('processed-products.index'));

    $this->assertSame(6, $input->fresh()->stock_quantity);
    $this->assertSame(8, $output->fresh()->stock_quantity);
    $this->assertDatabaseHas('processed_products', [
        'output_product_id' => $output->id,
        'produced_quantity' => 3,
    ]);
    $this->assertDatabaseCount('products', 2);
});

test('insufficient input stock does not create a product or change inventory', function () {
    $input = Product::create([
        'created_by' => $this->company->id,
        'name' => 'Low stock material',
        'sku' => 'RAW-003',
        'category_id' => $this->category->id,
        'unit_id' => $this->unit->id,
        'stock_quantity' => 1,
        'status' => 'active',
    ]);

    $response = $this->post(route('processed-products.store'), processedProductPayload([
        ['product_id' => $input->id, 'quantity' => 2],
    ], [
        'product' => [
            'category_id' => $this->category->id,
            'unit_id' => $this->unit->id,
        ],
    ]));

    $response->assertSessionHasErrors('items.0.quantity');
    $this->assertSame(1, $input->fresh()->stock_quantity);
    $this->assertDatabaseCount('products', 1);
    $this->assertDatabaseCount('processed_products', 0);
});

test('processed product list reports counts for distinct output products', function () {
    $outputs = [
        ['name' => 'Out of stock output', 'sku' => 'OUT-101', 'status' => 'active', 'stock_quantity' => 0, 'min_stock_level' => 2],
        ['name' => 'Low stock output', 'sku' => 'OUT-102', 'status' => 'active', 'stock_quantity' => 2, 'min_stock_level' => 5],
        ['name' => 'Inactive output', 'sku' => 'OUT-103', 'status' => 'inactive', 'stock_quantity' => 10, 'min_stock_level' => 2],
    ];

    foreach ($outputs as $attributes) {
        $output = Product::create(array_merge([
            'created_by' => $this->company->id,
            'category_id' => $this->category->id,
            'unit_id' => $this->unit->id,
        ], $attributes));

        ProcessedProduct::create([
            'created_by' => $this->company->id,
            'output_product_id' => $output->id,
            'produced_quantity' => 1,
            'processed_date' => now()->toDateString(),
        ]);
    }

    $response = $this->withHeaders(['X-Inertia' => 'true'])
        ->get(route('processed-products.index'));

    $response->assertOk()
        ->assertJsonPath('props.productStats.totalProducts', 3)
        ->assertJsonPath('props.productStats.activeProducts', 2)
        ->assertJsonPath('props.productStats.inactiveProducts', 1)
        ->assertJsonPath('props.productStats.outOfStock', 1)
        ->assertJsonPath('props.productStats.lowStock', 1);
});

test('processed product filters search output and input products without bypassing status', function () {
    $activeOutput = Product::create([
        'created_by' => $this->company->id,
        'name' => 'Active finished good',
        'sku' => 'FIN-201',
        'category_id' => $this->category->id,
        'unit_id' => $this->unit->id,
        'stock_quantity' => 5,
        'status' => 'active',
    ]);
    $inactiveOutput = Product::create([
        'created_by' => $this->company->id,
        'name' => 'Inactive finished good',
        'sku' => 'FIN-202',
        'category_id' => $this->category->id,
        'unit_id' => $this->unit->id,
        'stock_quantity' => 5,
        'status' => 'inactive',
    ]);
    $input = Product::create([
        'created_by' => $this->company->id,
        'name' => 'Searchable ingredient',
        'sku' => 'ING-201',
        'category_id' => $this->category->id,
        'unit_id' => $this->unit->id,
        'stock_quantity' => 5,
        'status' => 'active',
    ]);
    $otherCategory = Category::create([
        'created_by' => $this->company->id,
        'name' => 'Other category',
        'status' => 'active',
    ]);
    $otherCategoryOutput = Product::create([
        'created_by' => $this->company->id,
        'name' => 'Other category finished good',
        'sku' => 'FIN-203',
        'category_id' => $otherCategory->id,
        'unit_id' => $this->unit->id,
        'stock_quantity' => 5,
        'status' => 'active',
    ]);

    foreach ([$activeOutput, $inactiveOutput, $otherCategoryOutput] as $output) {
        $processed = ProcessedProduct::create([
            'created_by' => $this->company->id,
            'output_product_id' => $output->id,
            'produced_quantity' => 1,
            'processed_date' => now()->toDateString(),
        ]);
        $processed->items()->create(['product_id' => $input->id, 'quantity' => 1]);
    }

    $response = $this->withHeaders(['X-Inertia' => 'true'])
        ->get(route('processed-products.index', [
            'search' => 'Searchable',
            'status' => 'active',
            'category' => $this->category->id,
        ]));

    $response->assertOk()
        ->assertJsonPath('props.processedProducts.total', 1)
        ->assertJsonPath('props.processedProducts.data.0.output_product.name', 'Active finished good')
        ->assertJsonPath('props.statusCounts.all', 2)
        ->assertJsonPath('props.statusCounts.active', 1)
        ->assertJsonPath('props.statusCounts.inactive', 1);
});

test('processed output is available through inventory POS and storefront sales flows', function () {
    Config::set('app.mobile_store_owner_id', $this->company->id);

    $input = Product::create([
        'created_by' => $this->company->id,
        'name' => 'Raw flour',
        'sku' => 'RAW-FLOUR-001',
        'category_id' => $this->category->id,
        'unit_id' => $this->unit->id,
        'stock_quantity' => 10,
        'status' => 'active',
    ]);

    $this->post(route('processed-products.store'), processedProductPayload([
        ['product_id' => $input->id, 'quantity' => 4],
    ], [
        'product' => [
            'name' => 'Finished bread',
            'sku' => 'BREAD-001',
            'category_id' => $this->category->id,
            'unit_id' => $this->unit->id,
            'selling_price' => 12.50,
        ],
    ]))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('processed-products.index'));

    $finishedProduct = Product::where('sku', 'BREAD-001')->firstOrFail();
    $branch = Branch::create([
        'created_by' => $this->company->id,
        'name' => 'Main branch',
        'address' => '1 Main Street',
        'status' => 'active',
    ]);
    $cashRegister = CashRegister::create([
        'created_by' => $this->company->id,
        'branch_id' => $branch->id,
        'name' => 'Main register',
        'register_code' => 'REG-MAIN-001',
        'status' => 'active',
    ]);
    $customer = Customer::create([
        'created_by' => $this->company->id,
        'name' => 'Walk-in customer',
        'status' => 'active',
    ]);

    $this->withHeaders(['X-Inertia' => 'true'])
        ->get(route('products.index', ['search' => 'Finished bread']))
        ->assertOk()
        ->assertJsonPath('props.products.data.0.id', $finishedProduct->id);

    $this->withHeaders(['X-Inertia' => 'true'])
        ->get(route('pos.index', ['search' => 'Finished bread']))
        ->assertOk()
        ->assertJsonPath('props.products.0.id', $finishedProduct->id);

    $this->getJson(route('pos.products'))
        ->assertOk()
        ->assertJsonFragment([
            'id' => $finishedProduct->id,
            'name' => 'Finished bread',
        ]);

    $this->getJson('/api/v1/store/products?branch_id='.$branch->id)
        ->assertOk()
        ->assertJsonFragment([
            'id' => $finishedProduct->id,
            'name' => 'Finished bread',
            'price' => '12.50',
        ]);

    $this->from(route('pos.index'))
        ->post(route('pos.sales.store'), [
            'customer_id' => $customer->id,
            'cash_register_id' => $cashRegister->id,
            'items' => [
                [
                    'product_id' => $finishedProduct->id,
                    'quantity' => 2,
                    'unit_price' => 12.50,
                ],
            ],
            'payment_method' => 'cash',
        ])
        ->assertRedirect(route('pos.index'))
        ->assertSessionHas('success');

    $this->assertSame(1, $finishedProduct->fresh()->stock_quantity);
    $this->assertDatabaseHas('sale_items', [
        'product_id' => $finishedProduct->id,
        'product_name' => 'Finished bread',
        'quantity' => 2,
    ]);
    $this->assertSame(6, $input->fresh()->stock_quantity);
});
