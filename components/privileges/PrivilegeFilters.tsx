"use client";

import { useRouter } from "next/navigation";

type Option = {
  id: string;
  name: string;
};

export function PrivilegeFilters({
  month,
  eventId,
  groupId,
  events,
  groups,
}: {
  month: string;
  eventId: string;
  groupId: string;
  events: Option[];
  groups: Option[];
}) {
  const router = useRouter();

  function update(next: { eventId?: string; groupId?: string }) {
    const params = new URLSearchParams();
    params.set("month", month);

    const nextEventId = next.eventId ?? eventId;
    const nextGroupId = next.groupId ?? groupId;
    if (nextEventId) params.set("event_id", nextEventId);
    if (nextGroupId) params.set("group_id", nextGroupId);

    router.push(`/privileges?${params.toString()}`);
  }

  return (
    <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 md:grid-cols-2">
      <label className="text-sm text-zinc-300">
        공연
        <select
          className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white"
          value={eventId}
          onChange={(event) => update({ eventId: event.target.value })}
        >
          <option value="">전체 공연</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-zinc-300">
        그룹
        <select
          className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white"
          value={groupId}
          onChange={(event) => update({ groupId: event.target.value })}
        >
          <option value="">전체 그룹</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
