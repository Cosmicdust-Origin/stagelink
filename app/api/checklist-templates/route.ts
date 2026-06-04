import { handleApiError, json, parseJson, requireRole } from "@/lib/api/auth";
import { getWorkspaceId } from "@/lib/workspace";

export async function GET() {
  try {
    const { supabase, user } = await requireRole(["admin", "manager"]);
    const wsId = await getWorkspaceId(supabase, user.id);
    if (!wsId) return json({ templates: [] });

    const { data, error } = await supabase
      .from("checklist_templates")
      .select("*")
      .eq("workspace_id", wsId)
      .order("created_at");

    if (error) throw error;
    return json({ templates: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireRole(["admin", "manager"]);
    const wsId = await getWorkspaceId(supabase, user.id);
    if (!wsId) return json({ error: "워크스페이스 없음" }, 400);

    const body = await parseJson<{ label: string; is_default?: boolean }>(request);
    const { data, error } = await supabase
      .from("checklist_templates")
      .insert({
        label: body.label,
        is_default: body.is_default ?? false,
        created_by: user.id,
        workspace_id: wsId,
      })
      .select("*")
      .single();

    if (error) throw error;
    return json({ template: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
