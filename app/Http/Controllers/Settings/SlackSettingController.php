<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\NotificationTemplate;
use App\Models\UserNotificationTemplate;
use App\Services\SlackService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SlackSettingController extends Controller
{
    protected $slackService;

    public function __construct(SlackService $slackService)
    {
        $this->slackService = $slackService;
    }

    public function getConfig()
    {
        $user = Auth::user();
        
        $settings = Setting::where('user_id', $user->id)
            ->whereIn('key', ['slack_webhook_url', 'slack_enabled'])
            ->pluck('value', 'key');

        return response()->json([
            'slack_webhook_url' => $settings['slack_webhook_url'] ?? '',
            'slack_enabled' => ($settings['slack_enabled'] ?? '0') === '1'
        ]);
    }

    public function getNotifications()
    {
        $user = Auth::user();
        $templates = NotificationTemplate::where('type', 'slack')->select(['id', 'name'])->get();
        $settings = [];

        foreach ($templates as $template) {
            $userTemplate = UserNotificationTemplate::where('user_id', $user->id)
                ->where('template_id', $template->id)
                ->where('type', 'slack')
                ->first();

            $settings[$template->name] = $userTemplate ? $userTemplate->is_active : false;
        }

        return response()->json($settings);
    }

    public function getAvailableNotifications()
    {
        $templates = NotificationTemplate::where('type', 'slack')->select(['id', 'name'])->get();
        $notifications = [];

        foreach ($templates as $template) {
            $notifications[] = [
                'name' => $template->name,
                'label' => $template->name
            ];
        }

        return response()->json($notifications);
    }

    public function update(Request $request)
    {
        $user = Auth::user();
        
        $request->validate([
            'slack_enabled' => 'required|boolean',
            'slack_webhook_url' => 'nullable|url'
        ]);

        // Update Slack configuration
        Setting::updateOrCreate(
            ['user_id' => $user->id, 'key' => 'slack_enabled'],
            ['value' => $request->slack_enabled ? '1' : '0']
        );

        Setting::updateOrCreate(
            ['user_id' => $user->id, 'key' => 'slack_webhook_url'],
            ['value' => $request->slack_webhook_url ?? '']
        );

        // Update notification settings
        $availableTemplates = NotificationTemplate::where('type', 'slack')->pluck('name', 'id')->toArray();
        foreach ($availableTemplates as $templateId => $templateName) {
            if (isset($request->$templateName)) {
                UserNotificationTemplate::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'template_id' => $templateId,
                        'type' => 'slack'
                    ],
                    ['is_active' => $request->$templateName]
                );
            }
        }

        return back()->with('success', 'Slack settings updated successfully.');
    }

    public function testWebhook(Request $request)
    {
        $request->validate([
            'webhook_url' => 'required|url'
        ]);

        try {
            $result = $this->slackService->sendTestMessage($request->webhook_url);
            
            if ($result) {
                return back()->with('success', 'Test message sent successfully to Slack!');
            } else {
                return back()->with('error', 'Failed to send test message to Slack.');
            }
        } catch (\Exception $e) {
            return back()->with('error', 'Error: ' . $e->getMessage());
        }
    }
}