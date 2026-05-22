import { handleApiError, json, parseJson, requireRole } from "@/lib/api/auth";
import { getWorkspaceId } from "@/lib/workspace";

export async function GET() {
  try {
    const { supabase, user } = await requireRole(["admin"]);
    const wsId = await getWorkspaceId(supabase, user.id);
    if (!wsId) return json({ rates: [] });

    const { data, error } = await supabase
      .from("settlement_rates")
      .select("*, profiles(name), privilege_types(name)")
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

    const body = await parseJson<Record<string, unknown>>(request);
    const { data, error } = await supabase
      .from("settlement_rates")
      .insert({ ...body, created_by: user.id, workspace_id: wsId })
      .select("*")
      .single();

    if (error) throw error;
    return json({ rate: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
