"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToastStore } from "@/lib/toast";

const CATEGORY_LABEL: Record<string, string> = {
  on_site: "현장",
  event: "이벤트",
  mail_order: "통판",
  goods: "굿즈",
  other: "기타",
};

export type PrivilegeTypeRow = {
  id: string;
  name: string;
  category: string;
  unit_price: number | null;
  settlement_type: "rate" | "fixed";
};

export function PrivilegeTypesList({ types }: { types: PrivilegeTypeRow[] }) {
  const router = useRouter();
  const toast = useToastStore((s) => s.show);
  const [saving, setSaving] = useState<string | null>(null);

  async function updateType(id: string, patch: Record<string, unknown>) {
    setSaving(id);
    try {
      const res = await fetch(`/api/privileges/types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        router.refresh();
        toast("수정되었습니다.");
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

  async function deleteType(id: string) {
    try {
      const res = await fetch(`/api/privileges/types/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
        toast("삭제되었습니다.");
      } else {
        toast("삭제에 실패했습니다.", "error");
      }
    } catch {
      toast("네트워크 오류가 발생했습니다.", "error");
    }
  }

  if (types.length === 0) return null;

  return (
    <div className="mt-3 divide-y divide-white/5 pl-4">
      {types.map((t) => (
        <TypeRow
          key={t.id}
          type={t}
          isSaving={saving === t.id}
          onSave={(patch) => updateType(t.id, patch)}
          onDelete={() => deleteType(t.id)}
        />
      ))}
    </div>
  );
}

function TypeRow({
  type,
  isSaving,
  onSave,
  onDelete,
}: {
  type: PrivilegeTypeRow;
  isSaving: boolean;
  onSave: (patch: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(type.name);
  const [price, setPrice] = useState(String(type.unit_price ?? ""));
  const nameDirty = name !== type.name;
  const priceDirty = price !== String(type.unit_price ?? "");

  function handleNameBlur() {
    if (nameDirty && name.trim()) onSave({ name: name.trim() });
  }

  function handlePriceBlur() {
    const parsed = Number(price);
    if (priceDirty && !Number.isNaN(parsed)) onSave({ unit_price: parsed });
  }

  return (
    <div className={`group flex items-center gap-3 py-1.5 text-xs ${isSaving ? "opacity-50" : ""}`}>
      {/* 카테고리 뱃지 */}
      <span className="w-12 shrink-0 text-center rounded bg-white/[0.06] px-1.5 py-0.5 text-zinc-400">
        {CATEGORY_LABEL[type.category] ?? type.category}
      </span>

      {/* 정산방식 뱃지 */}
      <span className={`shrink-0 rounded px-1.5 py-0.5 font-medium ${
        type.settlement_type === "fixed"
          ? "bg-blue-500/20 text-blue-300"
          : "bg-emerald-500/20 text-emerald-300"
      }`}>
        {type.settlement_type === "fixed" ? "금액" : "비율"}
      </span>

      {/* 특전명 인라인 편집 */}
      <input
        className={`h-7 w-36 rounded border px-2 text-xs text-white transition-colors ${
          nameDirty ? "border-[#E8457A] bg-[#E8457A]/10" : "border-transparent bg-transparent hover:border-white/10"
        } ${isSaving ? "pointer-events-none" : ""}`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleNameBlur}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        disabled={isSaving}
      />

      {/* 단가/금액 인라인 편집 */}
      <div className="relative shrink-0">
        <input
          className={`h-7 w-24 rounded border px-2 pr-6 text-right text-xs tabular-nums text-white transition-colors ${
            priceDirty ? "border-[#E8457A] bg-[#E8457A]/10" : "border-transparent bg-transparent hover:border-white/10"
          } ${isSaving ? "pointer-events-none" : ""}`}
          type="number"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={handlePriceBlur}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          disabled={isSaving}
        />
        <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500">원</span>
      </div>

      {/* 삭제 */}
      <button
        type="button"
        onClick={onDelete}
        disabled={isSaving}
        className="rounded p-1 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
        aria-label="삭제"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
