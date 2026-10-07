<?php

namespace App\Http\Controllers;

use App\Models\Quotation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;

class PublicQuotationController extends Controller
{
    public function show(Request $request, $id)
    {
        $quotation = Quotation::with(['customer', 'branch', 'items.product.taxes'])
            ->whereRaw('MD5(id) = ?', [$id])
            ->firstOrFail();

        $companyUser = \App\Models\User::find($quotation->created_by);
        $settings = settings($quotation->created_by);

        // Load company currency settings
        $currencyCode = $settings['defaultCurrency'] ?? 'USD';
        $currency = \App\Models\Currency::where('code', $currencyCode)->first();
        $companyCurrencySettings = [
            'symbol'           => $currency ? $currency->symbol : '$',
            'decimalFormat'    => $settings['decimalFormat'] ?? '2',
            'thousandsSeparator' => $settings['thousandsSeparator'] ?? ',',
            'symbolSpace'      => ($settings['currencySymbolSpace'] ?? '0') === '1',
            'symbolPosition'   => $settings['currencySymbolPosition'] ?? 'before',
        ];

        return Inertia::render('PublicQuotation/Show', [
            'quotation' => $quotation,
            'settings' => $settings,
            'companyCurrencySettings' => $companyCurrencySettings,
            'auth' => [
                'user' => [
                    'company_name' => $companyUser->company_name ?? $companyUser->name ?? '',
                    'name' => $companyUser->name ?? ''
                ]
            ]
        ]);
    }

    public function approve(Request $request, $id)
    {
        $quotation = Quotation::findOrFail($id);

        if ($quotation->status !== 'sent') {
            return response()->json(['message' => 'Quotation already processed'], 400);
        }

        $quotation->update(['status' => 'approved']);

        return response()->json(['message' => 'Quotation approved successfully']);
    }

    public function reject(Request $request, $id)
    {
        $quotation = Quotation::findOrFail($id);

        if ($quotation->status !== 'sent') {
            return response()->json(['message' => 'Quotation already processed'], 400);
        }

        $quotation->update(['status' => 'rejected']);

        return response()->json(['message' => 'Quotation rejected successfully']);
    }
}
