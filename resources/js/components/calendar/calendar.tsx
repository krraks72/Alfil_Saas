import React, { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  description?: string;
  location?: string;
}

interface CalendarProps {
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: string) => void;
  onEventAdd?: (event: Omit<CalendarEvent, 'id'>) => void;
  editable?: boolean;
  height?: string | number;
}

export function Calendar({
  events = [],
  onEventClick,
  onDateClick,
  onEventAdd,
  editable = false,
  height = 'auto'
}: CalendarProps) {
  const { t } = useTranslation();
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState('dayGridMonth');

  const handleDateClick = (arg: any) => {
    if (onDateClick) {
      onDateClick(arg.dateStr);
    }
  };

  const handleEventClick = (arg: any) => {
    if (onEventClick) {
      onEventClick(arg.event.toPlainObject());
    }
  };

  const handleViewChange = (view: string) => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(view);
      setCurrentView(view);
    }
  };

  const goToToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.today();
    }
  };

  const navigatePrev = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.prev();
    }
  };

  const navigateNext = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.next();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {t('Calendar')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              {t('Today')}
            </Button>
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigatePrev}
                className="rounded-r-none border-r"
              >
                ‹
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateNext}
                className="rounded-l-none"
              >
                ›
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Button
            variant={currentView === 'dayGridMonth' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewChange('dayGridMonth')}
          >
            {t('Month')}
          </Button>
          <Button
            variant={currentView === 'timeGridWeek' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewChange('timeGridWeek')}
          >
            {t('Week')}
          </Button>
          <Button
            variant={currentView === 'timeGridDay' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewChange('timeGridDay')}
          >
            {t('Day')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="calendar-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false}
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            editable={editable}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            height={height}
            eventDisplay="block"
            eventClassNames="cursor-pointer"
            dayCellClassNames="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
          />
        </div>
      </CardContent>
    </Card>
  );
}