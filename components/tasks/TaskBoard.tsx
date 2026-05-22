"use client";

import { useEffect, useState } from "react";
import { taskStatusLabels } from "@/lib/constants";
import { useToastStore } from "@/lib/toast";
import { TaskCard } from "./TaskCard";
import type { TaskStatus } from "@/lib/types";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string | null;
  groups: { name: string } | null;
  profiles: { name: string } | null;
};

const statuses: TaskStatus[] = ["todo", "in_progress", "done"];

export function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const toast = useToastStore((s) => s.show);

  // Sync when server re-renders (e.g. after task creation)
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  async function updateStatus(taskId: string, newStatus: TaskStatus) {
    // Optimistic move
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      setTasks(initialTasks);
      toast("저장 실패", "error");
    } else {
      toast("상태 변경됨");
    }
  }

  async function archiveTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    toast("업무 보관됨");
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {statuses.map((status) => (
        <section key={status} className="min-h-96 rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <h2 className="font-semibold text-white">{taskStatusLabels[status]}</h2>
          <div className="mt-4 space-y-3">
            {tasks
              .filter((t) => t.status === status)
              .map((task) => (
                <TaskCard
                  key={task.id}
                  taskId={task.id}
                  title={task.title}
                  description={task.description}
                  groupName={task.groups?.name ?? null}
                  assigneeName={task.profiles?.name ?? null}
                  dueDate={task.due_date}
                  currentStatus={task.status}
                  onStatusChange={(s) => updateStatus(task.id, s)}
                  onArchive={() => archiveTask(task.id)}
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
