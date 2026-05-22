import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskCreateForm } from "@/components/tasks/TaskCreateForm";
import { taskStatusLabels } from "@/lib/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TaskStatus } from "@/lib/types";

const statuses: TaskStatus[] = ["todo", "in_progress", "done"];

export default async function TasksPage() {
  const supabase = await createServerSupabaseClient();
  const [{ data: tasks }, { data: groups }, { data: profiles }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, groups(name), profiles!tasks_assignee_id_fkey(name)")
      .eq("is_archived", false)
      .order("created_at", { ascending: false }),
    supabase.from("groups").select("id,name").order("name"),
    supabase.from("profiles").select("id,name").order("name"),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-white">업무 보드</h1>
        <p className="mt-1 text-sm text-zinc-400">업무를 등록하고 상태를 수정합니다.</p>
      </div>
      <TaskCreateForm groups={groups ?? []} assignees={profiles ?? []} />
      <div className="grid gap-4 lg:grid-cols-3">
        {statuses.map((status) => (
          <section key={status} className="min-h-96 rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h2 className="font-semibold text-white">{taskStatusLabels[status]}</h2>
            <div className="mt-4 space-y-3">
              {(tasks ?? []).filter((task) => task.status === status).map((task) => (
                <TaskCard
                  key={task.id}
                  taskId={task.id}
                  title={task.title}
                  description={task.description ?? null}
                  groupName={task.groups?.name ?? null}
                  assigneeName={task.profiles?.name ?? null}
                  dueDate={task.due_date ?? null}
                  currentStatus={task.status}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
