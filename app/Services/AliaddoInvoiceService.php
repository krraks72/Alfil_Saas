<?php

namespace App\Services;

use App\Models\AliaddoSetting;
use App\Models\Sale;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\DB;

class AliaddoInvoiceService
{
    public function __construct(private readonly AliaddoClient $client) {}

    public function issueForSale(Sale $sale): ?array
    {
        $settings = AliaddoSetting::where('company_id', $sale->created_by)->first();

        if (! $settings || ! $settings->enabled) {
            return null;
        }

        $claim = DB::transaction(function () use ($sale) {
            $lockedSale = Sale::whereKey($sale->id)->lockForUpdate()->firstOrFail();

            if ($lockedSale->aliaddo_status === 'issued') {
                return 'issued';
            }

            if ($lockedSale->aliaddo_status === 'pending') {
                return 'pending';
            }

            if ($lockedSale->status !== 'completed') {
                throw new AliaddoInvoiceException('Only completed sales can be invoiced.');
            }

            $lockedSale->forceFill(['aliaddo_status' => 'pending', 'aliaddo_error' => null])->save();

            return 'claimed';
        });

        if ($claim === 'issued') {
            $sale->refresh();

            return [
                'status' => 'issued',
                'prefix' => $sale->aliaddo_prefix,
                'consecutive' => $sale->aliaddo_consecutive,
            ];
        }

        if ($claim === 'pending') {
            throw new AliaddoInvoiceException('La emisión de la factura para esta venta ya está en proceso.');
        }

        $sale->loadMissing(['customer', 'branch', 'items.product.taxes', 'items.product.brand', 'items.product.unit']);

        try {
            $this->validateSale($sale);
            $document = $this->buildDocument($sale, $settings, 1);
            $consecutive = $this->reserveConsecutive($settings);
            $document['consecutive'] = $consecutive;
            $response = $this->client->createInvoice($document, $settings);

            if (! $response->successful()) {
                throw new AliaddoInvoiceException('Aliaddo rechazó la factura (HTTP '.$response->status().').');
            }
        } catch (AliaddoNotConfiguredException|ConnectionException|AliaddoInvoiceException $exception) {
            if ($exception instanceof ConnectionException) {
                report($exception);
                $message = 'No fue posible conectar con Aliaddo.';
            } else {
                $message = $exception->getMessage();
            }

            $sale->forceFill([
                'aliaddo_status' => 'failed',
                'aliaddo_error' => $message,
            ])->save();

            if ($exception instanceof AliaddoInvoiceException) {
                throw $exception;
            }

            throw new AliaddoInvoiceException($message, previous: $exception);
        }

        $providerDocumentId = $response->json('id')
            ?? $response->json('data.id')
            ?? $response->json('document.id');

        $sale->forceFill([
            'aliaddo_status' => 'issued',
            'aliaddo_document_id' => is_scalar($providerDocumentId) ? (string) $providerDocumentId : null,
            'aliaddo_prefix' => $document['prefix'],
            'aliaddo_consecutive' => $consecutive,
            'aliaddo_error' => null,
        ])->save();

        return [
            'status' => 'issued',
            'prefix' => $document['prefix'],
            'consecutive' => $consecutive,
        ];
    }

    private function validateSale(Sale $sale): void
    {
        if (! $sale->customer) {
            throw new AliaddoInvoiceException('La venta no tiene un cliente con identificación tributaria.');
        }

        if (blank($sale->customer->identification)) {
            throw new AliaddoInvoiceException('Completa la identificación tributaria en la ficha del cliente.');
        }

        if (! $sale->branch) {
            throw new AliaddoInvoiceException('La venta no tiene una sucursal asociada.');
        }

        if (blank($sale->branch->name) || blank($sale->branch->address)) {
            throw new AliaddoInvoiceException('Completa el nombre y la dirección de la sucursal para facturar.');
        }

        if ($sale->items->isEmpty()) {
            throw new AliaddoInvoiceException('La venta no tiene productos para facturar.');
        }

        if ($sale->items->count() > 100) {
            throw new AliaddoInvoiceException('Aliaddo permite un máximo de 100 líneas por factura.');
        }
    }

    private function reserveConsecutive(AliaddoSetting $settings): int
    {
        return DB::transaction(function () use ($settings) {
            $lockedSettings = AliaddoSetting::whereKey($settings->id)->lockForUpdate()->firstOrFail();
            $configuration = $lockedSettings->configuration ?? [];
            $consecutive = (int) ($configuration['next_consecutive'] ?? 0);
            $rangeInitial = (int) ($configuration['range_initial'] ?? 0);
            $rangeFinal = (int) ($configuration['range_final'] ?? 0);

            if ($consecutive < 1 || $rangeInitial < 1 || $rangeFinal < $rangeInitial) {
                throw new AliaddoNotConfiguredException('Configura el consecutivo y el rango autorizado de la resolución DIAN.');
            }

            if ($consecutive < $rangeInitial || $consecutive > $rangeFinal) {
                throw new AliaddoNotConfiguredException('El consecutivo configurado está fuera del rango autorizado de la resolución DIAN.');
            }

            $configuration['next_consecutive'] = $consecutive + 1;
            $lockedSettings->configuration = $configuration;
            $lockedSettings->save();

            return $consecutive;
        });
    }

    private function buildDocument(Sale $sale, AliaddoSetting $settings, int $consecutive): array
    {
        $configuration = $settings->configuration ?? [];
        $required = [
            'invoice_code',
            'type_operation',
            'mode',
            'prefix',
            'currency_code',
            'payment_mean_code',
            'region_code',
            'region_name',
            'city_code',
            'city_name',
            'resolution_key',
            'resolution_number',
            'resolution_valid_from',
            'resolution_valid_until',
            'range_initial',
            'range_final',
            'country_code',
        ];

        foreach ($required as $key) {
            if (blank($configuration[$key] ?? null)) {
                throw new AliaddoNotConfiguredException("Completa el campo requerido de Aliaddo: {$key}.");
            }
        }

        $today = now()->toDateString();
        if ($today < $configuration['resolution_valid_from'] || $today > $configuration['resolution_valid_until']) {
            throw new AliaddoNotConfiguredException('La resolución DIAN configurada no está vigente en la fecha de emisión.');
        }

        if ($configuration['mode'] === 'Test' && blank($configuration['test_set_id'] ?? null)) {
            throw new AliaddoNotConfiguredException('Configura el identificador de pruebas de Aliaddo.');
        }

        if ($configuration['invoice_code'] === '02' && blank($configuration['incoterms'] ?? null)) {
            throw new AliaddoNotConfiguredException('Configura un código INCOTERMS para emitir facturas de exportación.');
        }

        $customer = $sale->customer;
        $date = $sale->sale_date->toDateString();
        $lineItems = [];
        $unitCatalogPath = resource_path('data/aliaddo-common-units.json');
        $unitCatalogContents = file_get_contents($unitCatalogPath);
        if ($unitCatalogContents === false) {
            throw new \RuntimeException("Unable to read Aliaddo unit catalog: {$unitCatalogPath}");
        }
        $unitCatalog = json_decode($unitCatalogContents, true, flags: JSON_THROW_ON_ERROR);
        $unitNamesByCode = array_column($unitCatalog, 'name', 'code');

        foreach ($sale->items as $item) {
            $product = $item->product;
            $unitCode = $product?->aliaddo_unit_measurement_code;
            if (blank($unitCode) || ! isset($unitNamesByCode[$unitCode])) {
                throw new AliaddoInvoiceException("Configura el código de unidad de medida Aliaddo en el producto {$item->product_name}.");
            }

            $base = (float) $item->unit_price * (int) $item->quantity;
            $taxes = [];

            foreach ($product->taxes as $tax) {
                if (blank($configuration['tax_code'] ?? null)) {
                    throw new AliaddoNotConfiguredException('Configura el código de impuesto Aliaddo para los productos gravados.');
                }

                $amount = $tax->type === 'percentage'
                    ? $base * (float) $tax->rate / 100
                    : (float) $tax->rate * (int) $item->quantity;

                $taxes[] = [
                    'name' => $tax->name,
                    'code' => $configuration['tax_code'],
                    'type' => $tax->type === 'percentage' ? 'P' : 'F',
                    'rate' => (float) $tax->rate,
                    'amount' => round($amount, 2),
                    'base' => round($base, 2),
                ];
            }

            $line = [
                'code' => $item->product_sku ?: (string) $item->product_id,
                'name' => $item->product_name,
                'modelName' => $product->name,
                'description' => $product->description ?? $item->product_name,
                'unitMeasurementCode' => $unitCode,
                'price' => (float) $item->unit_price,
                'quantity' => (int) $item->quantity,
            ];

            foreach ([
                'brandName' => $product->brand?->name,
                'itemCodeSupplier' => $item->product_sku,
                'unitMeasurementName' => $unitNamesByCode[$unitCode],
                'standardType' => $configuration['standard_type'] ?? null,
                'standardCode' => $configuration['standard_code'] ?? null,
            ] as $key => $value) {
                if (filled($value)) {
                    $line[$key] = $value;
                }
            }

            if ((float) $item->discount_amount !== 0.0) {
                $line['discountAmount'] = (float) $item->discount_amount;
            }

            if ($taxes !== []) {
                $line['taxes'] = $taxes;
            }

            $lineItems[] = $line;
        }

        $billingAddress = [
            'address' => $customer->billing_address,
            'countryName' => $customer->billing_country ?: ($configuration['country_name'] ?? null),
            'countryCode' => $configuration['country_code'],
            'regionName' => $customer->billing_state ?: $configuration['region_name'],
            'regionCode' => $customer->billing_region_code ?: $configuration['region_code'],
            'cityName' => $customer->billing_city ?: $configuration['city_name'],
            'cityCode' => $customer->billing_city_code ?: $configuration['city_code'],
            'postalCode' => $customer->billing_postal_code,
            'phone' => $customer->phone,
            'contactName' => $customer->name,
        ];

        $shippingAddress = $customer->same_as_billing ? $billingAddress : [
            'address' => $customer->shipping_address ?: $customer->billing_address,
            'countryName' => $customer->shipping_country ?: $billingAddress['countryName'],
            'countryCode' => $configuration['country_code'],
            'regionName' => $customer->shipping_state ?: $billingAddress['regionName'],
            'regionCode' => $customer->billing_region_code ?: $configuration['region_code'],
            'cityName' => $customer->shipping_city ?: $billingAddress['cityName'],
            'cityCode' => $customer->billing_city_code ?: $configuration['city_code'],
            'postalCode' => $customer->shipping_postal_code ?: $customer->billing_postal_code,
            'phone' => $customer->phone,
            'contactName' => $customer->name,
        ];

        foreach ([
            'address',
            'countryName',
            'countryCode',
            'regionName',
            'regionCode',
            'cityName',
            'cityCode',
        ] as $key) {
            if (blank($billingAddress[$key] ?? null)) {
                throw new AliaddoInvoiceException("Completa el campo {$key} de la dirección de facturación del comprador.");
            }
        }

        $customerDocument = [
            'companyName' => $customer->name,
            'personType' => (string) ($customer->person_type ?: ($configuration['default_person_type'] ?? '')),
            'regimeType' => $customer->regime_type ?: ($configuration['default_regime_type'] ?? null),
            'firstName' => $customer->first_name ?: $customer->name,
            'lastName' => $customer->last_name,
            'identification' => $customer->identification,
            'digitCheck' => $customer->digit_check ?? '',
            'identificationTypeCode' => $customer->identification_type_code ?: ($configuration['default_identification_type_code'] ?? null),
            'responsibilities' => $customer->responsibilities ?: ($configuration['default_responsibilities'] ?? null),
            'BillingAddress' => $billingAddress,
            'ShippingAddress' => $shippingAddress,
        ];

        foreach ([
            'email' => $customer->email,
            'phone' => $customer->phone,
            'responsibleFor' => $customer->responsible_for ?: ($configuration['default_responsible_for'] ?? null),
            'economicActivities' => $customer->economic_activities,
        ] as $key => $value) {
            if (filled($value)) {
                $customerDocument[$key] = $value;
            }
        }

        foreach ([
            'companyName',
            'personType',
            'regimeType',
            'firstName',
            'lastName',
            'identification',
            'identificationTypeCode',
            'responsibilities',
        ] as $key) {
            if (blank($customerDocument[$key] ?? null)) {
                throw new AliaddoInvoiceException("Completa el campo fiscal obligatorio del comprador en Aliaddo: {$key}.");
            }
        }

        $resolution = [
            'key' => $configuration['resolution_key'],
            'prefix' => ($configuration['resolution_prefix'] ?? '') ?: $configuration['prefix'],
            'number' => (int) $configuration['resolution_number'],
            'rangeInitial' => (int) $configuration['range_initial'],
            'rangeFinal' => (int) $configuration['range_final'],
            'validFrom' => $configuration['resolution_valid_from'],
            'validUntil' => $configuration['resolution_valid_until'],
        ];

        $document = [
            'code' => $configuration['invoice_code'],
            'typeOperation' => $configuration['type_operation'],
            'mode' => $configuration['mode'],
            'prefix' => $configuration['prefix'],
            'consecutive' => $consecutive,
            'orderReference' => $sale->sale_number,
            'currencyCode' => $configuration['currency_code'],
            'currencyRate' => 0,
            'issuedAt' => $date,
            'dueAt' => $sale->sale_date->copy()->addDays((int) ($configuration['term_days'] ?? 0))->toDateString(),
            'periodStartDate' => $date,
            'periodEndDate' => $date,
            'deliveryAt' => $date,
            'termDay' => (int) ($configuration['term_days'] ?? 0),
            'paymentMeanCode' => $configuration['payment_mean_code'],
            'branch' => [
                'name' => $sale->branch->name,
                'address' => $sale->branch->address,
                'regionCode' => $configuration['region_code'],
                'regionName' => $configuration['region_name'],
                'cityCode' => $configuration['city_code'],
                'cityName' => $configuration['city_name'],
                'phone' => $sale->branch->phone ?? '',
            ],
            'resolution' => $resolution,
            'customer' => $customerDocument,
            'lines' => $lineItems,
            'totals' => [
                'amount' => (float) $sale->subtotal,
                'prepaymentAmount' => 0,
                'taxesAmount' => (float) $sale->tax_amount,
                'withholdingAmount' => 0,
                'discountsAmount' => (float) $sale->discount_amount,
                'chargesAmount' => 0,
            ],
        ];

        if (filled($configuration['format'] ?? null)) {
            $document['format'] = $configuration['format'];
        }

        if ($configuration['invoice_code'] === '02') {
            $document['incoterms'] = $configuration['incoterms'];
        }

        if ($configuration['mode'] === 'Test') {
            $document['testSetId'] = $configuration['test_set_id'];
        }

        return $document;
    }
}
