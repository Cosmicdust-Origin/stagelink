"use client";

import { Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function GroupActions({
  groupId,
  initialName,
  initialDescription,
  initialDebutDate,
  initialPrivilegeUnitPrice,
}: {
  groupId: string;
  initialName: string;
  initialDescription: string;
  initialDebutDate: string;
  initialPrivilegeUnitPrice: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [debutDate, setDebutDate] = useState(initialDebutDate);
  const [privilegeUnitPrice, setPrivilegeUnitPrice] = useState(initialPrivilegeUnitPrice);
  const [message, setMessage] = useState("");

  async function saveGroup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch(`/api/groups/${groupId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: description || null,
        debut_date: debutDate || null,
        privilege_unit_price: privilegeUnitPrice ? Number(privilegeUnitPrice) : null,
      }),
    });
    setMessage(response.ok ? "그룹 정보를 저장했습니다." : "그룹 정보를 저장하지 못했습니다.");
    router.refresh();
  }

  async function deleteGroup() {
    if (!window.confirm("이 그룹을 삭제할까요? 연결된 멤버 배정도 함께 삭제됩니다.")) return;
    const response = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    if (response.ok) router.push("/groups");
    else setMessage("그룹을 삭제하지 못했습니다.");
  }

  return (
    <form className="mt-4 rounded-lg border border-white/10 bg-[#101114] p-4" onSubmit={saveGroup}>
      <div className="grid gap-3 md:grid-cols-[1fr_160px_1.5fr_140px_auto_auto]">
        <label className="text-sm text-zinc-300">
          그룹명
          <input className="mt-2 h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-white" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="text-sm text-zinc-300">
          데뷔일
          <input className="mt-2 h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-white" type="date" value={debutDate} onChange={(event) => setDebutDate(event.target.value)} />
        </label>
        <label className="text-sm text-zinc-300">
          설명
          <input className="mt-2 h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-white" value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label className="text-sm text-zinc-300">
          특전권 장당 단가
          <div className="relative mt-2">
            <input className="h-10 w-full rounded-md border border-white/10 bg-white/[0.04] pl-3 pr-8 text-white" type="number" min="0" step="100" placeholder="5000" value={privilegeUnitPrice} onChange={(event) => setPrivilegeUnitPrice(event.target.value)} />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">원</span>
          </div>
        </label>
        <button className="mt-7 flex h-10 items-center justify-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white" type="submit">
          <Save className="h-4 w-4" />
          저장
        </button>
        <button className="mt-7 flex h-10 items-center justify-center gap-2 rounded-md border border-red-500/40 px-4 text-sm font-semibold text-red-300 hover:bg-red-500/10" type="button" onClick={deleteGroup}>
          <Trash2 className="h-4 w-4" />
          삭제
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-zinc-300">{message}</p> : null}
    </form>
  );
}
