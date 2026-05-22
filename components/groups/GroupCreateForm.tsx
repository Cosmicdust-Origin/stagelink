"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToastStore } from "@/lib/toast";

export function GroupCreateForm() {
  const router = useRouter();
  const toast = useToastStore((s) => s.show);
  const [name, setName] = useState("");
  const [debutDate, setDebutDate] = useState("");
  const [description, setDescription] = useState("");
  const [privilegeUnitPrice, setPrivilegeUnitPrice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const response = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        debut_date: debutDate || null,
        description: description || null,
        privilege_unit_price: privilegeUnitPrice ? Number(privilegeUnitPrice) : null,
      }),
    });

    setIsSaving(false);

    if (!response.ok) {
      toast("그룹 추가 실패", "error");
      return;
    }

    setName("");
    setDebutDate("");
    setDescription("");
    setPrivilegeUnitPrice("");
    toast("그룹 추가 완료!");
    router.refresh();
  }

  return (
    <form className="rounded-lg border border-white/10 bg-white/[0.04] p-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-[1fr_160px_1.5fr_140px_auto]">
        <label className="text-sm text-zinc-300">
          그룹명
          <input className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="text-sm text-zinc-300">
          데뷔일
          <input className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" type="date" value={debutDate} onChange={(event) => setDebutDate(event.target.value)} />
        </label>
        <label className="text-sm text-zinc-300">
          설명
          <input className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label className="text-sm text-zinc-300">
          특전권 장당 단가
          <div className="relative mt-2">
            <input className="h-10 w-full rounded-md border border-white/10 bg-[#101114] pl-3 pr-8 text-white" type="number" min="0" step="100" placeholder="5000" value={privilegeUnitPrice} onChange={(event) => setPrivilegeUnitPrice(event.target.value)} />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">원</span>
          </div>
        </label>
        <button className="mt-7 flex h-10 items-center justify-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white disabled:opacity-60" type="submit" disabled={isSaving}>
          <Plus className="h-4 w-4" />
          추가
        </button>
      </div>
    </form>
  );
}
