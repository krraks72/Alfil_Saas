<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class ZoomSettingsController extends Controller
{
    public function update(Request $request)
    {
        $validated = $request->validate([
            'zoom_account_id' => 'required|string|max:255',
            'zoom_client_id' => 'required|string|max:255', 
            'zoom_client_secret' => 'required|string|max:255',
            'zoom_enabled' => 'boolean',
        ]);

        $userId = auth()->user()->isSuperAdmin() ? null : auth()->id();

        foreach ($validated as $key => $value) {
            Setting::updateOrCreate(
                ['user_id' => $userId, 'key' => $key],
                ['value' => $value]
            );
        }

        return back()->with('success', __('Zoom settings updated successfully'));
    }
}