"use client";

import { Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToastStore } from "@/lib/toast";

export function NoticeActions({
  noticeId,
  initialTitle,
  initialContent,
}: {
  noticeId: string;
  initialTitle: string;
  initialContent: string;
}) {
  const router = useRouter();
  const toast = useToastStore((s) => s.show);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/notices/${noticeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    if (response.ok) {
      toast("저장 완료!");
      router.refresh();
    } else {
      toast("저장 실패", "error");
    }
  }

  async function remove() {
    if (!window.confirm("이 공지를 삭제할까요?")) return;
    const response = await fetch(`/api/notices/${noticeId}`, { method: "DELETE" });
    if (response.ok) router.push("/notice");
    else toast("삭제 실패", "error");
  }

  return (
    <form className="mt-6 space-y-3 rounded-lg border border-white/10 bg-[#101114] p-4" onSubmit={save}>
      <input className="h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-white" value={title} onChange={(event) => setTitle(event.target.value)} />
      <textarea className="min-h-32 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-white" value={content} onChange={(event) => setContent(event.target.value)} />
      <div className="flex gap-2">
        <button className="flex h-10 items-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white" type="submit">
          <Save className="h-4 w-4" />
          저장
        </button>
        <button className="flex h-10 items-center gap-2 rounded-md border border-red-500/40 px-4 text-sm font-semibold text-red-300" type="button" onClick={remove}>
          <Trash2 className="h-4 w-4" />
          삭제
        </button>
      </div>
    </form>
  );
}
