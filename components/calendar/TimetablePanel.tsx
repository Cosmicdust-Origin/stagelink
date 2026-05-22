"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToastStore } from "@/lib/toast";

type Entry = {
  id: string;
  start_time: string;
  group_id: string | null;
  set_count: number | null;
  note: string | null;
  groups: { name: string } | null;
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
  const [time, setTime] = useState("18:00");
  const [groupId, setGroupId] = useState("");
  const [sets, setSets] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/events/${eventId}/timetable`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_time: time,
        group_id: groupId || null,
        set_count: sets ? Number(sets) : null,
        note: note || null,
        sort_order: entries.length,
      }),
    });
    setNote("");
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

  async function updateField(entryId: string, field: string, value: string | number | null) {
    await fetch(`/api/events/${eventId}/timetable/${entryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    toast("저장됨");
    router.refresh();
  }

  // "18:30:00" → "18:30"
  function fmt(t: string) { return t.slice(0, 5); }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <h2 className="font-semibold text-white">타임테이블</h2>

      {canEdit && (
        <form className="mt-3 grid grid-cols-[80px_1fr_72px_1fr_36px] gap-2" onSubmit={addEntry}>
          <input
            className={inputCls}
            type="text"
            pattern="[0-2][0-9]:[0-5][0-9]"
            placeholder="18:30"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
          <select
            className={inputCls}
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value="">전체</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <input
            className={inputCls}
            type="number"
            min="1"
            placeholder="공연 수"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
          />
          <input
            className={inputCls}
            placeholder="메모"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E8457A] text-white"
            type="submit"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>
      )}

      {entries.length > 0 && (
        <div className="mt-3 grid grid-cols-[80px_1fr_72px_1fr_36px] gap-2 px-2 text-xs text-zinc-500">
          <span>시간</span>
          <span>그룹</span>
          <span>공연 수</span>
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
            className="grid grid-cols-[80px_1fr_72px_1fr_36px] items-center gap-2 rounded-md bg-white/[0.03] px-2 py-1.5"
          >
            {canEdit ? (
              <input
                className={rowInputCls + " font-mono"}
                type="text"
                pattern="[0-2][0-9]:[0-5][0-9]"
                defaultValue={fmt(entry.start_time)}
                onBlur={(e) => updateField(entry.id, "start_time", e.target.value)}
              />
            ) : (
              <span className="font-mono text-sm text-zinc-300">{fmt(entry.start_time)}</span>
            )}

            {canEdit ? (
              <select
                className={rowInputCls + " bg-[#101114]"}
                defaultValue={entry.group_id ?? ""}
                onBlur={(e) => updateField(entry.id, "group_id", e.target.value || null)}
              >
                <option value="">전체</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-zinc-200">{entry.groups?.name ?? "전체"}</span>
            )}

            {canEdit ? (
              <input
                className={rowInputCls}
                type="number"
                min="1"
                defaultValue={entry.set_count ?? ""}
                placeholder="-"
                onBlur={(e) => updateField(entry.id, "set_count", e.target.value ? Number(e.target.value) : null)}
              />
            ) : (
              <span className="text-sm text-zinc-400">
                {entry.set_count != null ? `${entry.set_count}회` : "-"}
              </span>
            )}

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

            {canEdit ? (
              <button
                type="button"
                onClick={() => remove(entry.id)}
                disabled={busy === entry.id}
                className="flex h-7 w-7 items-center justify-center text-zinc-600 hover:text-red-400 disabled:opacity-40"
                aria-label="행 삭제"
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
