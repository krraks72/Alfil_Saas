<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\NotificationTemplate;
use App\Models\UserNotificationTemplate;
use App\Services\TwilioService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TwilioSettingController extends Controller
{
    public function getAvailableNotifications()
    {
        $templates = NotificationTemplate::where('type', 'twilio')->select(['id', 'name'])->get();
        $notifications = [];

        foreach ($templates as $template) {
            $notifications[] = [
                'name' => $template->name,
                'label' => $template->name
            ];
        }

        return response()->json($notifications);
    }

    public function getNotifications()
    {
        $user = Auth::user();
        $templates = NotificationTemplate::where('type', 'twilio')->select(['id', 'name'])->get();
        $settings = [];

        foreach ($templates as $template) {
            $userTemplate = UserNotificationTemplate::where('user_id', $user->id)
                ->where('template_id', $template->id)
                ->where('type', 'twilio')
                ->first();

            $settings[$template->name] = $userTemplate ? $userTemplate->is_active : false;
        }

        return response()->json($settings);
    }
    public function update(Request $request)
    {
        $request->validate([
            'account_sid' => 'required|string',
            'auth_token' => 'required|string',
            'from_number' => 'required|string',
            'notification_settings' => 'nullable|array',
            'sms_notifications' => 'nullable|array'
        ]);

        try {
            $user = Auth::user();
            
            // Update Twilio settings
            Setting::updateOrCreate(
                ['user_id' => $user->id, 'key' => 'twilio_account_sid'],
                ['value' => $request->account_sid]
            );
            
            Setting::updateOrCreate(
                ['user_id' => $user->id, 'key' => 'twilio_auth_token'],
                ['value' => $request->auth_token]
            );
            
            Setting::updateOrCreate(
                ['user_id' => $user->id, 'key' => 'twilio_from_number'],
                ['value' => $request->from_number]
            );

            // Update notification settings
            $availableTemplates = NotificationTemplate::where('type', 'twilio')->pluck('name', 'id')->toArray();
            foreach ($availableTemplates as $templateId => $templateName) {
                if (isset($request->$templateName)) {
                    UserNotificationTemplate::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'template_id' => $templateId,
                            'type' => 'twilio'
                        ],
                        ['is_active' => $request->$templateName]
                    );
                }
            }

            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json(['success' => true, 'message' => __('Twilio settings updated successfully')]);
            }
            return redirect()->back()->with('success', __('Twilio settings updated successfully'));
        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json(['success' => false, 'message' => __('Failed to update Twilio settings: :error', ['error' => $e->getMessage()])], 422);
            }
            return redirect()->back()->with('error', __('Failed to update Twilio settings: :error', ['error' => $e->getMessage()]));
        }
    }

    public function test(Request $request)
    {
        $request->validate([
            'phone' => 'required|string'
        ]);

        // Check if Twilio settings are configured
        $user = Auth::user();
        $settingsUserId = $user->id;
        if ($user->type !== 'company' && $user->created_by) {
            $settingsUserId = $user->created_by;
        }
        
        $accountSid = Setting::where('user_id', $settingsUserId)->where('key', 'twilio_account_sid')->value('value');
        $authToken = Setting::where('user_id', $settingsUserId)->where('key', 'twilio_auth_token')->value('value');
        $fromNumber = Setting::where('user_id', $settingsUserId)->where('key', 'twilio_from_number')->value('value');
        
        if (!$accountSid || !$authToken || !$fromNumber) {
            return redirect()->back()->with('error', __('Please configure Twilio settings first'));
        }

        try {
            $twilioService = app(TwilioService::class);
            $message = 'Test SMS from ' . config('app.name') . ' - ' . now()->format('Y-m-d H:i:s');
            
            $result = $twilioService->sendSms($request->phone, $message);

            if ($result) {
                if ($request->expectsJson() || $request->wantsJson()) {
                    return response()->json(['success' => true, 'message' => __('Test SMS sent successfully to :phone', ['phone' => $request->phone])]);
                }
                return redirect()->back()->with('success', __('Test SMS sent successfully to :phone', ['phone' => $request->phone]));
            } else {
                if ($request->expectsJson() || $request->wantsJson()) {
                    return response()->json(['success' => false, 'message' => __('Failed to send test SMS. Please check your Twilio credentials and try again.')], 422);
                }
                return redirect()->back()->with('error', __('Failed to send test SMS. Please check your Twilio credentials and try again.'));
            }
        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json(['success' => false, 'message' => __('Twilio Error: :error', ['error' => $e->getMessage()])], 422);
            }
            return redirect()->back()->with('error', __('Twilio Error: :error', ['error' => $e->getMessage()]));
        }
    }
}