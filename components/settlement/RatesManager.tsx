"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useToastStore } from "@/lib/toast";

type Option = { id: string; name: string };
type Rate = {
  id: string;
  unit_price: number | null;
  members: { name: string } | { name: string }[] | null;
  privilege_types: { name: string } | { name: string }[] | null;
};

export function RatesManager({
  members,
  types,
  initialRates,
}: {
  members: Option[];
  types: Option[];
  initialRates: Rate[];
}) {
  const router = useRouter();
  const toast = useToastStore((s) => s.show);
  const [rates, setRates] = useState<Rate[]>(initialRates);
  const [memberId, setMemberId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 목록 즉시 갱신
  const refreshRates = useCallback(async () => {
    const res = await fetch("/api/settlement/rates");
    if (res.ok) {
      const body = await res.json();
      setRates(body.rates ?? []);
    }
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/settlement/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: memberId,
          privilege_type_id: typeId,
          unit_price: Number(unitPrice),
        }),
      });
      if (res.ok) {
        setUnitPrice("");
        await refreshRates();      // 목록 즉시 반영
        router.refresh();          // 하단 정산 테이블도 갱신
        toast("장당 정산액이 등록되었습니다.");
      } else {
        const body = await res.json().catch(() => ({}));
        toast(body?.error ?? "등록에 실패했습니다.", "error");
      }
    } catch {
      toast("네트워크 오류가 발생했습니다.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteRate(id: string) {
    const res = await fetch(`/api/settlement/rates/${id}`, { method: "DELETE" });
    if (res.ok) {
      await refreshRates();
      router.refresh();
      toast("삭제되었습니다.");
    } else {
      toast("삭제 실패", "error");
    }
  }

  return (
    <div className="space-y-4">
      {/* 등록 폼 */}
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
                step="1"
                inputMode="numeric"
                placeholder="5000"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                required
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">원</span>
            </div>
          </label>
          <button
            className="mt-7 flex h-10 items-center justify-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white disabled:opacity-50"
            type="submit"
            disabled={submitting}
          >
            <Plus className="h-4 w-4" />
            {submitting ? "처리중..." : "등록"}
          </button>
        </div>
      </form>

      {/* 등록된 목록 */}
      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
        <h2 className="font-semibold text-white">등록된 장당 정산액</h2>
        <div className="mt-3">
          {rates.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">등록된 장당 정산액이 없습니다.</p>
          ) : (
            <div className="divide-y divide-white/10">
              {rates.map((rate) => {
                const member = Array.isArray(rate.members) ? rate.members[0] : rate.members;
                const privilegeType = Array.isArray(rate.privilege_types) ? rate.privilege_types[0] : rate.privilege_types;
                const priceLabel = rate.unit_price != null
                  ? `${Number(rate.unit_price).toLocaleString()}원/장`
                  : "—";

                return (
                  <div key={rate.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                    <span className="text-zinc-200">
                      {member?.name ?? "멤버"} · {privilegeType?.name ?? "특전"}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums font-medium text-zinc-300">{priceLabel}</span>
                      <button
                        type="button"
                        onClick={() => deleteRate(rate.id)}
                        className="rounded p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-red-400"
                        aria-label="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
