"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useToastStore } from "@/lib/toast";

export type PrivilegeRecordRow = {
  id: string;
  quantity: number;
  event_id: string;
  event_title: string;
  event_date: string;
  group_name: string;
  member_name: string;
  privilege_type: string;
};

type EventGroup = {
  id: string;
  title: string;
  date: string;
  rows: PrivilegeRecordRow[];
};

export function PrivilegeRecordsList({ records }: { records: PrivilegeRecordRow[] }) {
  const router = useRouter();
  const toast = useToastStore((s) => s.show);
  const [saving, setSaving] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const eventGroups = useMemo(() => {
    const grouped = new Map<string, EventGroup>();

    for (const record of records) {
      const key = record.event_id || `${record.event_title}:${record.event_date}`;
      const group = grouped.get(key) ?? {
        id: key,
        title: record.event_title,
        date: record.event_date,
        rows: [],
      };
      group.rows.push(record);
      grouped.set(key, group);
    }

    return [...grouped.values()].sort((a, b) => {
      const dateOrder = a.date.localeCompare(b.date);
      return dateOrder === 0 ? a.title.localeCompare(b.title, "ko") : dateOrder;
    });
  }, [records]);

  async function updateQuantity(id: string, quantity: number) {
    setSaving(id);
    try {
      const res = await fetch(`/api/privileges/records/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        router.refresh();
        toast("수량을 수정했습니다.");
      } else {
        const body = await res.json().catch(() => ({}));
        toast(body?.error ?? "수정에 실패했습니다.", "error");
      }
    } catch {
      toast("네트워크 오류가 발생했습니다.", "error");
    } finally {
      setSaving(null);
    }
  }

  async function deleteRecord(id: string) {
    if (!window.confirm("이 특전 수량 기록을 삭제할까요?")) return;

    try {
      const res = await fetch(`/api/privileges/records/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
        toast("기록을 삭제했습니다.");
      } else {
        toast("삭제에 실패했습니다.", "error");
      }
    } catch {
      toast("네트워크 오류가 발생했습니다.", "error");
    }
  }

  function toggleEventGroup(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (records.length === 0) {
    return <p className="py-6 text-center text-sm text-zinc-500">필터에 해당하는 수량 기록이 없습니다.</p>;
  }

  return (
    <div className="space-y-4">
      {eventGroups.map((eventGroup) => {
        const isCollapsed = collapsed.has(eventGroup.id);

        return (
          <section key={eventGroup.id} className="overflow-hidden rounded-md border border-white/10">
            <button
              type="button"
              aria-expanded={!isCollapsed}
              onClick={() => toggleEventGroup(eventGroup.id)}
              className={`flex w-full flex-wrap items-center justify-between gap-2 bg-white/[0.035] px-3 py-2 text-left transition-colors hover:bg-white/[0.055] ${
                isCollapsed ? "" : "border-b border-white/10"
              }`}
            >
              <span>
                <span className="block font-semibold text-white">{eventGroup.title}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">{eventGroup.date}</span>
              </span>
              <span className="flex items-center gap-2 text-xs text-zinc-400">
                {eventGroup.rows.length}건
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </span>
            </button>
            {!isCollapsed ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs text-zinc-500">
                      <th className="px-3 py-2 font-medium">그룹</th>
                      <th className="px-3 py-2 font-medium">멤버</th>
                      <th className="px-3 py-2 font-medium">특전</th>
                      <th className="px-3 py-2 font-medium">수량</th>
                      <th className="px-3 py-2 text-right font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {eventGroup.rows
                      .slice()
                      .sort((a, b) => {
                        const groupOrder = a.group_name.localeCompare(b.group_name, "ko");
                        if (groupOrder !== 0) return groupOrder;
                        return a.member_name.localeCompare(b.member_name, "ko");
                      })
                      .map((row) => (
                        <QuantityRow
                          key={row.id}
                          row={row}
                          isSaving={saving === row.id}
                          onSave={(qty) => updateQuantity(row.id, qty)}
                          onDelete={() => deleteRecord(row.id)}
                        />
                      ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function QuantityRow({
  row,
  isSaving,
  onSave,
  onDelete,
}: {
  row: PrivilegeRecordRow;
  isSaving: boolean;
  onSave: (qty: number) => void;
  onDelete: () => void;
}) {
  const [qty, setQty] = useState(String(row.quantity));
  const dirty = Number(qty) !== row.quantity;

  function handleBlur() {
    const parsed = Number(qty);
    if (!Number.isNaN(parsed) && parsed >= 0 && dirty) {
      onSave(parsed);
    }
  }

  return (
    <tr className="group">
      <td className="px-3 py-2 text-zinc-400">{row.group_name}</td>
      <td className="px-3 py-2 text-zinc-300">{row.member_name}</td>
      <td className="px-3 py-2 text-zinc-300">{row.privilege_type}</td>
      <td className="px-3 py-2">
        <input
          className={`h-8 w-20 rounded-md border px-2 text-center tabular-nums text-white transition-colors ${
            dirty ? "border-[#E8457A] bg-[#E8457A]/10" : "border-white/10 bg-[#101114]"
          } ${isSaving ? "opacity-50" : ""}`}
          type="number"
          min="0"
          value={qty}
          disabled={isSaving}
          onChange={(e) => setQty(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
      </td>
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={onDelete}
          className="h-8 rounded-md border border-white/10 px-3 text-xs font-medium text-zinc-400 transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
        >
          삭제
        </button>
      </td>
    </tr>
  );
}
