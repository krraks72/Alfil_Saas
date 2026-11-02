<?php

use App\Http\Middleware\CheckInstallation;
use App\Http\Middleware\CheckPlanAccess;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\AliaddoSetting;
use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Unit;
use App\Models\User;
use App\Services\AliaddoClient;
use App\Services\AliaddoInvoiceService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->withoutMiddleware([CheckInstallation::class, CheckPlanAccess::class, HandleInertiaRequests::class]);
    $this->company = User::factory()->create(['type' => 'company']);
    $this->aliaddoSettings = AliaddoSetting::create([
        'company_id' => $this->company->id,
        'base_url' => 'https://orka.test.aliaddo.net',
        'api_token' => 'unit-test-token',
        'configuration' => [],
        'enabled' => true,
    ]);
});

test('creates an invoice with bearer authentication and the provider document payload', function () {
    Http::fake([
        'orka.test.aliaddo.net/v2/documents/invoices' => Http::response(['id' => 'invoice-id'], 201),
    ]);

    $document = [
        'code' => '01',
        'typeOperation' => '10',
        'mode' => 'Test',
        'format' => 'Standard',
        'prefix' => 'SETP',
        'consecutive' => 1,
        'currencyCode' => 'COP',
        'customer' => ['identification' => '123'],
        'lines' => [['code' => 'SKU-1']],
        'totals' => ['amount' => 100],
    ];

    $response = app(AliaddoClient::class)->createInvoice($document, $this->aliaddoSettings);

    expect($response->status())->toBe(201);
    Http::assertSent(fn (Request $request) => $request->url() === 'https://orka.test.aliaddo.net/v2/documents/invoices'
        && $request->hasHeader('Authorization')
        && str_starts_with($request->header('Authorization')[0], 'Bearer ')
        && $request->data() === $document);
});

test('invoice endpoint forwards optional provider fields and returns the provider response', function () {
    Http::fake([
        'orka.test.aliaddo.net/v2/documents/invoices' => Http::response(['id' => 'aliaddo-id'], 201),
    ]);

    $this->company->givePermissionTo([
        Permission::findOrCreate('view-pos', 'web'),
        Permission::findOrCreate('create-sales', 'web'),
    ]);
    $this->actingAs($this->company);

    $document = [
        'code' => '01',
        'typeOperation' => '10',
        'mode' => 'Test',
        'format' => 'Standard',
        'prefix' => 'SETP',
        'consecutive' => 1,
        'currencyCode' => 'COP',
        'customer' => ['identification' => '123'],
        'lines' => [['code' => 'SKU-1']],
        'totals' => ['amount' => 100],
        'healthSector' => ['serviceProviderCode' => '0123456789'],
    ];

    $this->postJson(route('aliaddo.invoices.store'), $document)
        ->assertCreated()
        ->assertExactJson(['id' => 'aliaddo-id']);

    Http::assertSent(fn (Request $request) => $request->data() === $document);
});

test('looks up invoices by prefix and consecutive using query parameters', function () {
    Http::fake([
        'orka.test.aliaddo.net/v2/documents/invoices/find-by-prefix-and-consecutive*' => Http::response(['id' => 'invoice-id']),
    ]);

    $response = app(AliaddoClient::class)->findInvoiceByPrefixAndConsecutive('SETP', '123', $this->aliaddoSettings);

    expect($response->successful())->toBeTrue();
    Http::assertSent(fn (Request $request) => str_starts_with(
        $request->url(),
        'https://orka.test.aliaddo.net/v2/documents/invoices/find-by-prefix-and-consecutive?',
    ) && str_contains($request->url(), 'prefix=SETP')
        && str_contains($request->url(), 'consecutive=123'));
});

test('creates and retrieves equivalent POS documents through the documented endpoints', function () {
    Http::fake([
        'orka.test.aliaddo.net/v2/documents/equivalent-documents' => Http::response(['id' => 'pos-id'], 201),
        'orka.test.aliaddo.net/v2/documents/equivalent-document/pos-id' => Http::response(['id' => 'pos-id']),
    ]);

    $client = app(AliaddoClient::class);
    $document = ['code' => '20'];

    expect($client->createEquivalentDocument($document, $this->aliaddoSettings)->status())->toBe(201)
        ->and($client->getEquivalentDocument('pos-id', $this->aliaddoSettings)->successful())->toBeTrue();

    Http::assertSent(fn (Request $request) => $request->url() === 'https://orka.test.aliaddo.net/v2/documents/equivalent-documents'
        && $request->data() === $document);
    Http::assertSent(fn (Request $request) => $request->url() === 'https://orka.test.aliaddo.net/v2/documents/equivalent-document/pos-id');
});

test('fails explicitly when the API token is not configured', function () {
    $this->aliaddoSettings->api_token = null;
    $this->aliaddoSettings->save();

    expect(fn () => app(AliaddoClient::class)->createInvoice([], $this->aliaddoSettings))
        ->toThrow(App\Services\AliaddoNotConfiguredException::class);
});

test('returns a service unavailable response when company integration settings are missing', function () {
    $this->aliaddoSettings->delete();
    $this->withoutMiddleware();
    $this->company->givePermissionTo([
        Permission::findOrCreate('view-pos', 'web'),
        Permission::findOrCreate('create-sales', 'web'),
    ]);

    $this->actingAs($this->company)
        ->postJson(route('aliaddo.invoices.store'), [
            'code' => '01',
            'typeOperation' => '10',
            'mode' => 'Test',
            'format' => 'Standard',
            'prefix' => 'SETP',
            'consecutive' => 1,
            'currencyCode' => 'COP',
            'customer' => ['identification' => '123'],
            'lines' => [['code' => 'SKU-1']],
            'totals' => ['amount' => 100],
        ])
        ->assertStatus(503)
        ->assertJson(['message' => 'Configure la integración Aliaddo para esta empresa.']);
});

test('stores the company token encrypted and keeps it out of serialized settings', function () {
    $this->actingAs($this->company)
        ->post(route('settings.aliaddo.store'), [
            'enabled' => false,
            'base_url' => 'https://orka.test.aliaddo.net',
            'api_token' => 'company-private-token',
        ])
        ->assertRedirect();

    $settings = $this->aliaddoSettings->fresh();

    expect($settings->api_token)->toBe('company-private-token');
    $this->assertArrayNotHasKey('api_token', $settings->toArray());
    $this->assertDatabaseMissing('aliaddo_settings', [
        'company_id' => $this->company->id,
        'api_token' => 'company-private-token',
    ]);
});

test('automatically builds a provider invoice once for a completed POS sale and advances the DIAN number', function () {
    $branch = Branch::create([
        'created_by' => $this->company->id,
        'name' => 'Main branch',
        'address' => 'Main street 10',
        'phone' => '555-0100',
    ]);
    $cashRegister = CashRegister::create([
        'created_by' => $this->company->id,
        'branch_id' => $branch->id,
        'name' => 'Main register',
        'register_code' => 'REG-001',
    ]);
    $customer = Customer::create([
        'created_by' => $this->company->id,
        'name' => 'Customer One',
        'email' => 'customer@example.test',
        'identification' => '900123456',
        'billing_address' => 'Customer street 20',
        'billing_city' => 'Bogota',
        'billing_state' => 'Cundinamarca',
        'billing_postal_code' => '110111',
        'billing_country' => 'Colombia',
        'same_as_billing' => true,
    ]);
    $category = Category::create([
        'created_by' => $this->company->id,
        'name' => 'Food',
        'slug' => 'food',
    ]);
    $unit = Unit::create([
        'created_by' => $this->company->id,
        'name' => 'Unit',
        'short_name' => 'un',
    ]);
    $product = Product::create([
        'created_by' => $this->company->id,
        'name' => 'Product one',
        'sku' => 'SKU-1',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
        'selling_price' => 100,
        'stock_quantity' => 3,
    ]);
    $this->aliaddoSettings->configuration = [
        'invoice_code' => '01',
        'type_operation' => '10',
        'mode' => 'Test',
        'format' => 'Standard',
        'test_set_id' => 'test-set',
        'prefix' => 'SETP',
        'next_consecutive' => 501,
        'currency_code' => 'COP',
        'payment_mean_code' => '10',
        'term_days' => 30,
        'unit_measurement_code' => '94',
        'unit_measurement_name' => 'Unidad',
        'standard_type' => '001',
        'standard_code' => '10101501',
        'tax_code' => '01',
        'region_code' => '11',
        'region_name' => 'Bogota',
        'city_code' => '11001',
        'city_name' => 'Bogota D.C.',
        'country_code' => 'CO',
        'country_name' => 'Colombia',
        'resolution_key' => 'resolution-key',
        'resolution_prefix' => 'SETP',
        'resolution_number' => 18760000001,
        'range_initial' => 500,
        'range_final' => 999,
        'resolution_valid_from' => '2025-01-01',
        'resolution_valid_until' => '2030-01-01',
        'default_person_type' => '2',
        'default_regime_type' => '49',
        'default_identification_type_code' => '31',
        'default_responsible_for' => 'ZZ',
        'default_responsibilities' => 'R-99-PN',
    ];
    $this->aliaddoSettings->save();
    Http::fake([
        'orka.test.aliaddo.net/v2/documents/invoices' => Http::response(['id' => 'issued-document-id'], 201),
    ]);

    $this->company->givePermissionTo([
        Permission::findOrCreate('view-pos', 'web'),
        Permission::findOrCreate('create-sales', 'web'),
    ]);
    $this->actingAs($this->company)
        ->post(route('pos.sales.store'), [
            'customer_id' => $customer->id,
            'cash_register_id' => $cashRegister->id,
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 2,
                'unit_price' => 100,
            ]],
            'payment_method' => 'cash',
            'paid_amount' => 200,
        ])
        ->assertSessionHas('success', 'Sale completed successfully');

    $sale = Sale::firstOrFail();
    $service = app(AliaddoInvoiceService::class);
    $service->issueForSale($sale->fresh());

    Http::assertSentCount(1);
    Http::assertSent(fn (Request $request) => $request->data()['consecutive'] === 501
        && $request->data()['orderReference'] === $sale->sale_number
        && $request->data()['lines'][0]['code'] === 'SKU-1'
        && $request->data()['customer']['identification'] === '900123456');
    expect($sale->fresh()->aliaddo_status)->toBe('issued')
        ->and($sale->fresh()->aliaddo_document_id)->toBe('issued-document-id')
        ->and($this->aliaddoSettings->fresh()->configuration['next_consecutive'])->toBe(502);
});
