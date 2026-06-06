import { ApiError, handleApiError, json, parseJson, requireRoleWithWorkspace } from "@/lib/api/auth";
import { optionalDateString, requireNonNegativeInteger, requireUuid } from "@/lib/api/validation";

type Params = { params: Promise<{ recordId: string }> };
type PatchBody = { quantity?: number; settled_at?: string | null };

/** PATCH /api/privileges/records/[recordId] — 수량 수정 또는 정산 완료 처리 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { recordId } = await params;
    requireUuid(recordId, "recordId");
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const body = await parseJson<PatchBody>(request);
    const { data: record } = await supabase
      .from("privilege_records")
      .select("id, events!inner(workspace_id)")
      .eq("id", recordId)
      .eq("events.workspace_id", workspaceId)
      .single();
    if (!record) throw new ApiError(404, "Privilege record not found");

    const patch: Record<string, unknown> = {};

    if (body.quantity !== undefined) {
      patch.quantity = requireNonNegativeInteger(body.quantity, "quantity");
    }

    if ("settled_at" in body) {
      patch.settled_at = optionalDateString(body.settled_at, "settled_at") ?? null;
    }

    if (Object.keys(patch).length === 0) {
      return json({ error: "수정할 항목이 없습니다." }, 400);
    }

    const { error } = await supabase
      .from("privilege_records")
      .update(patch)
      .eq("id", recordId);

    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

/** DELETE /api/privileges/records/[recordId] — 기록 삭제 */
export async function DELETE(_: Request, { params }: Params) {
  try {
    const { recordId } = await params;
    requireUuid(recordId, "recordId");
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const { data: record } = await supabase
      .from("privilege_records")
      .select("id, events!inner(workspace_id)")
      .eq("id", recordId)
      .eq("events.workspace_id", workspaceId)
      .single();
    if (!record) throw new ApiError(404, "Privilege record not found");

    const { error } = await supabase
      .from("privilege_records")
      .delete()
      .eq("id", recordId);

    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
