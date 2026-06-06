import { ApiError, handleApiError, json, parseJson, requireRoleWithWorkspace } from "@/lib/api/auth";

export async function GET() {
  try {
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);

    const { data, error } = await supabase
      .from("checklist_templates")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at");

    if (error) throw error;
    return json({ templates: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const body = await parseJson<{ label: string; is_default?: boolean }>(request);
    const label = body.label?.trim();
    if (!label) throw new ApiError(400, "Missing checklist template label");

    const { data, error } = await supabase
      .from("checklist_templates")
      .insert({
        label,
        is_default: body.is_default ?? false,
        created_by: user.id,
        workspace_id: workspaceId,
      })
      .select("*")
      .single();

    if (error) throw error;
    return json({ template: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
