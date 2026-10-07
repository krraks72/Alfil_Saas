import { useState, useEffect } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, User, FileText, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/custom-toast';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Calendar() {
  const { t, i18n } = useTranslation();
  const { auth, events, upcomingEvents, currentDate, viewType, dateRange, systemSettings, googleCalendarAuthorized, googleCalendarEnabled, isDemo, canEdit, canDelete } = usePage().props as any;

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [dayEvents, setDayEvents] = useState<any[]>([]);
  const [isDayEventsModalOpen, setIsDayEventsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeCalendar, setActiveCalendar] = useState<'local' | 'google'>('local');
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [isGoogleCalendarSyncTested, setIsGoogleCalendarSyncTested] = useState(systemSettings?.is_googlecalendar_sync === '1');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    allDay: false,
    syncToGoogle: false,
    color: '#10b77f'
  });

  const currentDateObj = new Date(currentDate || new Date());
  const startDate = new Date(dateRange?.start || new Date());
  const endDate = new Date(dateRange?.end || new Date());

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    let newDate = new Date(currentDate || new Date());

    if (direction === 'today') {
      newDate = new Date();
    } else if (direction === 'prev') {
      if (viewType === 'month') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else if (viewType === 'week') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() - 1);
      }
    } else {
      if (viewType === 'month') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (viewType === 'week') {
        newDate.setDate(newDate.getDate() + 7);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
    }

    router.get(route('calendar.index'), {
      date: newDate.toISOString().split('T')[0],
      view: viewType || 'month'
    }, { preserveState: true });
  };

  const changeView = (newView: string) => {
    router.get(route('calendar.index'), {
      date: currentDate,
      view: newView
    }, { preserveState: true });
  };

  const generateCalendarDays = () => {
    const days = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  useEffect(() => {
    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isGoogleCalendarSyncTested && activeCalendar === 'google') {
      setActiveCalendar('local');
      setGoogleEvents([]);
    }
  }, [isGoogleCalendarSyncTested]);

  useEffect(() => {
    if (activeCalendar === 'google' && isGoogleCalendarSyncTested && googleEvents.length === 0) {
      setIsSyncing(true);
      fetch(route('google-calendar.sync'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setGoogleEvents(data.events || []);
        }
      })
      .catch(error => {
      })
      .finally(() => setIsSyncing(false));
    }
  }, [activeCalendar, isGoogleCalendarSyncTested]);

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const currentEvents = activeCalendar === 'google' ? googleEvents : events;
    return (currentEvents || []).filter((event: any) => {
      const startDateStr = (activeCalendar === 'google' ? event.date || event.start : event.start).split('T')[0];
      const endDateStr = event.end ? event.end.split('T')[0] : startDateStr;

      // Check if the date falls within the event's date range
      return dateStr >= startDateStr && dateStr <= endDateStr;
    });
  };

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch(route('settings.getSettings'));
      const data = await response.json();
      const syncTested = data.settings?.is_googlecalendar_sync === '1';
      setIsGoogleCalendarSyncTested(syncTested);

      if (!syncTested && activeCalendar === 'google') {
        setActiveCalendar('local');
        setGoogleEvents([]);
      }
    } catch (error) {
    }
  };

  const handleCalendarChange = (type: 'local' | 'google') => {
    setActiveCalendar(type);
    setIsSyncing(true);

    if (type === 'google') {
      fetch(route('google-calendar.sync'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setGoogleEvents(data.events || []);
          setIsGoogleCalendarSyncTested(true);
        } else if (data.needsAuth && data.authUrl) {
          window.location.href = data.authUrl;
        } else if (data.needsConfig) {
          toast.error('Google Calendar is not configured. Please configure Google Calendar credentials in settings.');
          setActiveCalendar('local');
          setIsGoogleCalendarSyncTested(false);
        } else {
          toast.error(data.message || 'Failed to fetch Google Calendar events');
          setIsGoogleCalendarSyncTested(false);
        }
      })
      .catch(error => {
        toast.error('Failed to fetch Google Calendar events');
        setActiveCalendar('local');
      })
      .finally(() => setIsSyncing(false));
    } else {
      setGoogleEvents([]);
      setTimeout(() => setIsSyncing(false), 1000);
    }
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleDayEventsClick = (date: Date, events: any[]) => {
    setSelectedDate(date);
    setDayEvents(events);
    setIsDayEventsModalOpen(true);
  };

  const handleDateClick = (date: string) => {
    setIsEditMode(false);
    setNewEvent({
      title: '',
      description: '',
      location: '',
      startDate: date,
      startTime: '',
      endDate: date,
      endTime: '',
      allDay: false,
      syncToGoogle: false,
      color: '#10b77f'
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleAddNewEvent = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setIsEditMode(false);
    setNewEvent({
      title: '',
      description: '',
      location: '',
      startDate: todayStr,
      startTime: '',
      endDate: todayStr,
      endTime: '',
      allDay: false,
      syncToGoogle: false,
      color: '#10b77f'
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleEditEvent = (event: any) => {
    setIsEditMode(true);
    setSelectedEvent(event);
    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : startDate;

    setNewEvent({
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      startDate: startDate.toISOString().split('T')[0],
      startTime: event.allDay ? '' : startDate.toTimeString().slice(0, 5),
      endDate: endDate.toISOString().split('T')[0],
      endTime: event.allDay ? '' : endDate.toTimeString().slice(0, 5),
      allDay: event.allDay,
      syncToGoogle: event.syncToGoogle || false,
      color: event.color || '#10b77f'
    });
    setFormErrors({});
    setIsEventModalOpen(false);
    setIsDialogOpen(true);
  };

  const handleDeleteEvent = (event: any) => {
    setSelectedEvent(event);
    setIsDeleteModalOpen(true);
  };
    const breadcrumbs= [
      { title: t('Dashboard'), href: route('dashboard') },
      { title: t('Calendar') }
    ];

  const handleDeleteConfirm = async () => {
    toast.loading(t('Deleting event...'));
    try {
      const response = await fetch(route('calendar.events.destroy', selectedEvent.id), {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsDeleteModalOpen(false);
        setIsEventModalOpen(false);
        toast.dismiss();
        toast.success(data.message || t('Event deleted successfully'));
        router.reload();
      } else {
        toast.dismiss();
        toast.error(t('Failed to delete event'));
      }
    } catch (error) {
      toast.dismiss();
      toast.error(t('Failed to delete event'));
    }
  };

  const handleAddEvent = async () => {
    const errors: Record<string, string> = {};
    if (!newEvent.title.trim()) errors.title = t('Event title is required');
    if (!newEvent.startDate) errors.startDate = t('Start date is required');
    if (!newEvent.endDate) errors.endDate = t('End date is required');
    if (!newEvent.allDay && !newEvent.startTime) errors.startTime = t('Start time is required');
    if (!newEvent.allDay && !newEvent.endTime) errors.endTime = t('End time is required');
    if (newEvent.startDate && newEvent.endDate && newEvent.endDate < newEvent.startDate)
      errors.endDate = t('End date cannot be before start date');
    if (!errors.endDate && !newEvent.allDay && newEvent.startDate && newEvent.endDate &&
      newEvent.startDate === newEvent.endDate && newEvent.startTime && newEvent.endTime &&
      newEvent.endTime <= newEvent.startTime)
      errors.endTime = t('End time must be after start time');
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const startDateTime = newEvent.allDay
      ? newEvent.startDate
      : `${newEvent.startDate}T${newEvent.startTime || '09:00'}:00`;

    const endDateTime = newEvent.allDay
      ? newEvent.endDate || newEvent.startDate
      : `${newEvent.endDate || newEvent.startDate}T${newEvent.endTime || '10:00'}:00`;

    try {
      if (isEditMode) {
        // Use POST with method spoofing for updates
        const response = await fetch(route('calendar.events.update', selectedEvent.id), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          },
          body: JSON.stringify({
            _method: 'PUT',
            title: newEvent.title,
            description: newEvent.description,
            location: newEvent.location,
            start_date: startDateTime,
            end_date: endDateTime,
            all_day: newEvent.allDay,
            color: (newEvent as any).color || '#10b77f'
          })
        });

        if (response.ok) {
          const data = await response.json();
          setIsDialogOpen(false);
          setNewEvent({
            title: '',
            description: '',
            location: '',
            startDate: '',
            startTime: '',
            endDate: '',
            endTime: '',
            allDay: false,
            syncToGoogle: false,
            color: '#10b77f'
          });
          toast.success(data.message || t('Event updated successfully'));
          router.reload();
        } else {
          toast.error(t('Failed to update event'));
        }
      } else {
        // Use fetch for create as before
        const response = await fetch(route('calendar.events.store'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          },
          body: JSON.stringify({
            title: newEvent.title,
            description: newEvent.description,
            location: newEvent.location,
            start_date: startDateTime,
            end_date: endDateTime,
            all_day: newEvent.allDay,
            sync_to_google: newEvent.syncToGoogle,
            color: (newEvent as any).color || '#10b77f'
          })
        });

        if (response.ok) {
          setIsDialogOpen(false);
          setNewEvent({
            title: '',
            description: '',
            location: '',
            startDate: '',
            startTime: '',
            endDate: '',
            endTime: '',
            allDay: false,
            syncToGoogle: false,
            color: '#10b77f'
          });
          toast.success(t('Event created successfully'));
          router.reload();
        } else {
          toast.error(t('Failed to create event'));
        }
      }
    } catch (error) {
      toast.error(isEditMode ? t('Failed to update event') : t('Failed to create event'));
    }
  };

  const renderMonthView = () => {
    const days = generateCalendarDays();
    const weeks = [];

    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-7 gap-0 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
              {t(day)}
            </div>
          ))}
        </div>

        {weeks.map((week, weekIndex) => {
          // Calculate spanning events for this week
          const weekEvents = [];
          const currentEvents = activeCalendar === 'google' ? googleEvents : events;

          (currentEvents || []).forEach((event: any) => {
            const startDate = new Date(activeCalendar === 'google' ? event.date || event.start : event.start);
            const endDate = event.end ? new Date(event.end) : startDate;

            // Check if event overlaps with this week
            const weekStart = week[0];
            const weekEnd = week[6];

            if (startDate <= weekEnd && endDate >= weekStart) {
              const eventStartCol = Math.max(0, Math.floor((startDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)));
              const eventEndCol = Math.min(6, Math.floor((endDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)));

              if (eventStartCol <= 6 && eventEndCol >= 0) {
                weekEvents.push({
                  ...event,
                  startCol: Math.max(0, eventStartCol),
                  endCol: Math.min(6, eventEndCol),
                  span: Math.min(6, eventEndCol) - Math.max(0, eventStartCol) + 1
                });
              }
            }
          });

          return (
            <div key={weekIndex} className="relative">
              <div className="grid grid-cols-7 gap-0">
                {week.map((day, dayIndex) => {
                  const isCurrentMonth = day.getMonth() === currentDateObj.getMonth();
                  const isToday = day.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={dayIndex}
                      className={`min-h-[140px] p-2 border-r border-b border-gray-200 dark:border-gray-700 cursor-pointer ${
                        !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'
                      }`}
                      onClick={() => handleDateClick(day.toISOString().split('T')[0])}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isToday
                          ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center'
                          : isCurrentMonth
                            ? 'text-gray-900 dark:text-gray-100'
                            : 'text-gray-400 dark:text-gray-600'
                      }`}>
                        {day.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Render spanning events */}
              <div className="absolute top-0 left-0 right-0 pointer-events-none">
                {weekEvents.slice(0, 3).map((event: any, eventIndex) => (
                  <div
                    key={event.id}
                    className="absolute text-xs p-0.5 cursor-pointer hover:opacity-80 rounded pointer-events-auto"
                    style={{
                      backgroundColor: event.color || '#10b77f',
                      color: 'white',
                      left: `calc(${(event.startCol / 7) * 100}% + 2px)`,
                      width: `calc(${(event.span / 7) * 100}% - 4px)`,
                      top: `${32 + eventIndex * 22}px`,
                      height: '20px',
                      zIndex: 10
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(event);
                    }}
                  >
                    <div className="whitespace-nowrap overflow-hidden font-medium">
                      {event.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const days = generateCalendarDays().slice(0, 7);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-8 gap-0 border-b">
          <div className="p-3 text-center font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
            {t('Time')}
          </div>
          {days.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={index} className={`p-3 text-center font-medium bg-gray-50 dark:bg-gray-800 ${
                isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                <div className="text-xs">{day.toLocaleDateString(i18n.language || undefined, { weekday: 'short' })}</div>
                <div className={`text-lg ${isToday ? 'bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 gap-0 border-b border-gray-100 dark:border-gray-700">
              <div className="p-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-r">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {days.map((day, dayIndex) => {
                const dayEvents = getEventsForDate(day).filter(event => {
                  if (event.allDay) return hour === 0;
                  try {
                    const eventStart = activeCalendar === 'google' ? (event.date || event.start) : event.start;
                    const eventEnd = event.end ? new Date(event.end) : new Date(eventStart);
                    const eventStartDate = new Date(eventStart);
                    const eventEndDate = new Date(eventEnd);
                    const dayStart = new Date(day);
                    dayStart.setHours(0, 0, 0, 0);

                    // For multi-day events
                    if (eventEndDate.toDateString() !== eventStartDate.toDateString()) {
                      if (dayStart.toDateString() === eventStartDate.toDateString()) {
                        // First day - show from start time onwards
                        return hour >= eventStartDate.getHours();
                      } else if (dayStart.toDateString() === eventEndDate.toDateString()) {
                        // Last day - show until end time
                        return hour <= eventEndDate.getHours();
                      } else if (dayStart > eventStartDate && dayStart < eventEndDate) {
                        // Middle days - show in all hours
                        return true;
                      }
                      return false;
                    } else {
                      // Single day event - show at start time
                      return eventStartDate.getHours() === hour;
                    }
                  } catch (e) {
                    return hour === 0;
                  }
                });

                return (
                  <div key={dayIndex} className="min-h-[60px] p-1 border-r border-gray-100 dark:border-gray-700 relative">
                    {dayEvents.map((event: any) => (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className="text-xs p-2 rounded-md cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 bg-white dark:bg-gray-800 shadow-sm mb-1"
                        style={{
                          borderLeftColor: event.color || '#10b77f',
                          backgroundColor: `${event.color || '#10b77f'}08`
                        }}
                      >
                        <div className="font-medium text-gray-900 dark:text-gray-100 leading-tight">
                          {event.title}
                        </div>
                        {!event.allDay && (() => {
                          const eventStart = activeCalendar === 'google' ? (event.date || event.start) : event.start;
                          const eventEnd = event.end ? new Date(event.end) : new Date(eventStart);
                          const eventStartDate = new Date(eventStart);
                          const eventEndDate = new Date(eventEnd);
                          const dayStart = new Date(day);
                          dayStart.setHours(0, 0, 0, 0);

                          // Only show time on first day for multi-day events
                          if (eventEndDate.toDateString() !== eventStartDate.toDateString()) {
                            if (dayStart.toDateString() === eventStartDate.toDateString()) {
                              return (
                                <div className="text-gray-600 dark:text-gray-400 mt-0.5">
                                  {window.appSettings.formatDateTime(eventStart, true)}
                                </div>
                              );
                            }
                            return null;
                          } else {
                            return (
                              <div className="text-gray-600 dark:text-gray-400 mt-0.5">
                                {window.appSettings.formatDateTime(eventStart, true)}
                              </div>
                            );
                          }
                        })()}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const day = new Date(currentDate || new Date());
    const dayEvents = getEventsForDate(day);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const isToday = day.toDateString() === new Date().toDateString();

    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {day.toLocaleDateString(i18n.language || undefined, { weekday: 'long' })}
            </div>
            <div className={`text-2xl font-semibold ${
              isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
            }`}>
              {day.getDate()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {day.toLocaleDateString(i18n.language || undefined, { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          {hours.map((hour) => {
            const hourEvents = dayEvents.filter(event => {
              if (event.allDay) return hour === 0;
              try {
                const eventStart = activeCalendar === 'google' ? (event.date || event.start) : event.start;
                const eventEnd = event.end ? new Date(event.end) : new Date(eventStart);
                const eventStartDate = new Date(eventStart);
                const eventEndDate = new Date(eventEnd);

                // For multi-day events
                if (eventEndDate.toDateString() !== eventStartDate.toDateString()) {
                  if (day.toDateString() === eventStartDate.toDateString()) {
                    // First day - show from start time onwards
                    return hour >= eventStartDate.getHours();
                  } else if (day.toDateString() === eventEndDate.toDateString()) {
                    // Last day - show until end time
                    return hour <= eventEndDate.getHours();
                  } else if (day > eventStartDate && day < eventEndDate) {
                    // Middle days - show in all hours
                    return true;
                  }
                  return false;
                } else {
                  // Single day event - show at start time
                  return eventStartDate.getHours() === hour;
                }
              } catch (e) {
                return hour === 0;
              }
            });

            return (
              <div key={hour} className="flex border-b border-gray-100 dark:border-gray-700">
                <div className="w-20 p-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-r">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 min-h-[80px] p-2">
                  {hourEvents.map((event: any) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="p-3 mb-2 rounded-lg cursor-pointer hover:opacity-80 border-l-4"
                      style={{
                        backgroundColor: `${event.color || '#3b82f6'}10`,
                        borderLeftColor: event.color || '#3b82f6'
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium" style={{ color: event.color || '#3b82f6' }}>
                          {event.title}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {t('Event')}
                        </Badge>
                      </div>
                      {!event.allDay && (
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                          {window.appSettings.formatDateTime(activeCalendar === 'google' ? (event.date || event.start) : event.start, true)}
                        </div>
                      )}
                      {event.location && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {event.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderUpcomingEvents = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentMonthEvents = (upcomingEvents || []).filter((event: any) => {
      const eventDate = new Date(event.start);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t('Upcoming Events')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentMonthEvents.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t('No events this month')}</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {currentMonthEvents.map((event: any) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: event.color || '#3b82f6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarIcon className="h-3 w-3" />
                      <span className="font-medium text-sm truncate">{event.title}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {window.appSettings.formatDateTime(event.start, false)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {canEdit && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditEvent(event)}
                                    className="text-gray-500"
                                    // className="h-6 w-6 p-0 text-amber-500 hover:text-amber-700"
                                >
                                    <Edit className="h-3 w-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('Edit')}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                    {canDelete && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteEvent(event)}
                                    className="text-gray-500"
                                    // className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('Delete')}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderEventModal = () => (
    <Dialog open={isEventModalOpen && !isDeleteModalOpen} onOpenChange={(open) => {
      if (!isDeleteModalOpen) setIsEventModalOpen(open);
    }}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md md:max-w-lg max-h-[90vh] pl-0 pr-0 rounded-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="px-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg font-semibold text-foreground">{t('Event Details')}</DialogTitle>
          </div>
        </DialogHeader>

        {selectedEvent && (
          <ScrollArea className="max-h-[60vh]">
            <div className="px-6 py-5 space-y-4">
              {/* Title & All Day */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {t('Title')}
                  </label>
                  <p className="text-sm font-semibold text-foreground break-words">{selectedEvent.title || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                    <Clock className="h-3.5 w-3.5" />
                    {t('Type')}
                  </label>
                  <div>
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      selectedEvent.allDay
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-blue-600/20'
                        : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 ring-purple-600/20'
                    }`}>
                      {selectedEvent.allDay ? t('All Day') : t('Timed')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Start & End */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                    <Clock className="h-3.5 w-3.5" />
                    {t('Start')}
                  </label>
                  <p className="text-sm font-medium text-foreground">
                    {window.appSettings.formatDateTime(selectedEvent.start, !selectedEvent.allDay)}
                  </p>
                </div>
                {selectedEvent.end && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                      <Clock className="h-3.5 w-3.5" />
                      {t('End')}
                    </label>
                    <p className="text-sm font-medium text-foreground">
                      {window.appSettings.formatDateTime(selectedEvent.end, !selectedEvent.allDay)}
                    </p>
                  </div>
                )}
              </div>

              {/* Location */}
              {selectedEvent.location && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {t('Location')}
                  </label>
                  <p className="text-sm font-medium text-foreground break-words">{selectedEvent.location}</p>
                </div>
              )}

              {/* Description */}
              {selectedEvent.description && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                    <FileText className="h-3.5 w-3.5" />
                    {t('Description')}
                  </label>
                  <div className="bg-muted/40 p-3 rounded-lg">
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed break-words">{selectedEvent.description}</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="px-6 pt-4 border-t-0 gap-2">
          {canEdit && (
            <Button
              onClick={() => handleEditEvent(selectedEvent)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Edit className="h-4 w-4 mr-1.5" />
              {t('Edit')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderDayEventsModal = () => (
    <Dialog open={isDayEventsModalOpen} onOpenChange={setIsDayEventsModalOpen}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md md:max-w-lg max-h-[90vh] pl-0 pr-0 rounded-lg">
        <DialogHeader className="px-6 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {t('All events on')} {selectedDate ? window.appSettings.formatDateTime(selectedDate.toISOString(), false) : ''}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6 py-4">
          <div className="space-y-3">
            {dayEvents.map((event: any) => (
              <div
                key={event.id}
                onClick={() => {
                  setIsDayEventsModalOpen(false);
                  handleEventClick(event);
                }}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/60 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: event.color || '#3b82f6' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium text-sm truncate text-foreground">{event.title}</span>
                  </div>
                  {!event.allDay && (
                    <div className="text-xs text-muted-foreground">
                      {window.appSettings.formatDateTime(event.start, true)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );

  return (
    <PageTemplate
      title={t("Calendar")}
      breadcrumbs={breadcrumbs}
      url="/calendar"
      noPadding
      description={t("Manage your calendar and events.")}
    >
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-3 sm:p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('prev')}
                  className="h-8 w-8 sm:w-auto p-0 sm:px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('next')}
                  className="h-8 w-8 sm:w-auto p-0 sm:px-3"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('today')}
                  className="h-8 text-xs sm:text-sm px-2.5 sm:px-3"
                >
                  {t('Today')}
                </Button>
              </div>

              <h2 className="text-base sm:text-xl font-semibold text-foreground truncate">
                {currentDateObj.toLocaleDateString(i18n.language || undefined, {
                  month: 'long',
                  year: 'numeric'
                })}
              </h2>
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
              {isGoogleCalendarSyncTested && (
                <div className="w-full sm:w-44 min-w-[140px]">
                  <Select
                    value={activeCalendar}
                    onValueChange={(value: 'local' | 'google') => handleCalendarChange(value)}
                    disabled={isSyncing}
                  >
                    <SelectTrigger className="h-8 text-xs sm:text-sm">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          {activeCalendar === 'local' && (
                            <CalendarIcon className="h-3.5 w-3.5" />
                          )}
                          <span className="truncate">{activeCalendar === 'local' ? t('Local Calendar') : t('Google Calendar')}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{t('Local Calendar')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="google">
                        <div className="flex items-center gap-2">
                          <span>{t('Google Calendar')}</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                variant="default"
                size="sm"
                onClick={handleAddNewEvent}
                className="h-8 text-xs sm:text-sm px-2.5 sm:px-3"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span>{t('Add Event')}</span>
              </Button>

              <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border">
                <Button
                  variant={viewType === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => changeView('month')}
                  className="h-7 text-xs px-2.5 sm:px-3"
                >
                  {t('Month')}
                </Button>
                <Button
                  variant={viewType === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => changeView('week')}
                  className="h-7 text-xs px-2.5 sm:px-3"
                >
                  {t('Week')}
                </Button>
                <Button
                  variant={viewType === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => changeView('day')}
                  className="h-7 text-xs px-2.5 sm:px-3"
                >
                  {t('Day')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {viewType === 'month' && renderMonthView()}
            {viewType === 'week' && renderWeekView()}
            {viewType === 'day' && renderDayView()}
          </div>

          <div className="space-y-6">
            {renderUpcomingEvents()}

            <Card>
              <CardHeader>
                <CardTitle>{t('This Month')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('Total Events')}</span>
                    <span className="font-medium">{(() => {
                      const today = new Date();
                      const currentMonth = today.getMonth();
                      const currentYear = today.getFullYear();
                      const currentEvents = activeCalendar === 'google' ? googleEvents : events;
                      return (currentEvents || []).filter((event: any) => {
                        const eventDate = new Date(event.start);
                        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
                      }).length;
                    })()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {renderEventModal()}
      {renderDayEventsModal()}

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={selectedEvent?.title}
        entityName={t('Event')}
      />

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setFormErrors({}); }}>
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg md:max-w-xl max-h-[90vh] pl-0 pr-0 rounded-lg">
            <DialogHeader className="px-6 pb-2 border-b">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                <CalendarIcon className="h-5 w-5 text-primary" />
                {isEditMode ? t('Edit Event') : t('Add New Event')}
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh]">
              <div className="grid gap-4 py-4 px-6">
                <div className="grid gap-2">
                  <Label required htmlFor="title" className="text-sm font-medium">{t('Event Title')}</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => { setNewEvent(prev => ({ ...prev, title: e.target.value })); setFormErrors(prev => ({ ...prev, title: '' })); }}
                    placeholder={t('Enter event title')}
                    className={formErrors.title ? 'border-red-500' : ''}
                  />
                  {formErrors.title && <p className="text-xs text-red-500">{formErrors.title}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-sm font-medium">{t('Description')}</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('Enter event description')}
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location" className="text-sm font-medium">{t('Location')}</Label>
                  <Input
                    id="location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                    placeholder={t('Enter event location')}
                  />
                </div>

                <div className="space-y-3 bg-muted/30 p-3 rounded-lg border border-border">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allDay"
                      checked={newEvent.allDay}
                      onCheckedChange={(checked) => setNewEvent(prev => ({ ...prev, allDay: !!checked }))}
                    />
                    <Label htmlFor="allDay" className="text-sm font-medium cursor-pointer">{t('All Day Event')}</Label>
                  </div>

                  <div className="grid gap-2 pt-1">
                    <Label className="text-xs text-muted-foreground font-medium">{t('Event Color')}</Label>
                    <div className="flex gap-2 flex-wrap">
                      {['#3b82f6', '#ef4444', '#10b77f', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-7 h-7 rounded-full transition-transform hover:scale-110 border-2 ${
                            (newEvent as any).color === color ? 'ring-2 ring-primary ring-offset-2 border-transparent' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewEvent(prev => ({ ...prev, color } as any))}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label required className="text-sm font-medium">{t('Start Date')}</Label>
                    <Input
                      type="date"
                      value={newEvent.startDate}
                      onChange={(e) => { setNewEvent(prev => ({ ...prev, startDate: e.target.value })); setFormErrors(prev => ({ ...prev, startDate: '' })); }}
                      className={formErrors.startDate ? 'border-red-500' : ''}
                    />
                    {formErrors.startDate && <p className="text-xs text-red-500">{formErrors.startDate}</p>}
                  </div>
                  {!newEvent.allDay && (
                    <div className="grid gap-2">
                      <Label required={!newEvent.allDay} className="text-sm font-medium">{t('Start Time')}</Label>
                      <Input
                        type="time"
                        value={newEvent.startTime}
                        onChange={(e) => { setNewEvent(prev => ({ ...prev, startTime: e.target.value })); setFormErrors(prev => ({ ...prev, startTime: '' })); }}
                        className={formErrors.startTime ? 'border-red-500' : ''}
                      />
                      {formErrors.startTime && <p className="text-xs text-red-500">{formErrors.startTime}</p>}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label required className="text-sm font-medium">{t('End Date')}</Label>
                    <Input
                      type="date"
                      value={newEvent.endDate}
                      onChange={(e) => { setNewEvent(prev => ({ ...prev, endDate: e.target.value })); setFormErrors(prev => ({ ...prev, endDate: '' })); }}
                      className={formErrors.endDate ? 'border-red-500' : ''}
                    />
                    {formErrors.endDate && <p className="text-xs text-red-500">{formErrors.endDate}</p>}
                  </div>
                  {!newEvent.allDay && (
                    <div className="grid gap-2">
                      <Label required={!newEvent.allDay} className="text-sm font-medium">{t('End Time')}</Label>
                      <Input
                        type="time"
                        value={newEvent.endTime}
                        onChange={(e) => { setNewEvent(prev => ({ ...prev, endTime: e.target.value })); setFormErrors(prev => ({ ...prev, endTime: '' })); }}
                        className={formErrors.endTime ? 'border-red-500' : ''}
                      />
                      {formErrors.endTime && <p className="text-xs text-red-500">{formErrors.endTime}</p>}
                    </div>
                  )}
                </div>

                {isGoogleCalendarSyncTested && !isEditMode && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Label htmlFor="syncToGoogle" className="text-sm font-medium">{t('Synchronize in Google Calendar')}</Label>
                    <Switch
                      id="syncToGoogle"
                      checked={newEvent.syncToGoogle}
                      onCheckedChange={(checked) => setNewEvent(prev => ({ ...prev, syncToGoogle: checked }))}
                    />
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="sm:justify-end px-6 pt-4 border-t gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button onClick={handleAddEvent}>
                {t('Save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </PageTemplate>
  );
}
