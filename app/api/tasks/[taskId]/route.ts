import {
  handleApiError,
  json,
  parseJson,
  pickAllowed,
  requireRoleWithWorkspace,
} from "@/lib/api/auth";
import { optionalDateString, optionalUuid, requireUuid } from "@/lib/api/validation";

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
    requireUuid(taskId, "taskId");
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const payload = pickAllowed(body, taskUpdateFields);
    if (payload.group_id !== undefined) payload.group_id = optionalUuid(payload.group_id, "group_id") ?? null;
    if (payload.assignee_id !== undefined) payload.assignee_id = optionalUuid(payload.assignee_id, "assignee_id") ?? null;
    if (payload.due_date !== undefined) payload.due_date = optionalDateString(payload.due_date, "due_date") ?? null;
    if (payload.completed_at !== undefined) payload.completed_at = optionalDateString(payload.completed_at, "completed_at") ?? null;
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
    requireUuid(taskId, "taskId");
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
