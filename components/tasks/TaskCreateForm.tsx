"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToastStore } from "@/lib/toast";
import type { TaskStatus } from "@/lib/types";

type Option = { id: string; name: string };

export function TaskCreateForm({ groups, assignees }: { groups: Option[]; assignees: Option[] }) {
  const router = useRouter();
  const toast = useToastStore((s) => s.show);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || null,
        group_id: groupId || null,
        assignee_id: assigneeId || null,
        due_date: dueDate || null,
      }),
    });
    if (response.ok) {
      setTitle("");
      setDescription("");
      toast("업무 등록됨");
      router.refresh();
    }
  }

  return (
    <form className="rounded-lg border border-white/10 bg-white/[0.04] p-4" onSubmit={createTask}>
      <div className="grid gap-3 md:grid-cols-[1fr_160px_180px_160px_auto]">
        <input className="h-10 rounded-md border border-white/10 bg-[#101114] px-3 text-white" placeholder="업무 제목" value={title} onChange={(event) => setTitle(event.target.value)} required />
        <select className="h-10 rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={groupId} onChange={(event) => setGroupId(event.target.value)}>
          <option value="">전체 그룹</option>
          {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
        </select>
        <select className="h-10 rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
          <option value="">담당자</option>
          {assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name}</option>)}
        </select>
        <input className="h-10 rounded-md border border-white/10 bg-[#101114] px-3 text-white" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        <button className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white" type="submit">
          <Plus className="h-4 w-4" />
          업무 등록
        </button>
      </div>
      <textarea
        className="mt-3 w-full resize-none rounded-md border border-white/10 bg-[#101114] px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-white/30 focus:outline-none"
        rows={2}
        placeholder="상세 내용 (선택)"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
    </form>
  );
}

export function TaskActions({ taskId, currentStatus }: { taskId: string; currentStatus: TaskStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState<TaskStatus>(currentStatus);

  async function saveStatus() {
    const response = await fetch(`/api/tasks/${taskId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok) router.refresh();
  }

  async function archiveTask() {
    const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (response.ok) router.refresh();
  }

  return (
    <div className="mt-3 flex gap-2">
      <select className="h-9 flex-1 rounded-md border border-white/10 bg-[#101114] px-2 text-xs text-white" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
        <option value="todo">대기</option>
        <option value="in_progress">진행 중</option>
        <option value="done">완료</option>
      </select>
      <button className="rounded-md border border-white/10 p-2 text-zinc-300" type="button" aria-label="상태 저장" onClick={saveStatus}>
        <Save className="h-4 w-4" />
      </button>
      <button className="rounded-md border border-red-500/40 p-2 text-red-300" type="button" aria-label="업무 보관" onClick={archiveTask}>
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
