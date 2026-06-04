import { handleApiError, json, parseJson, requireRole, requireUser } from "@/lib/api/auth";
import { canAccessSettlement } from "@/lib/rbac";
import { getWorkspaceId } from "@/lib/workspace";

export async function GET() {
  try {
    const { supabase, user, profile } = await requireUser();
    const wsId = await getWorkspaceId(supabase, user.id);
    if (!wsId) return json({ types: [] });

    // Admin sees unit_price; others do not
    const select = canAccessSettlement(profile.role) ? "*" : "id,name,category,is_active,created_at";

    const { data, error } = await supabase
      .from("privilege_types")
      .select(select)
      .eq("workspace_id", wsId)
      .eq("is_active", true)
      .order("created_at");

    if (error) throw error;
    return json({ types: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireRole(["admin", "owner"]);
    const wsId = await getWorkspaceId(supabase, user.id);
    if (!wsId) return json({ error: "워크스페이스 없음" }, 400);

    const body = await parseJson<Record<string, unknown>>(request);
    const { data, error } = await supabase
      .from("privilege_types")
      .insert({ ...body, created_by: user.id, workspace_id: wsId })
      .select("*")
      .single();

    if (error) throw error;
    return json({ type: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
