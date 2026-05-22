"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = { id: string; name: string };

export function RateCreateForm({ members, types }: { members: Option[]; types: Option[] }) {
  const router = useRouter();
  const [memberId, setMemberId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [ratePercent, setRatePercent] = useState("70");
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 10));

  async function createRate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/settlement/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: memberId, privilege_type_id: typeId, rate: Number(ratePercent) / 100, valid_from: validFrom }),
    });
    if (response.ok) router.refresh();
  }

  return (
    <form className="rounded-lg border border-white/10 bg-white/[0.04] p-4" onSubmit={createRate}>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_140px_160px_auto]">
        <label className="text-sm text-zinc-300">
          멤버
          <select className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
            <option value="">선택</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <label className="text-sm text-zinc-300">
          특전
          <select className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={typeId} onChange={(e) => setTypeId(e.target.value)} required>
            <option value="">선택</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="text-sm text-zinc-300">
          멤버 정산 비율
          <div className="relative mt-2">
            <input
              className="h-10 w-full rounded-md border border-white/10 bg-[#101114] pl-3 pr-8 text-white"
              type="number"
              min="0"
              max="100"
              step="1"
              value={ratePercent}
              onChange={(e) => setRatePercent(e.target.value)}
              required
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">%</span>
          </div>
        </label>
        <label className="text-sm text-zinc-300">
          적용일
          <input className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
        </label>
        <button className="mt-7 flex h-10 items-center justify-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white" type="submit">
          <Plus className="h-4 w-4" />
          비율 등록
        </button>
      </div>
    </form>
  );
}
