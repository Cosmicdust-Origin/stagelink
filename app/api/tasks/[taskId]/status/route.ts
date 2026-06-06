import { handleApiError, json, parseJson, requireRoleWithWorkspace } from "@/lib/api/auth";

type Params = { params: Promise<{ taskId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const body = await parseJson<{ status: "todo" | "in_progress" | "done" }>(request);
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
