"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type PrivilegeType = {
  id: string;
  name: string;
  category: string;
  unit_price: number | null;
  is_active: boolean;
};

export function PrivilegeTypeManager({ types }: { types: PrivilegeType[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("on_site");
  const [unitPrice, setUnitPrice] = useState("");
  const [message, setMessage] = useState("");

  async function createType(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/privileges/types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category,
        unit_price: unitPrice ? Number(unitPrice) : null,
      }),
    });

    if (!response.ok) {
      setMessage("특전 항목을 추가하지 못했습니다.");
      return;
    }

    setName("");
    setUnitPrice("");
    setMessage("특전 항목을 추가했습니다.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form className="rounded-lg border border-white/10 bg-[#101114] p-4" onSubmit={createType}>
        <div className="grid gap-3 md:grid-cols-[1fr_140px_120px_auto]">
          <input
            className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-white"
            placeholder="특전명"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <CategorySelect value={category} onChange={setCategory} />
          <input
            className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-white"
            type="number"
            min="0"
            placeholder="단가"
            value={unitPrice}
            onChange={(event) => setUnitPrice(event.target.value)}
          />
          <button className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white" type="submit">
            <Plus className="h-4 w-4" />
            추가
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-zinc-400">{message}</p> : null}
      </form>
      <div className="space-y-2">
        {types.map((type) => (
          <PrivilegeTypeRow key={type.id} type={type} />
        ))}
      </div>
    </div>
  );
}

function PrivilegeTypeRow({ type }: { type: PrivilegeType }) {
  const router = useRouter();
  const [name, setName] = useState(type.name);
  const [category, setCategory] = useState(type.category);
  const [unitPrice, setUnitPrice] = useState(type.unit_price?.toString() ?? "");
  const [isActive, setIsActive] = useState(type.is_active);

  async function saveType() {
    const response = await fetch(`/api/privileges/types/${type.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category,
        unit_price: unitPrice ? Number(unitPrice) : null,
        is_active: isActive,
      }),
    });
    if (response.ok) router.refresh();
  }

  async function deleteType() {
    if (!window.confirm("이 특전 항목을 비활성화할까요? 기존 기록은 유지됩니다.")) return;
    const response = await fetch(`/api/privileges/types/${type.id}`, { method: "DELETE" });
    if (response.ok) router.refresh();
  }

  return (
    <div className="grid gap-2 rounded-lg border border-white/10 bg-[#101114] p-3 md:grid-cols-[1fr_140px_120px_90px_auto_auto]">
      <input className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-white" value={name} onChange={(event) => setName(event.target.value)} />
      <CategorySelect value={category} onChange={setCategory} />
      <input className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-white" type="number" min="0" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} placeholder="단가" />
      <label className="flex h-10 items-center gap-2 text-sm text-zinc-300">
        <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
        사용
      </label>
      <button className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#E8457A] px-3 text-sm font-semibold text-white" type="button" onClick={saveType}>
        <Save className="h-4 w-4" />
        저장
      </button>
      <button className="flex h-10 items-center justify-center gap-2 rounded-md border border-red-500/40 px-3 text-sm font-semibold text-red-300" type="button" onClick={deleteType}>
        <Trash2 className="h-4 w-4" />
        삭제
      </button>
    </div>
  );
}

function CategorySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-white" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="on_site">현장</option>
      <option value="event">이벤트</option>
      <option value="mail_order">통판</option>
      <option value="goods">굿즈</option>
      <option value="other">기타</option>
    </select>
  );
}
