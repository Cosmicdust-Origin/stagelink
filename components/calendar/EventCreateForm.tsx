"use client";

import { CalendarPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToastStore } from "@/lib/toast";
import type { EventType } from "@/lib/types";

type Option = { id: string; name: string };

export function EventCreateForm({ groups, managers }: { groups: Option[]; managers: Option[] }) {
  const router = useRouter();
  const toast = useToastStore((s) => s.show);
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<EventType>("live");
  const [groupId, setGroupId] = useState("");
  const [venue, setVenue] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [managerId, setManagerId] = useState("");
  const [memo, setMemo] = useState("");

  async function createEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        event_type: eventType,
        group_id: groupId || null,
        venue: venue || null,
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt || startAt).toISOString(),
        manager_id: managerId || null,
        memo: memo || null,
      }),
    });

    if (!response.ok) {
      toast("일정 등록 실패", "error");
      return;
    }

    setTitle("");
    setVenue("");
    setStartAt("");
    setEndAt("");
    setMemo("");
    toast("일정 등록 완료!");
    router.refresh();
  }

  return (
    <form className="rounded-lg border border-white/10 bg-white/[0.04] p-4" onSubmit={createEvent}>
      <div className="grid gap-3 lg:grid-cols-4">
        <label className="text-sm text-zinc-300">
          제목
          <input className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        <label className="text-sm text-zinc-300">
          유형
          <select className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={eventType} onChange={(event) => setEventType(event.target.value as EventType)}>
            <option value="live">라이브</option>
            <option value="rehearsal">리허설</option>
            <option value="filming">촬영</option>
            <option value="meeting">미팅</option>
            <option value="other">기타</option>
          </select>
        </label>
        <label className="text-sm text-zinc-300">
          그룹
          <select className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={groupId} onChange={(event) => setGroupId(event.target.value)}>
            <option value="">전체</option>
            {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
          </select>
        </label>
        <label className="text-sm text-zinc-300">
          현장 담당자
          <select className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={managerId} onChange={(event) => setManagerId(event.target.value)}>
            <option value="">현장 담당자 미지정</option>
            {managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
          </select>
        </label>
        <label className="text-sm text-zinc-300">
          시작
          <input className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} required />
        </label>
        <label className="text-sm text-zinc-300">
          종료
          <input className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} />
        </label>
        <label className="text-sm text-zinc-300">
          장소
          <input className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={venue} onChange={(event) => setVenue(event.target.value)} />
        </label>
        <label className="text-sm text-zinc-300">
          메모
          <input className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={memo} onChange={(event) => setMemo(event.target.value)} />
        </label>
      </div>
      <button className="mt-4 flex h-10 items-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white" type="submit">
        <CalendarPlus className="h-4 w-4" />
        일정 등록
      </button>
    </form>
  );
}
