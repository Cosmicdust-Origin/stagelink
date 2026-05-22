"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToastStore } from "@/lib/toast";

type Item = {
  id: string;
  label: string;
  is_checked: boolean;
  checked_at: string | null;
};

export function ChecklistPanel({
  eventId,
  items,
  canEdit,
}: {
  eventId: string;
  items: Item[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const toast = useToastStore((s) => s.show);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/events/${eventId}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, sort_order: items.length }),
    });
    setLabel("");
    toast("항목 추가됨");
    router.refresh();
  }

  async function toggle(item: Item) {
    if (!canEdit || busy) return;
    setBusy(item.id);
    await fetch(`/api/events/${eventId}/checklist/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_checked: !item.is_checked }),
    });
    setBusy(null);
    toast(item.is_checked ? "완료 취소됨" : "완료 표시됨");
    router.refresh();
  }

  async function remove(itemId: string) {
    if (busy) return;
    setBusy(itemId);
    await fetch(`/api/events/${eventId}/checklist/${itemId}`, { method: "DELETE" });
    setBusy(null);
    toast("항목 삭제됨");
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <h2 className="font-semibold text-white">체크리스트</h2>

      {canEdit && (
        <form className="mt-3 flex gap-2" onSubmit={addItem}>
          <input
            className="h-9 flex-1 rounded-md border border-white/10 bg-[#101114] px-3 text-sm text-white placeholder:text-zinc-600"
            placeholder="항목 입력 후 추가"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#E8457A] text-white"
            type="submit"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>
      )}

      <ul className="mt-3 space-y-1">
        {items.length === 0 && (
          <li className="py-4 text-center text-sm text-zinc-500">항목이 없습니다</li>
        )}
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/[0.03]"
          >
            <button
              type="button"
              disabled={!canEdit || busy === item.id}
              onClick={() => toggle(item)}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors
                ${item.is_checked
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                  : "border-white/20 text-transparent hover:border-white/40"
                } disabled:cursor-default`}
              aria-label={item.is_checked ? "완료 취소" : "완료 표시"}
            >
              <Check className="h-3 w-3" />
            </button>

            <span className={`flex-1 text-sm ${item.is_checked ? "text-zinc-500 line-through" : "text-zinc-200"}`}>
              {item.label}
            </span>

            {item.checked_at && (
              <span className="text-xs text-zinc-600">
                {new Date(item.checked_at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={() => remove(item.id)}
                disabled={busy === item.id}
                className="ml-1 text-zinc-600 hover:text-red-400 disabled:opacity-40"
                aria-label="항목 삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
