"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useRouter } from "next/navigation";
import type { EventSummary } from "@/lib/types";

export function CalendarView({ events }: { events: EventSummary[] }) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white p-3 text-zinc-950">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
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
