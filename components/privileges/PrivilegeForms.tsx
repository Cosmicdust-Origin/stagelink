"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToastStore } from "@/lib/toast";

type Option = { id: string; name: string };
type PrivilegeTypeOption = Option & { unit_price?: number | null };

export function PrivilegeTypeCreateForm() {
  const router = useRouter();
  const toast = useToastStore((s) => s.show);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("on_site");
  const [unitPrice, setUnitPrice] = useState("");

  async function createType(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await fetch("/api/privileges/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, unit_price: unitPrice ? Number(unitPrice) : null }),
      });
      if (response.ok) {
        setName("");
        setUnitPrice("");
        router.refresh();
        toast("특전이 등록되었습니다.");
      } else {
        const body = await response.json().catch(() => ({}));
        toast(body?.error ?? "등록에 실패했습니다.", "error");
      }
    } catch {
      toast("네트워크 오류가 발생했습니다.", "error");
    }
  }

  return (
    <form className="rounded-lg border border-white/10 bg-white/[0.04] p-4" onSubmit={createType}>
      <div className="grid gap-3 md:grid-cols-[1fr_160px_160px_auto]">
        <input className="h-10 rounded-md border border-white/10 bg-[#101114] px-3 text-white" placeholder="특전명" value={name} onChange={(event) => setName(event.target.value)} required />
        <select className="h-10 rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="on_site">현장</option>
          <option value="event">이벤트</option>
          <option value="mail_order">통판</option>
          <option value="goods">굿즈</option>
          <option value="other">기타</option>
        </select>
        <input className="h-10 rounded-md border border-white/10 bg-[#101114] px-3 text-white" type="number" placeholder="단가" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} />
        <button className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white" type="submit">
          <Plus className="h-4 w-4" />
          특전 등록
        </button>
      </div>
    </form>
  );
}

export function PrivilegeRecordCreateForm({
  events,
  members,
  types,
}: {
  events: Option[];
  members: Option[];
  types: PrivilegeTypeOption[];
}) {
  const router = useRouter();
  const toast = useToastStore((s) => s.show);
  const [eventId, setEventId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [quantity, setQuantity] = useState("1");

  async function createRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await fetch(`/api/events/${eventId}/privileges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: [{ member_id: memberId, privilege_type_id: typeId, quantity: Number(quantity) }] }),
      });
      if (response.ok) {
        setQuantity("1");
        router.refresh();
        toast("수량이 등록되었습니다.");
      } else {
        const body = await response.json().catch(() => ({}));
        toast(body?.error ?? "등록에 실패했습니다.", "error");
      }
    } catch {
      toast("네트워크 오류가 발생했습니다.", "error");
    }
  }

  return (
    <form className="rounded-lg border border-white/10 bg-white/[0.04] p-4" onSubmit={createRecord}>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_100px_auto]">
        <div className="space-y-1">
          <select className="h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={eventId} onChange={(event) => setEventId(event.target.value)} required>
            <option value="">이벤트</option>
            {events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <p className="text-xs text-zinc-500">캘린더에 등록된 공연이 연동됩니다</p>
        </div>
        <select className="h-10 rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={memberId} onChange={(event) => setMemberId(event.target.value)} required>
          <option value="">멤버</option>
          {members.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select className="h-10 rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={typeId} onChange={(event) => setTypeId(event.target.value)} required>
          <option value="">특전</option>
          {types.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <input className="h-10 rounded-md border border-white/10 bg-[#101114] px-3 text-white" type="number" min="0" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        <button className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white" type="submit">
          <Plus className="h-4 w-4" />
          수량 등록
        </button>
      </div>
    </form>
  );
}
