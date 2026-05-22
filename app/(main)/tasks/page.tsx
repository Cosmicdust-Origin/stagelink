import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskCreateForm } from "@/components/tasks/TaskCreateForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
      <TaskBoard initialTasks={tasks ?? []} />
    </div>
  );
}
