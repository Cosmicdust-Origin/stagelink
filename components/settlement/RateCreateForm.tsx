"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToastStore } from "@/lib/toast";

type Option = { id: string; name: string };

export function RateCreateForm({ members, types }: { members: Option[]; types: Option[] }) {
  const router = useRouter();
  const toast = useToastStore((s) => s.show);
  const [memberId, setMemberId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const response = await fetch("/api/settlement/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: memberId,
          privilege_type_id: typeId,
          unit_price: Number(unitPrice),
        }),
      });
      if (response.ok) {
        setUnitPrice("");
        router.refresh();
        toast("장당 정산액이 등록되었습니다.");
      } else {
        const body = await response.json().catch(() => ({}));
        toast(body?.error ?? "등록에 실패했습니다.", "error");
      }
    } catch {
      toast("네트워크 오류가 발생했습니다.", "error");
    }
  }

  return (
    <form className="rounded-lg border border-white/10 bg-white/[0.04] p-4" onSubmit={submit}>
      <p className="mb-3 text-xs text-zinc-500">
        멤버마다 특전 유형별 장당 정산액을 직접 입력합니다.
        같은 조합으로 다시 등록하면 금액이 업데이트됩니다.
      </p>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]">
        <label className="text-sm text-zinc-300">
          멤버
          <select
            className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            required
          >
            <option value="">선택</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-zinc-300">
          특전 유형
          <select
            className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white"
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            required
          >
            <option value="">선택</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-zinc-300">
          장당 정산액
          <div className="relative mt-2">
            <input
              className="h-10 w-full rounded-md border border-white/10 bg-[#101114] pl-3 pr-8 text-white"
              type="number"
              min="0"
              step="100"
              placeholder="5000"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              required
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">원</span>
          </div>
        </label>
        <button
          className="mt-7 flex h-10 items-center justify-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white"
          type="submit"
        >
          <Plus className="h-4 w-4" />
          등록
        </button>
      </div>
    </form>
  );
}
