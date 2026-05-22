"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import koLocale from "@fullcalendar/core/locales/ko";
import { useRouter } from "next/navigation";
import type { EventSummary } from "@/lib/types";

export function CalendarView({ events }: { events: EventSummary[] }) {
  const router = useRouter();

  return (
    <div className="fc-dark overflow-hidden rounded-lg border border-white/10 bg-[#101114] p-3">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        locale={koLocale}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,listWeek",
        }}
        height="auto"
        events={events.map((event) => ({
          id: event.id,
          title: event.title,
          start: event.start_at,
          end: event.end_at,
          extendedProps: { event_type: event.event_type },
        }))}
        eventClick={(info) => router.push(`/calendar/${info.event.id}`)}
        eventClassNames={(arg) => [`event-type-${arg.event.extendedProps.event_type}`]}
      />
    </div>
  );
}
