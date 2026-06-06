import {
  handleApiError,
  json,
  parseJson,
  pickAllowed,
  requireRoleWithWorkspace,
} from "@/lib/api/auth";

type Params = { params: Promise<{ taskId: string }> };
const taskUpdateFields = [
  "title",
  "description",
  "status",
  "group_id",
  "assignee_id",
  "due_date",
  "completed_at",
  "is_archived",
] as const;

export async function PUT(request: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const payload = pickAllowed(body, taskUpdateFields);
    const { data, error } = await supabase
      .from("tasks")
      .update(payload)
      .eq("id", taskId)
      .eq("workspace_id", workspaceId)
      .select("*")
      .single();

    if (error) throw error;
    return json({ task: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const { data, error } = await supabase
      .from("tasks")
      .update({ is_archived: true })
      .eq("id", taskId)
      .eq("workspace_id", workspaceId)
      .select("*")
      .single();

    if (error) throw error;
    return json({ task: data });
  } catch (error) {
    return handleApiError(error);
  }
}
