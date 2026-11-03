<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\AliaddoSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

class AliaddoSettingController extends Controller
{
    private const COLOMBIAN_DEPARTMENTS = [
        '91' => 'Amazonas',
        '05' => 'Antioquia',
        '81' => 'Arauca',
        '08' => 'Atlántico',
        '11' => 'Bogotá',
        '13' => 'Bolívar',
        '15' => 'Boyacá',
        '17' => 'Caldas',
        '18' => 'Caquetá',
        '85' => 'Casanare',
        '19' => 'Cauca',
        '20' => 'Cesar',
        '27' => 'Chocó',
        '23' => 'Córdoba',
        '25' => 'Cundinamarca',
        '94' => 'Guainía',
        '95' => 'Guaviare',
        '41' => 'Huila',
        '44' => 'La Guajira',
        '47' => 'Magdalena',
        '50' => 'Meta',
        '52' => 'Nariño',
        '54' => 'Norte de Santander',
        '86' => 'Putumayo',
        '63' => 'Quindío',
        '66' => 'Risaralda',
        '88' => 'San Andrés y Providencia',
        '68' => 'Santander',
        '70' => 'Sucre',
        '73' => 'Tolima',
        '76' => 'Valle del Cauca',
        '97' => 'Vaupés',
        '99' => 'Vichada',
    ];

    private const CONFIGURATION_FIELDS = [
        'invoice_code',
        'type_operation',
        'mode',
        'format',
        'incoterms',
        'test_set_id',
        'prefix',
        'next_consecutive',
        'currency_code',
        'payment_mean_code',
        'term_days',
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
        $user = $request->user();
        abort_unless($user instanceof User && $user->type === 'company', 403);

        $companyId = $user->getKey();
        $current = AliaddoSetting::firstWhere('company_id', $companyId);
        $required = $request->boolean('enabled') ? 'required' : 'nullable';
        $regionCodeRules = [$required, 'string', 'max:10'];
        $regionNameRules = [$required, 'string', 'max:100'];
        $cityCodeRules = [$required, 'string', 'max:10'];
        $cityNameRules = [$required, 'string', 'max:100'];

        if ($request->input('country_code') === 'CO') {
            $departmentCode = (string) $request->input('region_code');
            $regionCodeRules[] = Rule::in(array_keys(self::COLOMBIAN_DEPARTMENTS));
            $regionNameRules[] = Rule::in(isset(self::COLOMBIAN_DEPARTMENTS[$departmentCode])
                ? [self::COLOMBIAN_DEPARTMENTS[$departmentCode]]
                : []);

            $catalogPath = resource_path('data/aliaddo-colombia-cities.json');
            $catalogContents = file_get_contents($catalogPath);
            if ($catalogContents === false) {
                throw new \RuntimeException("Unable to read Aliaddo city catalog: {$catalogPath}");
            }

            $cities = json_decode($catalogContents, true, flags: JSON_THROW_ON_ERROR);
            $citiesByCode = array_column(
                array_filter($cities, fn (array $city) => str_starts_with($city['code'], $departmentCode)),
                'name',
                'code',
            );
            $cityCodeRules[] = Rule::in(array_keys($citiesByCode));
            $cityCode = (string) $request->input('city_code');
            $cityNameRules[] = Rule::in(isset($citiesByCode[$cityCode]) ? [$citiesByCode[$cityCode]] : []);
        }

        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'base_url' => ['required', 'url', 'starts_with:https://', 'max:255'],
            'api_token' => ['nullable', 'string', 'max:10000'],
            'invoice_code' => [$required, 'in:01,02,03,04,05,07,08,20,25,27,30,35,40,45,50,55,60,91,92,93,94,95'],
            'type_operation' => [$required, 'in:09,10,11,12,14,15,16,20,22,25,27,32,35,271,272,273,274,321,322,551,552,601,602,SS-CUDE,SS-CUFE,SS-POS,SS-SNum,SS-Reporte,SS-SinAporte,SS-Recaudo'],
            'mode' => [$required, 'in:Test,Production'],
            'format' => ['nullable', 'in:Estandar,Azul,Continental,Indigo,FacturaExportacion,MediaCarta,Tirilla'],
            'incoterms' => [
                $request->boolean('enabled') && $request->input('invoice_code') === '02' ? 'required' : 'nullable',
                'in:CFR,CIF,CIP,CPT,DAP,DDP,DPU,EXW,FAS,FCA,FOB',
            ],
            'test_set_id' => [$request->input('mode') === 'Test' && $request->boolean('enabled') ? 'required' : 'nullable', 'uuid'],
            'prefix' => [$required, 'string', 'max:8'],
            'next_consecutive' => [$required, 'integer', 'min:1'],
            'currency_code' => [$required, 'string', 'size:3'],
            'payment_mean_code' => [$required, 'in:10,13,14,30,31,42,48,49'],
            'term_days' => ['nullable', 'integer', 'min:0', 'max:3650'],
            'standard_type' => ['nullable', 'in:001,010,020,999'],
            'standard_code' => ['nullable', 'string', 'max:30'],
            'tax_code' => ['nullable', 'in:01,02,03,04,08,20,21,22,23,24,25,26,30,32,33,34,35,36,ZZ'],
            'region_code' => $regionCodeRules,
            'region_name' => $regionNameRules,
            'city_code' => $cityCodeRules,
            'city_name' => $cityNameRules,
            'country_code' => [$required, 'string', 'size:2'],
            'country_name' => ['nullable', 'string', 'max:100'],
            'resolution_key' => [$required, 'string', 'max:255'],
            'resolution_prefix' => ['nullable', 'string', 'max:8'],
            'resolution_number' => [$required, 'integer', 'min:1'],
            'range_initial' => [$required, 'integer', 'min:1'],
            'range_final' => [$required, 'integer', 'gte:range_initial'],
            'resolution_valid_from' => [$required, 'date'],
            'resolution_valid_until' => [$required, 'date', 'after_or_equal:resolution_valid_from'],
            'default_person_type' => ['nullable', 'in:1,2'],
            'default_regime_type' => ['nullable', 'in:48,49'],
            'default_identification_type_code' => ['nullable', 'in:11,12,13,21,22,31,41,42,47,48,50,91'],
            'default_responsible_for' => ['nullable', 'in:01,04,ZA,ZZ'],
            'default_responsibilities' => ['nullable', 'in:O-13,O-15,O-23,O-47,R-99-PN'],
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
