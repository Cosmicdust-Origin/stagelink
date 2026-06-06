import {
  handleApiError,
  json,
  parseJson,
  pickAllowed,
  requireRoleWithWorkspace,
} from "@/lib/api/auth";

type Params = { params: Promise<{ rateId: string }> };
const settlementRateUpdateFields = ["unit_price", "valid_from", "valid_until"] as const;

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { rateId } = await params;
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "owner"]);
    const { error } = await supabase
      .from("settlement_rates")
      .delete()
      .eq("id", rateId)
      .eq("workspace_id", workspaceId);
    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { rateId } = await params;
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "owner"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const payload = pickAllowed(body, settlementRateUpdateFields);
    const { data, error } = await supabase
      .from("settlement_rates")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", rateId)
      .eq("workspace_id", workspaceId)
      .select("*")
      .single();

    if (error) throw error;
    return json({ rate: data });
  } catch (error) {
    return handleApiError(error);
  }
}
