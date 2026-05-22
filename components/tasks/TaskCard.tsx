"use client";

import { ChevronDown, ChevronUp, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToastStore } from "@/lib/toast";
import type { TaskStatus } from "@/lib/types";

type Props = {
  taskId: string;
  title: string;
  description: string | null;
  groupName: string | null;
  assigneeName: string | null;
  dueDate: string | null;
  currentStatus: TaskStatus;
};

export function TaskCard({ taskId, title, description, groupName, assigneeName, dueDate, currentStatus }: Props) {
  const router = useRouter();
  const toast = useToastStore((s) => s.show);
  const [status, setStatus] = useState<TaskStatus>(currentStatus);
  const [expanded, setExpanded] = useState(!!description);
  const [desc, setDesc] = useState(description ?? "");

  async function saveStatus() {
    await fetch(`/api/tasks/${taskId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast("상태 저장됨");
    router.refresh();
  }

  async function saveDescription() {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: desc || null }),
    });
    toast("설명 저장됨");
  }

  async function archiveTask() {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    toast("업무 보관됨");
    router.refresh();
  }

  return (
    <article className="rounded-md border border-white/10 bg-[#101114] p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-white">{title}</p>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-0.5 shrink-0 text-zinc-600 hover:text-zinc-300"
          aria-label={expanded ? "설명 접기" : "설명 펼치기"}
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      <p className="mt-1 text-xs text-zinc-400">{groupName ?? "전체"} · {assigneeName ?? "미배정"}</p>
      {dueDate && <p className="mt-1 text-xs text-[#E8457A]">마감 {dueDate}</p>}

      {expanded && (
        <textarea
          className="mt-2 w-full resize-none rounded-md border border-white/10 bg-[#0d0f11] px-2 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:border-white/30 focus:outline-none"
          rows={3}
          placeholder="상세 내용을 입력하세요..."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={saveDescription}
        />
      )}

      <div className="mt-3 flex gap-2">
        <select
          className="h-9 flex-1 rounded-md border border-white/10 bg-[#101114] px-2 text-xs text-white"
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus)}
        >
          <option value="todo">대기</option>
          <option value="in_progress">진행 중</option>
          <option value="done">완료</option>
        </select>
        <button
          className="rounded-md border border-white/10 p-2 text-zinc-300"
          type="button"
          aria-label="상태 저장"
          onClick={saveStatus}
        >
          <Save className="h-4 w-4" />
        </button>
        <button
          className="rounded-md border border-red-500/40 p-2 text-red-300"
          type="button"
          aria-label="업무 보관"
          onClick={archiveTask}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
