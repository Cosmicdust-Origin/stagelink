"use client";

import { Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function EventActions({
  eventId,
  initialTitle,
  initialVenue,
  initialMemo,
}: {
  eventId: string;
  initialTitle: string;
  initialVenue: string;
  initialMemo: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [venue, setVenue] = useState(initialVenue);
  const [memo, setMemo] = useState(initialMemo);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/events/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, venue: venue || null, memo: memo || null }),
    });
    if (response.ok) router.refresh();
  }

  async function remove() {
    if (!window.confirm("이 일정을 삭제할까요?")) return;
    const response = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    if (response.ok) router.push("/calendar");
  }

  return (
    <form className="mt-4 rounded-lg border border-white/10 bg-[#101114] p-4" onSubmit={save}>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.5fr_auto_auto]">
        <input className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-white" value={title} onChange={(event) => setTitle(event.target.value)} />
        <input className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-white" value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="장소" />
        <input className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-white" value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="메모" />
        <button className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white" type="submit">
          <Save className="h-4 w-4" />
          저장
        </button>
        <button className="flex h-10 items-center justify-center gap-2 rounded-md border border-red-500/40 px-4 text-sm font-semibold text-red-300" type="button" onClick={remove}>
          <Trash2 className="h-4 w-4" />
          삭제
        </button>
      </div>
    </form>
  );
}
