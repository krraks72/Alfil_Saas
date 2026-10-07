<?php

namespace App\Services;

use App\Models\Setting;
use Google_Client;
use Google_Service_Calendar;
use Google_Service_Calendar_Event;
use Google_Service_Calendar_EventDateTime;

class GoogleCalendarService
{
    private $client;
    private $service;

    public function __construct()
    {
        $this->client = new Google_Client();
        $this->service = new Google_Service_Calendar($this->client);
    }

    public function isEnabled($userId)
    {
        return getSetting('googleCalendarEnabled', '0', $userId) === '1';
    }

    public function isAuthorized($userId)
    {
        $jsonPath = Setting::where('user_id', $userId)
            ->where('key', 'googleCalendarJsonPath')
            ->value('value');
        
        return $jsonPath && $this->findValidPath($jsonPath);
    }

    private function findValidPath($jsonPath)
    {
        $paths = [
            $jsonPath,
            storage_path($jsonPath),
            storage_path('app/' . $jsonPath),
            base_path($jsonPath),
            public_path('storage/' . $jsonPath),
        ];
        
        foreach ($paths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }
        
        return null;
    }

    private function setupClient($userId)
    {
        $jsonPath = Setting::where('user_id', $userId)
            ->where('key', 'googleCalendarJsonPath')
            ->value('value');

        if (!$jsonPath) {
            throw new \Exception('Google Calendar JSON credentials not configured');
        }

        $validPath = $this->findValidPath($jsonPath);
        if (!$validPath) {
            throw new \Exception('Google Calendar JSON file not found');
        }

        $this->client->setAuthConfig($validPath);
        $this->client->addScope(Google_Service_Calendar::CALENDAR);
    }

    private function getCalendarId($userId)
    {
        return Setting::where('user_id', $userId)
            ->where('key', 'googleCalendarId')
            ->value('value') ?: 'primary';
    }

    private function setEventDateTime($item, $type)
    {
        switch ($type) {
            case 'hearing':
                if (!$item->hearing_date) return [null, null];
                $startTime = \Carbon\Carbon::parse($item->hearing_date);
                if ($item->hearing_time) {
                    $timeString = strpos($item->hearing_time, ' ') !== false 
                        ? explode(' ', $item->hearing_time)[1] 
                        : $item->hearing_time;
                    $timeParts = explode(':', $timeString);
                    $startTime->setTime((int)$timeParts[0], (int)$timeParts[1], 0);
                }
                $endTime = $startTime->copy()->addMinutes($item->duration_minutes ?? 60);
                break;
            case 'case':
                if (!$item->filing_date) return [null, null];
                $startTime = $item->filing_date;
                $endTime = $startTime->copy()->addHour();
                break;
            case 'timeline':
                if (!$item->event_date) return [null, null];
                $startTime = $item->event_date;
                $endTime = $startTime->copy()->addHour();
                break;
            case 'team_member':
                if (!$item->assigned_date) return [null, null];
                $startTime = $item->assigned_date;
                $endTime = $startTime->copy()->addHour();
                break;
            case 'task':
                if (!$item->due_date) return [null, null];
                $startTime = $item->due_date->copy();
                if ($startTime->format('H:i') === '00:00') {
                    $startTime->setTime(9, 0);
                }
                $endTime = $startTime->copy()->addHour();
                break;
            default:
                return [null, null];
        }

        return [$startTime, $endTime];
    }

    public function createEvent($item, $userId, $type = 'task')
    {
        if (!$this->isEnabled($userId)) {
            return null;
        }

        try {
            $this->setupClient($userId);

            [$startTime, $endTime] = $this->setEventDateTime($item, $type);
            if (!$startTime || !$endTime) {
                return null;
            }

            $summary = $item->title ?? ($type === 'team_member' ? 'Team Member Assignment: ' . ($item->user->name ?? 'Unknown') : 'Event');
            $description = $item->description ?? ($type === 'team_member' ? 'Team member assigned to case' : '');

            $event = new Google_Service_Calendar_Event([
                'summary' => $summary,
                'description' => $description,
                'extendedProperties' => [
                    'private' => [
                        'app_type' => $type,
                        'app_id' => $item->id,
                        'app_user_id' => $userId
                    ]
                ]
            ]);

            $start = new Google_Service_Calendar_EventDateTime();
            $start->setDateTime($startTime->format('c'));
            $event->setStart($start);

            $end = new Google_Service_Calendar_EventDateTime();
            $end->setDateTime($endTime->format('c'));
            $event->setEnd($end);

            $calendarEvent = $this->service->events->insert($this->getCalendarId($userId), $event);
            return $calendarEvent->getId();
        } catch (\Exception $e) {
            \Log::error('Google Calendar event creation failed', [
                'error' => $e->getMessage(),
                'user_id' => $userId,
                'type' => $type
            ]);
            return null;
        }
    }

    public function updateEvent($eventId, $item, $userId, $type = 'task')
    {
        if (!$this->isEnabled($userId) || !$eventId) {
            return false;
        }

        try {
            $this->setupClient($userId);
            $calendarId = $this->getCalendarId($userId);
            
            // Check if event exists
            $event = $this->service->events->get($calendarId, $eventId);
            if (!$event) {
                \Log::error('Google Calendar event not found', ['event_id' => $eventId]);
                return false;
            }

            [$startTime, $endTime] = $this->setEventDateTime($item, $type);
            if (!$startTime || !$endTime) {
                return false;
            }

            $summary = $item->title ?? ($type === 'team_member' ? 'Team Member Assignment: ' . ($item->user->name ?? 'Unknown') : 'Event');
            $description = $item->description ?? ($type === 'team_member' ? 'Team member assigned to case' : '');

            $event->setSummary($summary);
            $event->setDescription($description);

            // Update extended properties for all types
            $event->setExtendedProperties([
                'private' => [
                    'app_type' => $type,
                    'app_id' => $item->id,
                    'app_user_id' => $userId
                ]
            ]);

            $start = new Google_Service_Calendar_EventDateTime();
            $start->setDateTime($startTime->format('c'));
            $event->setStart($start);

            $end = new Google_Service_Calendar_EventDateTime();
            $end->setDateTime($endTime->format('c'));
            $event->setEnd($end);

            $this->service->events->update($calendarId, $eventId, $event);
            return true;
        } catch (\Exception $e) {
            \Log::error('Google Calendar event update failed', [
                'error' => $e->getMessage(),
                'event_id' => $eventId,
                'user_id' => $userId,
                'type' => $type
            ]);
            return false;
        }
    }

    public function deleteEvent($eventId, $userId)
    {
        if (!$this->isEnabled($userId) || !$eventId) {
            return false;
        }

        try {
            $this->setupClient($userId);
            $this->service->events->delete($this->getCalendarId($userId), $eventId);
            return true;
        } catch (\Exception $e) {
            \Log::error('Google Calendar event deletion failed: ' . $e->getMessage());
            return false;
        }
    }

    public function createCalendarEvent($event, $userId)
    {
        if (!$this->isEnabled($userId)) {
            return null;
        }

        try {
            $this->setupClient($userId);

            $googleEvent = new Google_Service_Calendar_Event([
                'summary' => $event->title,
                'description' => $event->description ?: '',
                'location' => $event->location ?: '',
            ]);

            $start = new Google_Service_Calendar_EventDateTime();
            $end = new Google_Service_Calendar_EventDateTime();

            if ($event->all_day) {
                $start->setDate($event->start_date->format('Y-m-d'));
                $endDate = $event->end_date ?: $event->start_date->copy()->addDay();
                $end->setDate($endDate->format('Y-m-d'));
            } else {
                $start->setDateTime($event->start_date->format('c'));
                $endDate = $event->end_date ?: $event->start_date->copy()->addHour();
                $end->setDateTime($endDate->format('c'));
            }

            $googleEvent->setStart($start);
            $googleEvent->setEnd($end);

            $calendarEvent = $this->service->events->insert($this->getCalendarId($userId), $googleEvent);
            return $calendarEvent->getId();
        } catch (\Exception $e) {
            \Log::error('Google Calendar event creation failed', [
                'error' => $e->getMessage(),
                'user_id' => $userId
            ]);
            return null;
        }
    }

    public function getEvents($userId, $maxResults = 100, $timeMin = null, $timeMax = null)
    {
        if (!$this->isEnabled($userId)) {
            return [];
        }

        try {
            $this->setupClient($userId);
            
            $optParams = [
                'maxResults' => $maxResults,
                'orderBy' => 'startTime',
                'singleEvents' => true,
                'timeMin' => $timeMin ?: date('c', strtotime('-1 month')),
            ];
            
            if ($timeMax) {
                $optParams['timeMax'] = $timeMax;
            }
            
            $results = $this->service->events->listEvents($this->getCalendarId($userId), $optParams);
            $events = $results->getItems();
            
            return array_map(function($event) {
                $start = $event->getStart()->getDateTime() ?: $event->getStart()->getDate();
                $end = $event->getEnd()->getDateTime() ?: $event->getEnd()->getDate();
                
                return [
                    'id' => 'google_' . $event->getId(),
                    'title' => $event->getSummary() ?: 'Untitled Event',
                    'description' => $event->getDescription() ?: '',
                    'start' => $start,
                    'end' => $end,
                    'date' => $start,
                    'time' => strpos($start, 'T') !== false ? substr($start, 11, 8) : null,
                    'allDay' => strpos($start, 'T') === false,
                    'color' => '#4285f4',
                    'location' => $event->getLocation() ?: '',
                    'source' => 'google'
                ];
            }, $events);
        } catch (\Exception $e) {
            \Log::error('Google Calendar events fetch failed: ' . $e->getMessage());
            throw $e;
        }
    }
}
