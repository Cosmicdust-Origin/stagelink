"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToastStore } from "@/lib/toast";

type Entry = {
  id: string;
  start_time: string;
  end_time: string | null;
  group_id: string | null;
  note: string | null;
  groups: { name: string } | { name: string }[] | null;
};

type GroupOption = { id: string; name: string };

const inputCls = "h-9 rounded-md border border-white/10 bg-[#101114] px-2 text-sm text-white placeholder:text-zinc-600";
const rowInputCls = "h-7 w-full rounded border border-white/10 bg-transparent px-1 text-xs text-zinc-300 focus:border-white/30 focus:outline-none";

export function TimetablePanel({
  eventId,
  entries,
  groups,
  canEdit,
}: {
  eventId: string;
  entries: Entry[];
  groups: GroupOption[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const toast = useToastStore((s) => s.show);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("");
  const [groupId, setGroupId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/events/${eventId}/timetable`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_time: startTime,
        end_time: endTime || null,
        group_id: groupId || null,
        note: note || null,
        sort_order: entries.length,
      }),
    });
    setNote("");
    setEndTime("");
    toast("타임테이블 추가됨");
    router.refresh();
  }

  async function remove(entryId: string) {
    if (busy) return;
    setBusy(entryId);
    await fetch(`/api/events/${eventId}/timetable/${entryId}`, { method: "DELETE" });
    setBusy(null);
    toast("항목 삭제됨");
    router.refresh();
  }

  async function updateField(entryId: string, field: string, value: string | null) {
    await fetch(`/api/events/${eventId}/timetable/${entryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    toast("저장됨");
    router.refresh();
  }

  function fmt(t: string) {
    return t.slice(0, 5);
  }

  function timeRange(entry: Entry) {
    const start = fmt(entry.start_time);
    return entry.end_time ? `${start} ~ ${fmt(entry.end_time)}` : start;
  }

  function getGroupName(entry: Entry) {
    if (!entry.groups) return "전체";
    return Array.isArray(entry.groups) ? entry.groups[0]?.name ?? "전체" : entry.groups.name;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <h2 className="font-semibold text-white">타임테이블</h2>

      {canEdit && (
        <form className="mt-3 flex flex-wrap gap-2" onSubmit={addEntry}>
          {/* 시작 ~ 종료 */}
          <div className="flex items-center gap-1">
            <input
              className={inputCls + " w-20"}
              type="text"
              pattern="[0-2][0-9]:[0-5][0-9]"
              placeholder="19:00"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <span className="text-xs text-zinc-500">~</span>
            <input
              className={inputCls + " w-20"}
              type="text"
              pattern="[0-2][0-9]:[0-5][0-9]"
              placeholder="21:30"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <select
            className={inputCls + " flex-1 min-w-[100px]"}
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value="">전체</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
          <input
            className={inputCls + " flex-1 min-w-[100px]"}
            placeholder="메모"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#E8457A] text-white" type="submit">
            <Plus className="h-4 w-4" />
          </button>
        </form>
      )}

      {entries.length > 0 && (
        <div className="mt-3 grid grid-cols-[1fr_1fr_1fr_36px] gap-2 px-2 text-xs text-zinc-500">
          <span>시간</span>
          <span>그룹</span>
          <span>메모</span>
          {canEdit && <span />}
        </div>
      )}

      <ul className="mt-1 space-y-1">
        {entries.length === 0 && (
          <li className="py-4 text-center text-sm text-zinc-500">타임테이블이 없습니다</li>
        )}
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="grid grid-cols-[1fr_1fr_1fr_36px] items-center gap-2 rounded-md bg-white/[0.03] px-2 py-1.5"
          >
            {/* 시간 컬럼: 시작~종료 */}
            {canEdit ? (
              <div className="flex items-center gap-1">
                <input
                  className={rowInputCls + " font-mono w-14"}
                  type="text"
                  pattern="[0-2][0-9]:[0-5][0-9]"
                  defaultValue={fmt(entry.start_time)}
                  onBlur={(e) => updateField(entry.id, "start_time", e.target.value)}
                />
                <span className="text-zinc-600">~</span>
                <input
                  className={rowInputCls + " font-mono w-14"}
                  type="text"
                  pattern="[0-2][0-9]:[0-5][0-9]"
                  defaultValue={entry.end_time ? fmt(entry.end_time) : ""}
                  placeholder="종료"
                  onBlur={(e) => updateField(entry.id, "end_time", e.target.value || null)}
                />
              </div>
            ) : (
              <span className="font-mono text-sm text-zinc-300">{timeRange(entry)}</span>
            )}

            {/* 그룹 컬럼 */}
            {canEdit ? (
              <select
                className={rowInputCls + " bg-[#101114]"}
                defaultValue={entry.group_id ?? ""}
                onBlur={(e) => updateField(entry.id, "group_id", e.target.value || null)}
              >
                <option value="">전체</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-zinc-200">{getGroupName(entry)}</span>
            )}

            {/* 메모 컬럼 */}
            {canEdit ? (
              <input
                className={rowInputCls}
                defaultValue={entry.note ?? ""}
                placeholder="메모"
                onBlur={(e) => updateField(entry.id, "note", e.target.value || null)}
              />
            ) : (
              <span className="text-sm text-zinc-500">{entry.note ?? ""}</span>
            )}

            {/* 삭제 */}
            {canEdit ? (
              <button
                type="button"
                onClick={() => remove(entry.id)}
                disabled={busy === entry.id}
                className="flex h-7 w-7 items-center justify-center text-zinc-600 hover:text-red-400 disabled:opacity-40"
                aria-label="항목 삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
