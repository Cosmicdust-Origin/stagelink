import { handleApiError, json, parseJson, requireRole } from "@/lib/api/auth";

type Params = { params: Promise<{ recordId: string }> };

/** PATCH /api/privileges/records/[recordId] — 수량 수정 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { recordId } = await params;
    const { supabase } = await requireRole(["admin", "manager"]);
    const { quantity } = await parseJson<{ quantity: number }>(request);

    if (quantity == null || quantity < 0) {
      return json({ error: "유효하지 않은 수량입니다." }, 400);
    }

    const { error } = await supabase
      .from("privilege_records")
      .update({ quantity })
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
