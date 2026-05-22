"use client";

import { Plus, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function InviteUserForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"manager" | "member">("member");
  const [message, setMessage] = useState("");

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/auth/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, role }),
    });
    setMessage(response.ok ? "초대를 보냈습니다." : "초대를 보내지 못했습니다.");
  }

  return (
    <form className="space-y-3" onSubmit={invite}>
      <input className="h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" type="email" placeholder="email@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
      <input className="h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" placeholder="이름" value={name} onChange={(event) => setName(event.target.value)} />
      <select className="h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={role} onChange={(event) => setRole(event.target.value as "manager" | "member")}>
        <option value="member">member</option>
        <option value="manager">manager</option>
      </select>
      <button className="flex h-10 items-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white" type="submit">
        <Send className="h-4 w-4" />
        초대 발송
      </button>
      {message ? <p className="text-sm text-zinc-400">{message}</p> : null}
    </form>
  );
}

export function ChecklistTemplateForm() {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [isDefault, setIsDefault] = useState(true);

  async function createTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/checklist-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, is_default: isDefault }),
    });
    if (response.ok) {
      setLabel("");
      router.refresh();
    }
  }

  return (
    <form className="space-y-3" onSubmit={createTemplate}>
      <input className="h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" placeholder="체크리스트 항목" value={label} onChange={(event) => setLabel(event.target.value)} required />
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input type="checkbox" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} />
        기본 항목
      </label>
      <button className="flex h-10 items-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white" type="submit">
        <Plus className="h-4 w-4" />
        템플릿 등록
      </button>
    </form>
  );
}
