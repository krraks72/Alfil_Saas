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
        'first_name' => 'Jane',
        'last_name' => 'Doe',
        'digit_check' => '9',
        'identification_type_code' => '31',
        'person_type' => '2',
        'regime_type' => '49',
        'responsibilities' => 'R-99-PN',
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
        'aliaddo_unit_measurement_code' => '94',
        'selling_price' => 100,
        'stock_quantity' => 3,
    ]);
    $this->aliaddoSettings->configuration = [
        'invoice_code' => '02',
        'type_operation' => '10',
        'mode' => 'Test',
        'test_set_id' => '550e8400-e29b-41d4-a716-446655440001',
        'incoterms' => 'CFR',
        'prefix' => 'SETP',
        'next_consecutive' => 501,
        'currency_code' => 'COP',
        'payment_mean_code' => '10',
        'term_days' => 30,
        'region_code' => '11',
        'region_name' => 'Bogotá',
        'city_code' => '11001',
        'city_name' => 'Bogotá, D.c. (DC)',
        'country_code' => 'CO',
        'country_name' => 'Colombia',
        'default_person_type' => '2',
        'default_regime_type' => '49',
        'default_identification_type_code' => '31',
        'default_responsible_for' => 'ZZ',
        'default_responsibilities' => 'R-99-PN',
        'resolution_key' => 'resolution-key',
        'resolution_number' => 18760000001,
        'range_initial' => 500,
        'range_final' => 999,
        'resolution_valid_from' => '2025-01-01',
        'resolution_valid_until' => '2030-01-01',
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
        && $request->data()['customer']['identification'] === '900123456'
        && $request->data()['customer']['personType'] === '2'
        && $request->data()['incoterms'] === 'CFR'
        && $request->data()['lines'][0]['unitMeasurementCode'] === '94'
        && $request->data()['lines'][0]['unitMeasurementName'] === 'Unidad'
        && $request->data()['customer']['BillingAddress']['address'] === 'Customer street 20'
        && $request->data()['customer']['BillingAddress']['countryCode'] === 'CO'
        && $request->data()['customer']['BillingAddress']['regionCode'] === '11'
        && ! isset($request->data()['customer']['billingAddress'])
        && ! isset($request->data()['lines'][0]['standardType'])
        && ! isset($request->data()['lines'][0]['standardCode'])
        && ! isset($request->data()['lines'][0]['taxes'])
        && ! isset($request->data()['format']));
    expect($sale->fresh()->aliaddo_status)->toBe('issued')
        ->and($sale->fresh()->aliaddo_document_id)->toBe('issued-document-id')
        ->and($this->aliaddoSettings->fresh()->configuration['next_consecutive'])->toBe(502);
});

test('allows optional provider fields to remain unset when enabling electronic invoicing', function () {
    $this->actingAs($this->company)
        ->post(route('settings.aliaddo.store'), [
            'enabled' => true,
            'base_url' => 'https://orka.test.aliaddo.net',
            'api_token' => 'company-private-token',
            'invoice_code' => '01',
            'type_operation' => '10',
            'mode' => 'Test',
            'test_set_id' => '550e8400-e29b-41d4-a716-446655440001',
            'prefix' => 'SETP',
            'next_consecutive' => 501,
            'currency_code' => 'COP',
            'payment_mean_code' => '10',
            'unit_measurement_code' => '94',
            'unit_measurement_name' => 'Unidad general',
            'region_code' => '11',
            'region_name' => 'Bogotá',
            'city_code' => '11001',
            'city_name' => 'Bogotá, D.c. (DC)',
            'country_code' => 'CO',
            'country_name' => 'Colombia',
            'default_person_type' => '2',
            'default_regime_type' => '49',
            'default_identification_type_code' => '31',
            'default_responsible_for' => 'ZZ',
            'default_responsibilities' => 'R-99-PN',
            'resolution_key' => 'resolution-key',
            'resolution_number' => 18760000001,
            'range_initial' => 500,
            'range_final' => 999,
            'resolution_valid_from' => '2025-01-01',
            'resolution_valid_until' => '2030-01-01',
        ])
        ->assertRedirect();

    $configuration = $this->aliaddoSettings->fresh()->configuration;

    expect($configuration)->not->toHaveKey('format')
        ->and($configuration)->not->toHaveKey('unit_measurement_code')
        ->and($configuration)->not->toHaveKey('unit_measurement_name')
        ->and($configuration)->not->toHaveKey('standard_type')
        ->and($configuration)->not->toHaveKey('standard_code')
        ->and($configuration)->not->toHaveKey('tax_code')
        ->and($configuration['default_person_type'])->toBe('2')
        ->and($configuration['default_regime_type'])->toBe('49')
        ->and($configuration['default_identification_type_code'])->toBe('31')
        ->and($configuration['default_responsible_for'])->toBe('ZZ')
        ->and($configuration['default_responsibilities'])->toBe('R-99-PN')
        ->and($configuration['currency_code'])->toBe('COP')
        ->and($configuration['country_code'])->toBe('CO')
        ->and($configuration['country_name'])->toBe('Colombia');
});

test('rejects values outside Aliaddo schema enums for invoice and buyer defaults', function () {
    $this->actingAs($this->company)
        ->post(route('settings.aliaddo.store'), [
            'enabled' => false,
            'base_url' => 'https://orka.test.aliaddo.net',
            'invoice_code' => '99',
            'type_operation' => '999',
            'format' => 'Unknown',
            'standard_type' => '888',
            'tax_code' => '99',
            'payment_mean_code' => '99',
            'incoterms' => 'ABC',
            'default_person_type' => '3',
            'default_regime_type' => '50',
            'default_identification_type_code' => '99',
            'default_responsible_for' => 'XX',
            'default_responsibilities' => 'INVALID',
        ])
        ->assertSessionHasErrors([
            'invoice_code',
            'type_operation',
            'format',
            'standard_type',
            'tax_code',
            'payment_mean_code',
            'incoterms',
            'default_person_type',
            'default_regime_type',
            'default_identification_type_code',
            'default_responsible_for',
            'default_responsibilities',
        ]);
});

test('requires a valid INCOTERMS code for enabled export invoices', function () {
    $baseSettings = [
        'enabled' => true,
        'base_url' => 'https://orka.test.aliaddo.net',
        'api_token' => 'company-private-token',
        'invoice_code' => '02',
        'type_operation' => '10',
        'mode' => 'Test',
        'test_set_id' => '550e8400-e29b-41d4-a716-446655440001',
        'prefix' => 'SETP',
        'next_consecutive' => 501,
        'currency_code' => 'COP',
        'payment_mean_code' => '10',
        'region_code' => '11',
        'region_name' => 'Bogotá',
        'city_code' => '11001',
        'city_name' => 'Bogotá, D.c. (DC)',
        'country_code' => 'CO',
        'resolution_key' => 'resolution-key',
        'resolution_number' => 18760000001,
        'range_initial' => 500,
        'range_final' => 999,
        'resolution_valid_from' => '2025-01-01',
        'resolution_valid_until' => '2030-01-01',
    ];

    $this->actingAs($this->company)
        ->post(route('settings.aliaddo.store'), $baseSettings)
        ->assertSessionHasErrors(['incoterms']);

    $this->actingAs($this->company)
        ->post(route('settings.aliaddo.store'), [...$baseSettings, 'incoterms' => 'CFR'])
        ->assertRedirect();

    expect($this->aliaddoSettings->fresh()->configuration['incoterms'])->toBe('CFR');
});

test('accepts a payment method from the Aliaddo catalog', function () {
    $this->actingAs($this->company)
        ->post(route('settings.aliaddo.store'), [
            'enabled' => false,
            'base_url' => 'https://orka.test.aliaddo.net',
            'payment_mean_code' => '48',
        ])
        ->assertRedirect();

    expect($this->aliaddoSettings->fresh()->configuration['payment_mean_code'])->toBe('48');
});

test('validates Colombian department and city codes against the Aliaddo catalogs', function () {
    $this->actingAs($this->company)
        ->post(route('settings.aliaddo.store'), [
            'enabled' => false,
            'base_url' => 'https://orka.test.aliaddo.net',
            'country_code' => 'CO',
            'region_code' => '25',
            'region_name' => 'Antioquia',
            'city_code' => '11001',
            'city_name' => 'Bogotá, D.c. (DC)',
        ])
        ->assertSessionHasErrors(['region_name', 'city_code', 'city_name']);

    $this->actingAs($this->company)
        ->post(route('settings.aliaddo.store'), [
            'enabled' => false,
            'base_url' => 'https://orka.test.aliaddo.net',
            'country_code' => 'CO',
            'region_code' => '11',
            'region_name' => 'Bogotá',
            'city_code' => '11001',
            'city_name' => 'Bogotá, D.c. (DC)',
        ])
        ->assertRedirect();
});

test('accepts a tax code from the Aliaddo tax catalog', function () {
    $this->actingAs($this->company)
        ->post(route('settings.aliaddo.store'), [
            'enabled' => false,
            'base_url' => 'https://orka.test.aliaddo.net',
            'tax_code' => '01',
        ])
        ->assertRedirect();

    expect($this->aliaddoSettings->fresh()->configuration['tax_code'])->toBe('01');
});
