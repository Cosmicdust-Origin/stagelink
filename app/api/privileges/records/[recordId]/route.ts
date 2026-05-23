import { handleApiError, json, parseJson, requireRole } from "@/lib/api/auth";

type Params = { params: Promise<{ recordId: string }> };
type PatchBody = { quantity?: number; settled_at?: string | null };

/** PATCH /api/privileges/records/[recordId] — 수량 수정 또는 정산 완료 처리 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { recordId } = await params;
    const { supabase } = await requireRole(["admin", "manager"]);
    const body = await parseJson<PatchBody>(request);

    const patch: Record<string, unknown> = {};

    if (body.quantity !== undefined) {
      if (body.quantity < 0) return json({ error: "유효하지 않은 수량입니다." }, 400);
      patch.quantity = body.quantity;
    }

    if ("settled_at" in body) {
      patch.settled_at = body.settled_at ?? null;
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
    const { supabase } = await requireRole(["admin", "manager"]);

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
