import { ApiError, handleApiError, json, parseJson, requireRoleWithWorkspace } from "@/lib/api/auth";
import { requireUuid } from "@/lib/api/validation";

type Params = { params: Promise<{ itemId: string }> };

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { itemId } = await params;
    requireUuid(itemId, "itemId");
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const { data: item } = await supabase
      .from("event_checklists")
      .select("id, events!inner(workspace_id)")
      .eq("id", itemId)
      .eq("events.workspace_id", workspaceId)
      .single();
    if (!item) throw new ApiError(404, "Checklist item not found");

    const { error } = await supabase.from("event_checklists").delete().eq("id", itemId);
    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { itemId } = await params;
    requireUuid(itemId, "itemId");
    const { supabase, user, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const body = await parseJson<{ is_checked: boolean }>(request);
    if (typeof body.is_checked !== "boolean") throw new ApiError(400, "Invalid is_checked");
    const { data: item } = await supabase
      .from("event_checklists")
      .select("id, events!inner(workspace_id)")
      .eq("id", itemId)
      .eq("events.workspace_id", workspaceId)
      .single();
    if (!item) throw new ApiError(404, "Checklist item not found");

    const { data, error } = await supabase
      .from("event_checklists")
      .update({
        is_checked: body.is_checked,
        checked_by: body.is_checked ? user.id : null,
        checked_at: body.is_checked ? new Date().toISOString() : null,
      })
      .eq("id", itemId)
      .select("*")
      .single();

    if (error) throw error;
    return json({ item: data });
  } catch (error) {
    return handleApiError(error);
  }
}
