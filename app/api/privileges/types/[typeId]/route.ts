import {
  handleApiError,
  json,
  parseJson,
  pickAllowed,
  requireRoleWithWorkspace,
} from "@/lib/api/auth";

type Params = { params: Promise<{ typeId: string }> };
const privilegeTypeUpdateFields = [
  "name",
  "category",
  "unit_price",
  "settlement_type",
  "is_active",
] as const;

export async function PUT(request: Request, { params }: Params) {
  try {
    const { typeId } = await params;
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "owner"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const payload = pickAllowed(body, privilegeTypeUpdateFields);
    const { data, error } = await supabase
      .from("privilege_types")
      .update(payload)
      .eq("id", typeId)
      .eq("workspace_id", workspaceId)
      .select("*")
      .single();

    if (error) throw error;
    return json({ type: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { typeId } = await params;
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "owner"]);
    const { error } = await supabase
      .from("privilege_types")
      .delete()
      .eq("id", typeId)
      .eq("workspace_id", workspaceId);
    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
