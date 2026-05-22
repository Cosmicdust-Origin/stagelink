"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = { id: string; name: string };

export function RateCreateForm({ members, types }: { members: Option[]; types: Option[] }) {
  const router = useRouter();
  const [memberId, setMemberId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [rate, setRate] = useState("0.7");
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 10));

  async function createRate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/settlement/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: memberId, privilege_type_id: typeId, rate: Number(rate), valid_from: validFrom }),
    });
    if (response.ok) router.refresh();
  }

  return (
    <form className="rounded-lg border border-white/10 bg-white/[0.04] p-4" onSubmit={createRate}>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px_160px_auto]">
        <select className="h-10 rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={memberId} onChange={(event) => setMemberId(event.target.value)} required>
          <option value="">멤버</option>
          {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
        </select>
        <select className="h-10 rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={typeId} onChange={(event) => setTypeId(event.target.value)} required>
          <option value="">특전</option>
          {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>
        <input className="h-10 rounded-md border border-white/10 bg-[#101114] px-3 text-white" type="number" min="0" max="1" step="0.01" value={rate} onChange={(event) => setRate(event.target.value)} />
        <input className="h-10 rounded-md border border-white/10 bg-[#101114] px-3 text-white" type="date" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} />
        <button className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white" type="submit">
          <Plus className="h-4 w-4" />
          비율 등록
        </button>
      </div>
    </form>
  );
}
