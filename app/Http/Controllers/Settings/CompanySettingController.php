<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CompanySettingController extends Controller
{
    /**
     * Update the company settings.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request)
    {
        try {
            $validated = $request->validate([
                'companyName' => 'required|string|max:255',
                'companyAddress' => 'required|string|max:500',
                'companyCity' => 'required|string|max:100',
                'companyState' => 'required|string|max:100',
                'companyZipCode' => 'required|string|max:20',
                'companyCountry' => 'required|string|max:100',
                'companyTelephone' => 'required|string|max:20',
            ]);

            $userId = auth()->id();
            foreach ($validated as $key => $value) {
                updateSetting($key, $value, $userId);
            }

            return redirect()->back()->with('success', __('Company settings updated successfully.'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', __('Failed to update company settings: :error', ['error' => $e->getMessage()]));
        }
    }
}