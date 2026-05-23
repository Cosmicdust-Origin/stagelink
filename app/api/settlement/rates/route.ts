import { handleApiError, json, parseJson, requireRole } from "@/lib/api/auth";
import { getWorkspaceId } from "@/lib/workspace";

export async function GET() {
  try {
    const { supabase, user } = await requireRole(["admin", "manager"]);
    const wsId = await getWorkspaceId(supabase, user.id);
    if (!wsId) return json({ rates: [] });

    const { data, error } = await supabase
      .from("settlement_rates")
      .select("*, members!settlement_rates_member_id_fkey(name), privilege_types(name)")
      .eq("workspace_id", wsId)
      .order("valid_from", { ascending: false });

    if (error) throw error;
    return json({ rates: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireRole(["admin"]);
    const wsId = await getWorkspaceId(supabase, user.id);
    if (!wsId) return json({ error: "워크스페이스 없음" }, 400);

    const body = await parseJson<{
      member_id: string;
      privilege_type_id: string;
      unit_price: number;
    }>(request);

    if (!body.member_id || !body.privilege_type_id) {
      return json({ error: "멤버와 특전 유형을 선택하세요" }, 400);
    }
    if (body.unit_price == null || isNaN(Number(body.unit_price))) {
      return json({ error: "장당 정산액을 입력하세요" }, 400);
    }

    // 같은 (workspace, member, type) 조합이면 unit_price 업데이트 (upsert)
    const { data: existing } = await supabase
      .from("settlement_rates")
      .select("id")
      .eq("workspace_id", wsId)
      .eq("member_id", body.member_id)
      .eq("privilege_type_id", body.privilege_type_id)
      .maybeSingle();

    let data, error;

    if (existing) {
      ({ data, error } = await supabase
        .from("settlement_rates")
        .update({ unit_price: body.unit_price })
        .eq("id", existing.id)
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
          workspace_id: wsId,
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
