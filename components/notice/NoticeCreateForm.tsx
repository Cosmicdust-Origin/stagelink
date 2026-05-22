"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToastStore } from "@/lib/toast";

type Group = { id: string; name: string };

export function NoticeCreateForm({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const toast = useToastStore((s) => s.show);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetGroupId, setTargetGroupId] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  async function createNotice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, target_group_id: targetGroupId || null, is_pinned: isPinned }),
    });
    if (response.ok) {
      setTitle("");
      setContent("");
      toast("공지 등록 완료!");
      router.refresh();
    } else {
      toast("등록 실패", "error");
    }
  }

  return (
    <form className="rounded-lg border border-white/10 bg-white/[0.04] p-4" onSubmit={createNotice}>
      <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
        <input className="h-10 rounded-md border border-white/10 bg-[#101114] px-3 text-white" placeholder="공지 제목" value={title} onChange={(event) => setTitle(event.target.value)} required />
        <select className="h-10 rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={targetGroupId} onChange={(event) => setTargetGroupId(event.target.value)}>
          <option value="">전체 공지</option>
          {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
        </select>
        <label className="flex h-10 items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={isPinned} onChange={(event) => setIsPinned(event.target.checked)} />
          고정
        </label>
      </div>
      <textarea className="mt-3 min-h-28 w-full rounded-md border border-white/10 bg-[#101114] px-3 py-2 text-white" placeholder="공지 내용" value={content} onChange={(event) => setContent(event.target.value)} required />
      <button className="mt-3 flex h-10 items-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white" type="submit">
        <Plus className="h-4 w-4" />
        공지 등록
      </button>
    </form>
  );
}
