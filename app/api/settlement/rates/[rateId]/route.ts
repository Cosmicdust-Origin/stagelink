import {
  handleApiError,
  json,
  parseJson,
  pickAllowed,
  requireRoleWithWorkspace,
} from "@/lib/api/auth";
import { optionalDateString, requireNonNegativeNumber, requireUuid } from "@/lib/api/validation";

type Params = { params: Promise<{ rateId: string }> };
const settlementRateUpdateFields = ["unit_price", "valid_from", "valid_until"] as const;

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { rateId } = await params;
    requireUuid(rateId, "rateId");
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
    requireUuid(rateId, "rateId");
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "owner"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const payload = pickAllowed(body, settlementRateUpdateFields);
    if (payload.unit_price !== undefined) payload.unit_price = requireNonNegativeNumber(payload.unit_price, "unit_price");
    if (payload.valid_from !== undefined) payload.valid_from = optionalDateString(payload.valid_from, "valid_from");
    if (payload.valid_until !== undefined) payload.valid_until = optionalDateString(payload.valid_until, "valid_until") ?? null;
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
