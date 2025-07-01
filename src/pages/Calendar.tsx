import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { INITIAL_EVENTS, createEventId } from './event-utils';

const Calendar = () => {
  const { user, userRole } = useAuth();
  const [weekendsVisible, setWeekendsVisible] = useState(true);
  const [currentEvents, setCurrentEvents] = useState([]);

  const handleWeekendsToggle = () => {
    setWeekendsVisible(!weekendsVisible);
  };

  const handleDateSelect = (selectInfo: any) => {
    let title = prompt('Please enter a new title for your event');
    let calendarApi = selectInfo.view.calendar;

    calendarApi.unselect(); // clear date selection

    if (title) {
      calendarApi.addEvent({
        id: createEventId(),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay
      });
    }
  };

  const handleEventClick = (clickInfo: any) => {
    if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
      clickInfo.event.remove();
    }
  };

  const handleEvents = (events: any) => {
    setCurrentEvents(events);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-white mb-4">Calendar</h1>
          <div className="bg-slate-800 p-4 rounded-lg shadow-md">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              initialView="dayGridMonth"
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={weekendsVisible}
              initialEvents={INITIAL_EVENTS}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventsSet={handleEvents}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
