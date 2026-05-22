"use client";

import { useOptimistic, useTransition } from "react";
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

type OptimisticAction =
  | { type: "status"; taskId: string; status: TaskStatus }
  | { type: "archive"; taskId: string };

const statuses: TaskStatus[] = ["todo", "in_progress", "done"];

export function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {
  const toast = useToastStore((s) => s.show);
  const [, startTransition] = useTransition();
  const [tasks, applyOptimistic] = useOptimistic(initialTasks, (currentTasks, action: OptimisticAction) => {
    if (action.type === "archive") return currentTasks.filter((task) => task.id !== action.taskId);
    return currentTasks.map((task) => (task.id === action.taskId ? { ...task, status: action.status } : task));
  });

  async function updateStatus(taskId: string, newStatus: TaskStatus) {
    startTransition(() => applyOptimistic({ type: "status", taskId, status: newStatus }));
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    toast(res.ok ? "상태를 변경했습니다." : "상태 변경에 실패했습니다.", res.ok ? "success" : "error");
  }

  async function archiveTask(taskId: string) {
    startTransition(() => applyOptimistic({ type: "archive", taskId }));
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    toast(res.ok ? "업무를 보관했습니다." : "업무 보관에 실패했습니다.", res.ok ? "success" : "error");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {statuses.map((status) => (
        <section key={status} className="min-h-96 rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <h2 className="font-semibold text-white">{taskStatusLabels[status]}</h2>
          <div className="mt-4 space-y-3">
            {tasks
              .filter((task) => task.status === status)
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
                  onStatusChange={(nextStatus) => updateStatus(task.id, nextStatus)}
                  onArchive={() => archiveTask(task.id)}
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
