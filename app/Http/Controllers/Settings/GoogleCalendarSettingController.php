<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GoogleCalendarSettingController extends Controller
{
    public function update(Request $request)
    {

        try {
            $validated = $request->validate([
                'googleCalendarEnabled' => 'boolean',
                'googleCalendarId' => 'nullable|string|max:255',
                'googleCalendarJson' => 'nullable|file|mimes:json|max:2048',
            ]);

            $userId = createdBy();
            $settings = [
                'googleCalendarEnabled' => $validated['googleCalendarEnabled'] ?? false,
                'googleCalendarId' => $validated['googleCalendarId'] ?? '',
            ];

            // Check if credentials are being changed
            $credentialsChanged = false;
            if (isset($settings['googleCalendarId']) && $settings['googleCalendarId'] !== getSetting('googleCalendarId', '', $userId)) {
                $credentialsChanged = true;
            }

            // Handle JSON file upload
            if ($request->hasFile('googleCalendarJson')) {
                $credentialsChanged = true;

                // Delete existing JSON file if it exists
                $existingPath = getSetting('googleCalendarJsonPath', null, $userId);
                if ($existingPath && \Storage::disk('public')->exists($existingPath)) {
                    \Storage::disk('public')->delete($existingPath);
                }

                $file = $request->file('googleCalendarJson');
                $path = $file->store('google-calendar', 'public');
                $settings['googleCalendarJsonPath'] = $path;
            }

            // Reset sync test status when credentials change
            if ($credentialsChanged) {
                $settings['is_googlecalendar_sync'] = '0';
            }

            foreach ($settings as $key => $value) {
                updateSetting($key, is_bool($value) ? ($value ? '1' : '0') : $value, $userId);
            }

            return redirect()->back()->with('success', __('Google Calendar settings updated successfully.'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', __('Failed to update Google Calendar settings: :error', ['error' => $e->getMessage()]));
        }


}

 public function syncGoogleCalendar(Request $request)
    {
        try {
            $userId = createdBy();
            $settings = settings($userId);

            \Log::info('Google Calendar sync attempt', [
                'user_id' => $userId,
                'settings' => [
                    'googleCalendarEnabled' => $settings['googleCalendarEnabled'] ?? 'not_set',
                    'googleCalendarId' => !empty($settings['googleCalendarId']) ? 'set' : 'empty',
                    'googleCalendarJsonPath' => !empty($settings['googleCalendarJsonPath']) ? 'set' : 'empty'
                ]
            ]);

            if (!($settings['googleCalendarEnabled'] ?? false) || $settings['googleCalendarEnabled'] !== '1') {
                return redirect()->back()->withErrors(['error' => __('Google Calendar integration is not enabled.')]);
            }

            if (empty($settings['googleCalendarId']) || trim($settings['googleCalendarId']) === '') {
                return redirect()->back()->withErrors(['error' => __('Google Calendar ID is not configured.')]);
            }

            if (empty($settings['googleCalendarJsonPath']) || trim($settings['googleCalendarJsonPath']) === '') {
                return redirect()->back()->withErrors(['error' => __('Google Calendar service account JSON is not uploaded.')]);
            }

            // Get the JSON file path
            $jsonPath = storage_path('app/public/' . $settings['googleCalendarJsonPath']);

            if (!file_exists($jsonPath)) {
                throw new \Exception('Service account JSON file not found.');
            }

            // Validate JSON file
            $jsonContent = file_get_contents($jsonPath);
            $credentials = json_decode($jsonContent, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('Invalid JSON file format.');
            }

            if (!isset($credentials['type']) || $credentials['type'] !== 'service_account') {
                throw new \Exception('Invalid service account credentials.');
            }

            // Check if Google Client library is installed
            if (!class_exists('\Google_Client')) {
                throw new \Exception('Google Client library is not installed. Please run: composer require google/apiclient');
            }

            // Test Google Calendar API connection
            $client = new \Google_Client();
            $client->setAuthConfig($jsonPath);
            $client->addScope(\Google_Service_Calendar::CALENDAR_READONLY);

            $service = new \Google_Service_Calendar($client);

            // Test by fetching calendar info
            try {
                $calendar = $service->calendars->get($settings['googleCalendarId']);

                if (!$calendar) {
                    throw new \Exception('Unable to access the specified calendar.');
                }
                // Store sync test success status
            updateSetting('is_googlecalendar_sync', '1', $userId);
            } catch (\Google_Service_Exception $calendarException) {
                // Handle specific calendar access errors
                $errorCode = $calendarException->getCode();
                if ($errorCode === 404) {
                    throw new \Exception('Calendar not found. Please check your Google Calendar ID.');
                } elseif ($errorCode === 403) {
                    throw new \Exception('Access denied. Please ensure the service account has access to this calendar.');
                } else {
                    throw new \Exception('Calendar access error: ' . $calendarException->getMessage());
                }
            }



            return redirect()->back()->with('success', __('Google Calendar sync test completed successfully. Connected to: :name', ['name' => $calendar->getSummary()]));
        } catch (\Google_Service_Exception $e) {
            // Clear sync test status on failure
            updateSetting('is_googlecalendar_sync', '0', $userId);

            $errorCode = $e->getCode();
            $errorMessage = 'Google API Error: ' . $e->getMessage();

            // Provide more specific error messages based on error codes
            if ($errorCode === 404) {
                $errorMessage = 'Calendar not found. Please verify your Google Calendar ID is correct.';
            } elseif ($errorCode === 403) {
                $errorMessage = 'Access denied. Please ensure the service account has proper permissions for this calendar.';
            } elseif ($errorCode === 401) {
                $errorMessage = 'Authentication failed. Please check your service account credentials.';
            }

            \Log::error('Google Calendar API error', [
                'error' => $errorMessage,
                'error_code' => $errorCode,
                'calendar_id' => $settings['googleCalendarId'] ?? 'not_set'
            ]);
                return redirect()->back()->withErrors(['error' => __('Google Calendar sync failed: :error', ['error' => $e->getMessage()])]);
        } catch (\Exception $e) {
            // Clear sync test status on failure
            updateSetting('is_googlecalendar_sync', '0', $userId);

            \Log::error('Google Calendar sync failed', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ]);
                return redirect()->back()->withErrors(['error' => __('Google Calendar sync failed: :error', ['error' => $e->getMessage()])]);
        }
    }
}
