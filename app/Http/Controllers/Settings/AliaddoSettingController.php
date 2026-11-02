<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\AliaddoSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class AliaddoSettingController extends Controller
{
    private const CONFIGURATION_FIELDS = [
        'invoice_code',
        'type_operation',
        'mode',
        'format',
        'test_set_id',
        'prefix',
        'next_consecutive',
        'currency_code',
        'payment_mean_code',
        'term_days',
        'unit_measurement_code',
        'unit_measurement_name',
        'standard_type',
        'standard_code',
        'tax_code',
        'region_code',
        'region_name',
        'city_code',
        'city_name',
        'country_code',
        'country_name',
        'resolution_key',
        'resolution_prefix',
        'resolution_number',
        'range_initial',
        'range_final',
        'resolution_valid_from',
        'resolution_valid_until',
        'default_person_type',
        'default_regime_type',
        'default_identification_type_code',
        'default_responsible_for',
        'default_responsibilities',
    ];

    public function store(Request $request)
    {
        abort_unless(auth()->user()?->type === 'company', 403);

        $companyId = auth()->id();
        $current = AliaddoSetting::firstWhere('company_id', $companyId);
        $required = $request->boolean('enabled') ? 'required' : 'nullable';

        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'base_url' => ['required', 'url', 'starts_with:https://', 'max:255'],
            'api_token' => ['nullable', 'string', 'max:10000'],
            'invoice_code' => [$required, 'string', 'max:10'],
            'type_operation' => [$required, 'string', 'max:40'],
            'mode' => [$required, 'in:Test,Production'],
            'format' => [$required, 'string', 'max:30'],
            'test_set_id' => [$request->input('mode') === 'Test' && $request->boolean('enabled') ? 'required' : 'nullable', 'string', 'max:100'],
            'prefix' => [$required, 'string', 'max:30'],
            'next_consecutive' => [$required, 'integer', 'min:1'],
            'currency_code' => [$required, 'string', 'size:3'],
            'payment_mean_code' => [$required, 'string', 'max:10'],
            'term_days' => ['nullable', 'integer', 'min:0', 'max:3650'],
            'unit_measurement_code' => [$required, 'string', 'max:10'],
            'unit_measurement_name' => [$required, 'string', 'max:50'],
            'standard_type' => [$required, 'string', 'max:10'],
            'standard_code' => [$required, 'string', 'max:30'],
            'tax_code' => [$required, 'string', 'max:10'],
            'region_code' => [$required, 'string', 'max:10'],
            'region_name' => [$required, 'string', 'max:100'],
            'city_code' => [$required, 'string', 'max:10'],
            'city_name' => [$required, 'string', 'max:100'],
            'country_code' => [$required, 'string', 'size:2'],
            'country_name' => [$required, 'string', 'max:100'],
            'resolution_key' => [$required, 'string', 'max:255'],
            'resolution_prefix' => ['nullable', 'string', 'max:30'],
            'resolution_number' => [$required, 'integer', 'min:1'],
            'range_initial' => [$required, 'integer', 'min:1'],
            'range_final' => [$required, 'integer', 'gte:range_initial'],
            'resolution_valid_from' => [$required, 'date'],
            'resolution_valid_until' => [$required, 'date', 'after_or_equal:resolution_valid_from'],
            'default_person_type' => [$required, 'string', 'max:10'],
            'default_regime_type' => [$required, 'string', 'max:10'],
            'default_identification_type_code' => [$required, 'string', 'max:10'],
            'default_responsible_for' => [$required, 'string', 'max:20'],
            'default_responsibilities' => [$required, 'string', 'max:100'],
        ]);

        if ($request->boolean('enabled') && blank($validated['api_token'] ?? null) && blank($current?->api_token)) {
            return back()->withErrors([
                'api_token' => __('Provide the Aliaddo API token before enabling electronic invoicing.'),
            ]);
        }

        $attributes = [
            'company_id' => $companyId,
            'base_url' => $validated['base_url'],
            'configuration' => Arr::only($validated, self::CONFIGURATION_FIELDS),
            'enabled' => $request->boolean('enabled'),
        ];

        if (filled($validated['api_token'] ?? null)) {
            $token = preg_replace('/^Authorization:\s*/i', '', trim($validated['api_token']));
            $attributes['api_token'] = trim(preg_replace('/^Bearer\s+/i', '', $token));
        }

        AliaddoSetting::updateOrCreate(
            ['company_id' => $companyId],
            $attributes,
        );

        return back()->with('success', __('Aliaddo electronic invoicing settings saved successfully.'));
    }
}
