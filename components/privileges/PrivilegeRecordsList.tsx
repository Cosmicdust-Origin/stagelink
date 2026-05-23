"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToastStore } from "@/lib/toast";

export type PrivilegeRecordRow = {
  id: string;
  quantity: number;
  event_title: string;
  event_date: string;
  member_name: string;
  privilege_type: string;
};

export function PrivilegeRecordsList({ records }: { records: PrivilegeRecordRow[] }) {
  const router = useRouter();
  const toast = useToastStore((s) => s.show);
  const [saving, setSaving] = useState<string | null>(null);

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
        toast("수량이 수정되었습니다.");
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
    try {
      const res = await fetch(`/api/privileges/records/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
        toast("기록이 삭제되었습니다.");
      } else {
        toast("삭제에 실패했습니다.", "error");
      }
    } catch {
      toast("네트워크 오류가 발생했습니다.", "error");
    }
  }

  if (records.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-500">이 달에 등록된 수량 기록이 없습니다.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs text-zinc-500">
            <th className="pb-2 pr-4 font-medium">공연</th>
            <th className="pb-2 pr-4 font-medium">날짜</th>
            <th className="pb-2 pr-4 font-medium">멤버</th>
            <th className="pb-2 pr-4 font-medium">특전</th>
            <th className="pb-2 pr-4 font-medium">수량</th>
            <th className="pb-2 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {records.map((row) => (
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
      <td className="py-2 pr-4 text-zinc-200">{row.event_title}</td>
      <td className="py-2 pr-4 tabular-nums text-zinc-400">{row.event_date}</td>
      <td className="py-2 pr-4 text-zinc-300">{row.member_name}</td>
      <td className="py-2 pr-4 text-zinc-300">{row.privilege_type}</td>
      <td className="py-2 pr-4">
        <input
          className={`h-8 w-20 rounded-md border px-2 text-center tabular-nums text-white transition-colors ${
            dirty
              ? "border-[#E8457A] bg-[#E8457A]/10"
              : "border-white/10 bg-[#101114]"
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
      <td className="py-2">
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-1 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
          aria-label="삭제"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
