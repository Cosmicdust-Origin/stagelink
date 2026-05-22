import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskCreateForm } from "@/components/tasks/TaskCreateForm";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";

export default async function TasksPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const wsId = user ? await getWorkspaceId(supabase, user.id) : null;

  // Workspace-scoped member IDs for dropdowns
  const memberIds: string[] = [];
  if (wsId) {
    const [{ data: workspace }, { data: wsMembers }] = await Promise.all([
      supabase.from("workspaces").select("owner_id").eq("id", wsId).single(),
      supabase.from("workspace_members").select("user_id").eq("workspace_id", wsId),
    ]);
    if (workspace?.owner_id) memberIds.push(workspace.owner_id);
    (wsMembers ?? []).forEach((m: { user_id: string }) => memberIds.push(m.user_id));
  }

  const [{ data: tasks }, { data: groups }, { data: profiles }] = await Promise.all([
    wsId
      ? supabase
          .from("tasks")
          .select("*, groups(name), profiles!tasks_assignee_id_fkey(name)")
          .eq("workspace_id", wsId)
          .eq("is_archived", false)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    wsId
      ? supabase.from("groups").select("id,name").eq("workspace_id", wsId).order("name")
      : Promise.resolve({ data: [] }),
    memberIds.length
      ? supabase.from("profiles").select("id,name").in("id", memberIds).order("name")
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-white">업무 보드</h1>
        <p className="mt-1 text-sm text-zinc-400">업무를 등록하고 상태를 수정합니다.</p>
      </div>
      <CollapsibleSection label="업무 등록">
        <TaskCreateForm groups={groups ?? []} assignees={profiles ?? []} />
      </CollapsibleSection>
      <TaskBoard initialTasks={tasks ?? []} />
    </div>
  );
}
