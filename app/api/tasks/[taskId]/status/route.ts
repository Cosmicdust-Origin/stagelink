import { ApiError, handleApiError, json, parseJson, requireRoleWithWorkspace } from "@/lib/api/auth";
import { requireUuid } from "@/lib/api/validation";

type Params = { params: Promise<{ taskId: string }> };
const taskStatuses = new Set(["todo", "in_progress", "done"]);

export async function PUT(request: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    requireUuid(taskId, "taskId");
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const body = await parseJson<{ status: "todo" | "in_progress" | "done" }>(request);
    if (!taskStatuses.has(body.status)) throw new ApiError(400, "Invalid status");
    const { data, error } = await supabase
      .from("tasks")
      .update({
        status: body.status,
        completed_at: body.status === "done" ? new Date().toISOString() : null,
      })
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
