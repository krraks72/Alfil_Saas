<?php

namespace App\Http\Controllers;

use App\Models\CalendarEvent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class CalendarController extends Controller
{
    public function index(Request $request)
    {
        $currentDate = $request->get('date', now()->format('Y-m-d'));
        $viewType = $request->get('view', 'month');

        // Calculate date range based on view
        $date = Carbon::parse($currentDate);

        if ($viewType === 'month') {
            $startDate = $date->copy()->startOfMonth()->startOfWeek();
            $endDate = $date->copy()->endOfMonth()->endOfWeek();
        } else {
            $startDate = $date->copy()->startOfWeek();
            $endDate = $date->copy()->endOfWeek();
        }

        // Check if demo mode is enabled
        $isDemo = config('app.is_demo', false);
        
        if ($isDemo) {
            // Get demo events and filter by current month for better performance
            $allDemoEvents = getDemoCalendarEvents();
            $currentMonth = Carbon::parse($currentDate);
            
            // Filter events for current month and surrounding dates
            $events = collect($allDemoEvents)->filter(function ($event) use ($currentMonth) {
                $eventStart = Carbon::parse($event['start']);
                return $eventStart->year === $currentMonth->year && 
                       $eventStart->month === $currentMonth->month;
            })->values();
            
            $upcomingEvents = collect($allDemoEvents)->filter(function ($event) {
                $eventStart = Carbon::parse($event['start']);
                return $eventStart->gte(now());
            })->take(5)->values();
        } else {
            // Get real events from database
            $events = CalendarEvent::where('user_id', Auth::id())
                ->orWhere('created_by', createdBy())
                ->whereBetween('start_date', [$startDate, $endDate])
                ->orderBy('start_date')
                ->get()
                ->map(function ($event) {
                    return [
                        'id' => $event->id,
                        'title' => $event->title,
                        'start' => $event->start_date->toISOString(),
                        'end' => $event->end_date?->toISOString(),
                        'allDay' => $event->all_day,
                        'color' => $event->color,
                        'description' => $event->description,
                        'location' => $event->location,
                    ];
                });

            $upcomingEvents = CalendarEvent::where('user_id', Auth::id())
                ->orWhere('created_by', Auth::user()->creatorId())
                ->where('start_date', '>=', now())
                ->orderBy('start_date')
                ->limit(5)
                ->get()
                ->map(function ($event) {
                    return [
                        'id' => $event->id,
                        'title' => $event->title,
                        'start' => $event->start_date->toISOString(),
                        'end' => $event->end_date?->toISOString(),
                        'allDay' => $event->all_day,
                        'color' => $event->color,
                        'description' => $event->description,
                        'location' => $event->location,
                    ];
                });
        }

        return Inertia::render('calendar/index', [
            'events' => $events,
            'upcomingEvents' => $upcomingEvents,
            'currentDate' => $currentDate,
            'viewType' => $viewType,
            'dateRange' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
            'isDemo' => $isDemo,
            'canEdit' => !$isDemo,
            'canDelete' => !$isDemo
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'location' => 'nullable|string|max:255',
            'start_date' => 'required|date|after_or_equal:' . now()->subYear()->format('Y-m-d') . '|before_or_equal:' . now()->addYears(5)->format('Y-m-d'),
            'end_date' => 'nullable|date|after_or_equal:start_date|before_or_equal:' . now()->addYears(5)->format('Y-m-d'),
            'all_day' => 'boolean',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'sync_to_google' => 'boolean',
        ]);

        try {
            $event = CalendarEvent::create([
                ...$validated,
                'user_id' => Auth::id(),
                'created_by' => createdBy(),
                'color' => $validated['color'] ?? '#3b82f6',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }

        // Sync to Google Calendar if requested
        if ($validated['sync_to_google'] ?? false) {
            try {
                $googleCalendarService = app(\App\Services\GoogleCalendarService::class);
                $userId = createdBy(); // Use the helper function instead
                $googleEventId = $googleCalendarService->createCalendarEvent($event, $userId);

                \Log::info('Google Calendar sync attempt', [
                    'event_id' => $event->id,
                    'google_event_id' => $googleEventId,
                    'user_id' => $userId
                ]);

                if ($googleEventId) {
                    $event->update(['google_event_id' => $googleEventId]);
                }
            } catch (\Exception $e) {
                \Log::error('Google Calendar sync failed in controller', [
                    'error' => $e->getMessage(),
                    'event_id' => $event->id
                ]);
            }
        }

        return response()->json([
            'id' => $event->id,
            'title' => $event->title,
            'start' => $event->start_date->toISOString(),
            'end' => $event->end_date?->toISOString(),
            'allDay' => $event->all_day,
            'color' => $event->color,
            'description' => $event->description,
            'location' => $event->location,
        ]);
    }

    public function update(Request $request, CalendarEvent $event)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'location' => 'nullable|string|max:255',
            'start_date' => 'required|date|after_or_equal:' . now()->subYear()->format('Y-m-d') . '|before_or_equal:' . now()->addYears(5)->format('Y-m-d'),
            'end_date' => 'nullable|date|after_or_equal:start_date|before_or_equal:' . now()->addYears(5)->format('Y-m-d'),
            'all_day' => 'boolean',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        try {
            $event->update($validated);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }

        return response()->json([
            'id' => $event->id,
            'title' => $event->title,
            'start' => $event->start_date->toISOString(),
            'end' => $event->end_date->toISOString(),
            'allDay' => $event->all_day,
            'color' => $event->color,
            'description' => $event->description,
            'location' => $event->location,
        ]);
    }

    public function destroy(CalendarEvent $event)
    {
        // Delete from Google Calendar if it was synced
        if ($event->google_event_id) {
            try {
                $googleCalendarService = app(\App\Services\GoogleCalendarService::class);
                $googleCalendarService->deleteEvent($event->google_event_id, createdBy());
            } catch (\Exception $e) {
                \Log::error('Failed to delete Google Calendar event', [
                    'error' => $e->getMessage(),
                    'google_event_id' => $event->google_event_id,
                    'local_event_id' => $event->id
                ]);
            }
        }

        $event->delete();
        return response()->json(['message' => 'Event deleted successfully']);
    }
}
