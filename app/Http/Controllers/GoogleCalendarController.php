<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Services\GoogleCalendarService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GoogleCalendarController extends Controller
{
    protected $calendarService;

    public function __construct(GoogleCalendarService $calendarService)
    {
        $this->calendarService = $calendarService;
    }

    public function syncEvents(Request $request)
    {
        try {
            // Check if Google Calendar is enabled and configured
            $userId = createdBy();
            $settings = Setting::where('user_id', $userId)
                ->whereIn('key', ['googleCalendarEnabled', 'googleCalendarId', 'googleCalendarJsonPath'])
                ->pluck('value', 'key');

            $isEnabled = ($settings['googleCalendarEnabled'] ?? '0') === '1';

            if (!$isEnabled) {
                return response()->json([
                    'success' => false,
                    'message' => 'Google Calendar not enabled. Please enable it in settings.',
                    'needsConfig' => true
                ]);
            }

            if (empty($settings['googleCalendarId']) || empty($settings['googleCalendarJsonPath'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Google Calendar credentials not configured. Please configure Calendar ID and JSON credentials in settings.',
                    'needsConfig' => true
                ]);
            }

            // Check if JSON file exists
            $jsonPath = storage_path('app/public/' . $settings['googleCalendarJsonPath']);
            if (!file_exists($jsonPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Google Calendar JSON file not found. Please upload the service account JSON file.',
                    'needsConfig' => true
                ]);
            }

            // Fetch events from Google Calendar
            $events = $this->calendarService->getEvents($userId, 100);

            return response()->json([
                'success' => true,
                'message' => 'Calendar events synchronized successfully',
                'events' => $events
            ]);
        } catch (\Exception $e) {
            \Log::error('Google Calendar sync failed', [
                'error' => $e->getMessage(),
                'user_id' => createdBy(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to sync calendar events: ' . $e->getMessage(),
                'needsAuth' => str_contains($e->getMessage(), 'not authorized') || str_contains($e->getMessage(), 'expired')
            ]);
        }
    }
}
