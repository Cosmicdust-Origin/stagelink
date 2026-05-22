import { handleApiError, json, parseJson, requireRole } from "@/lib/api/auth";

type Params = { params: Promise<{ groupId: string; memberId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const { groupId, memberId } = await params;
    const { supabase } = await requireRole(["admin"]);
    const body = await parseJson<{
      position?: string | null;
      contract_start_date?: string | null;
      contract_duration_months?: number | null;
    }>(request);
    const patch: Record<string, unknown> = {};
    if ("position" in body) patch.position = body.position ?? null;
    if ("contract_start_date" in body) patch.contract_start_date = body.contract_start_date ?? null;
    if ("contract_duration_months" in body) patch.contract_duration_months = body.contract_duration_months ?? null;
    const { data, error } = await supabase
      .from("group_members")
      .update(patch)
      .eq("group_id", groupId)
      .eq("user_id", memberId)
      .select("*")
      .single();

    if (error) throw error;
    return json({ member: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { groupId, memberId } = await params;
    const { supabase } = await requireRole(["admin"]);
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", memberId);

    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
