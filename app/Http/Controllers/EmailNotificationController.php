<?php

namespace App\Http\Controllers;

use App\Models\EmailNotificationSetting;
use App\Models\EmailTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EmailNotificationController extends Controller
{
    public function getSettings()
    {
        $user = Auth::user();
        $templates = EmailTemplate::all();
        
        $settings = [];
        foreach ($templates as $template) {
            $setting = EmailNotificationSetting::where('user_id', $user->id)
                ->where('template_name', $template->name)
                ->first();
                
            $settings[$template->name] = $setting ? $setting->is_enabled : true;
        }
        
        return response()->json($settings);
    }
    
    public function updateSettings(Request $request)
    {
        $user = Auth::user();
        $settings = $request->input('settings', []);
        
        foreach ($settings as $templateName => $isEnabled) {
            EmailNotificationSetting::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'template_name' => $templateName
                ],
                [
                    'is_enabled' => (bool) $isEnabled
                ]
            );
        }
        
        return response()->json(['message' => __('Notification settings updated successfully')]);
    }
}