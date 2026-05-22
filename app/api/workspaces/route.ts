import { handleApiError, json, parseJson, requireRole, requireUser } from "@/lib/api/auth";
import { getWorkspaceId, getUserWorkspaces } from "@/lib/workspace";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const workspaces = await getUserWorkspaces(supabase, user.id);
    const currentId = await getWorkspaceId(supabase, user.id);
    return json({ workspaces, currentId });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireRole(["admin"]);

    // Admin must not already have a workspace
    const { data: existing } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (existing) return json({ error: "이미 워크스페이스가 있습니다." }, 409);

    const { name } = await parseJson<{ name: string }>(request);
    if (!name?.trim()) throw new Error("워크스페이스 이름을 입력하세요.");

    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .insert({ name: name.trim(), owner_id: user.id })
      .select("id")
      .single();
    if (wsError) throw wsError;

    // Migrate all orphaned data (workspace_id IS NULL) into this new workspace.
    // This handles the one-time migration of existing data.
    await Promise.all([
      supabase.from("groups").update({ workspace_id: workspace.id }).is("workspace_id", null),
      supabase.from("events").update({ workspace_id: workspace.id }).is("workspace_id", null),
      supabase.from("privilege_types").update({ workspace_id: workspace.id }).is("workspace_id", null),
      supabase.from("settlement_rates").update({ workspace_id: workspace.id }).is("workspace_id", null),
      supabase.from("tasks").update({ workspace_id: workspace.id }).is("workspace_id", null),
      supabase.from("notices").update({ workspace_id: workspace.id }).is("workspace_id", null),
      supabase.from("checklist_templates").update({ workspace_id: workspace.id }).is("workspace_id", null),
    ]);

    return json({ workspace }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
