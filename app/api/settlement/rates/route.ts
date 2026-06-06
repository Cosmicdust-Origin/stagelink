import {
  ApiError,
  handleApiError,
  json,
  parseJson,
  requireRoleWithWorkspace,
} from "@/lib/api/auth";
import { requireNonNegativeNumber, requireUuid } from "@/lib/api/validation";

export async function GET() {
  try {
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "owner"]);

    const { data, error } = await supabase
      .from("settlement_rates")
      .select("*, members!settlement_rates_member_id_fkey(name), privilege_types(name)")
      .eq("workspace_id", workspaceId)
      .order("valid_from", { ascending: false });

    if (error) throw error;
    return json({ rates: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user, workspaceId } = await requireRoleWithWorkspace(["admin", "owner"]);

    const body = await parseJson<{
      member_id: string;
      privilege_type_id: string;
      unit_price: number;
    }>(request);

    if (!body.member_id || !body.privilege_type_id) {
      return json({ error: "멤버와 특전 유형을 선택하세요" }, 400);
    }
    body.member_id = requireUuid(body.member_id, "member_id");
    body.privilege_type_id = requireUuid(body.privilege_type_id, "privilege_type_id");
    body.unit_price = requireNonNegativeNumber(body.unit_price, "unit_price");

    const [{ data: member }, { data: privilegeType }] = await Promise.all([
      supabase
        .from("members")
        .select("id")
        .eq("id", body.member_id)
        .eq("workspace_id", workspaceId)
        .single(),
      supabase
        .from("privilege_types")
        .select("id")
        .eq("id", body.privilege_type_id)
        .eq("workspace_id", workspaceId)
        .single(),
    ]);
    if (!member || !privilegeType) throw new ApiError(400, "Invalid settlement target");

    // 같은 (workspace, member, type) 조합이면 unit_price 업데이트 (upsert)
    const { data: existing } = await supabase
      .from("settlement_rates")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("member_id", body.member_id)
      .eq("privilege_type_id", body.privilege_type_id)
      .maybeSingle();

    let data, error;

    if (existing) {
      ({ data, error } = await supabase
        .from("settlement_rates")
        .update({ unit_price: body.unit_price })
        .eq("id", existing.id)
        .eq("workspace_id", workspaceId)
        .select("*")
        .single());
    } else {
      ({ data, error } = await supabase
        .from("settlement_rates")
        .insert({
          member_id: body.member_id,
          privilege_type_id: body.privilege_type_id,
          unit_price: body.unit_price,
          rate: 0,
          valid_from: new Date().toISOString().slice(0, 10),
          workspace_id: workspaceId,
          created_by: user.id,
        })
        .select("*")
        .single());
    }

    if (error) throw error;
    return json({ rate: data }, existing ? 200 : 201);
  } catch (error) {
    return handleApiError(error);
  }
}
