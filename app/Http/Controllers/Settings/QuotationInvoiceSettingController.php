<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class QuotationInvoiceSettingController extends Controller
{
    /**
     * Store quotation invoice settings.
     */
    public function store(Request $request)
    {
        $request->validate([
            'quotation_invoice_template' => 'required|string',
            'quotation_invoice_qr_display' => 'boolean',
            'quotation_invoice_color' => 'required|string',
            'quotation_invoice_footer_title' => 'nullable|string',
            'quotation_invoice_footer_notes' => 'nullable|string',
        ]);

        $user = Auth::user();
        $userId = $user->type === 'company' ? $user->id : $user->created_by;

        $settings = [
            'quotation_invoice_template' => $request->quotation_invoice_template,
            'quotation_invoice_qr_display' => $request->quotation_invoice_qr_display ? 'true' : 'false',
            'quotation_invoice_color' => $request->quotation_invoice_color,
            'quotation_invoice_footer_title' => $request->quotation_invoice_footer_title ?? '',
            'quotation_invoice_footer_notes' => $request->quotation_invoice_footer_notes ?? '',
        ];

        foreach ($settings as $key => $value) {
            Setting::updateOrCreate(
                ['user_id' => $userId, 'key' => $key],
                ['value' => $value]
            );
        }

        return redirect()->back()->with('success', 'quotation invoice settings updated successfully.');
    }
}
