"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/lib/toast";

type Rate = {
  id: string;
  rate: number;
  valid_from: string;
  profiles: { name: string } | { name: string }[] | null;
  privilege_types: { name: string } | { name: string }[] | null;
};

export function SettlementRatesList({ rates }: { rates: Rate[] }) {
  const router = useRouter();
  const toast = useToastStore((s) => s.show);

  async function deleteRate(id: string) {
    const res = await fetch(`/api/settlement/rates/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("비율 삭제 완료");
      router.refresh();
    } else {
      toast("삭제 실패", "error");
    }
  }

  if (rates.length === 0) {
    return <p className="py-4 text-center text-sm text-zinc-500">등록된 정산 비율이 없습니다.</p>;
  }

  return (
    <div className="divide-y divide-white/10">
      {rates.map((rate) => {
        const profile = Array.isArray(rate.profiles) ? rate.profiles[0] : rate.profiles;
        const privilegeType = Array.isArray(rate.privilege_types) ? rate.privilege_types[0] : rate.privilege_types;

        return (
          <div key={rate.id} className="flex items-center justify-between gap-4 py-2 text-sm">
            <span className="text-zinc-200">
              {profile?.name ?? "멤버"} · {privilegeType?.name ?? "특전"}
            </span>
            <div className="flex items-center gap-3">
              <span className="tabular-nums text-zinc-400">{Number(rate.rate) * 100}%</span>
              <span className="text-xs text-zinc-600">{rate.valid_from} ~</span>
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
  );
}
