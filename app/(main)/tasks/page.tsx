import { taskStatusLabels } from "@/lib/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TaskStatus } from "@/lib/types";

const statuses: TaskStatus[] = ["todo", "in_progress", "done"];

export default async function TasksPage() {
  const supabase = await createServerSupabaseClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, groups(name), profiles!tasks_assignee_id_fkey(name)")
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-white">업무 보드</h1>
      <div className="grid gap-4 lg:grid-cols-3">
        {statuses.map((status) => (
          <section key={status} className="min-h-96 rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h2 className="font-semibold text-white">{taskStatusLabels[status]}</h2>
            <div className="mt-4 space-y-3">
              {(tasks ?? []).filter((task) => task.status === status).map((task) => (
                <article key={task.id} className="rounded-md border border-white/10 bg-[#101114] p-3">
                  <p className="font-medium text-white">{task.title}</p>
                  <p className="mt-2 text-xs text-zinc-400">{task.groups?.name ?? "전체"} · {task.profiles?.name ?? "미배정"}</p>
                  {task.due_date ? <p className="mt-2 text-xs text-[#E8457A]">마감 {task.due_date}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
