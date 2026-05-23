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
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [venue, setVenue] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [managerId, setManagerId] = useState("");
  const [memo, setMemo] = useState("");

  function toggleGroup(id: string) {
    setGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  }

  async function createEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        event_type: eventType,
        group_ids: groupIds,
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
    setGroupIds([]);
    toast("일정 등록 완료!");
    router.refresh();
  }

  return (
    <form className="rounded-lg border border-white/10 bg-white/[0.04] p-4" onSubmit={createEvent}>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <label className="block min-w-0 text-sm text-zinc-300">
          제목
          <input
            className="mt-2 h-10 w-full min-w-0 rounded-md border border-white/10 bg-[#101114] px-3 text-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="block min-w-0 text-sm text-zinc-300">
          유형
          <select
            className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white"
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventType)}
          >
            <option value="live">라이브</option>
            <option value="rehearsal">리허설</option>
            <option value="filming">촬영</option>
            <option value="meeting">미팅</option>
            <option value="other">기타</option>
          </select>
        </label>
        <label className="block min-w-0 text-sm text-zinc-300">
          장소
          <input
            className="mt-2 h-10 w-full min-w-0 rounded-md border border-white/10 bg-[#101114] px-3 text-white"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />
        </label>
        <label className="block min-w-0 text-sm text-zinc-300">
          메모
          <input
            className="mt-2 h-10 w-full min-w-0 rounded-md border border-white/10 bg-[#101114] px-3 text-white"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </label>
        <label className="block min-w-0 text-sm text-zinc-300">
          시작
          <input
            className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-sm text-white"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            required
          />
        </label>
        <label className="block min-w-0 text-sm text-zinc-300">
          종료
          <input
            className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-sm text-white"
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
          />
        </label>
        <label className="block min-w-0 text-sm text-zinc-300">
          현장 담당자
          <select
            className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
          >
            <option value="">미지정</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </label>
      </div>

      {/* 그룹 다중 선택 */}
      {groups.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-sm text-zinc-300">그룹 <span className="text-xs text-zinc-500">(복수 선택 가능)</span></p>
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => {
              const active = groupIds.includes(group.id);
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-[#E8457A]/60 bg-[#E8457A]/15 text-[#ff8eb3]"
                      : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-300"
                  }`}
                >
                  {group.name}
                </button>
              );
            })}
          </div>
          {groupIds.length === 0 && (
            <p className="mt-1 text-xs text-zinc-600">선택 없음 = 전체 일정</p>
          )}
        </div>
      )}

      <button
        className="mt-4 flex h-10 items-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white"
        type="submit"
      >
        <CalendarPlus className="h-4 w-4" />
        일정 등록
      </button>
    </form>
  );
}
