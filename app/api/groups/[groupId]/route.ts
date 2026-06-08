import {
  handleApiError,
  json,
  parseJson,
  pickAllowed,
  requireRoleWithWorkspace,
  requireWorkspace,
} from "@/lib/api/auth";
import { optionalDateString, requireNonNegativeNumber, requireUuid } from "@/lib/api/validation";

type Params = { params: Promise<{ groupId: string }> };
const groupUpdateFields = [
  "name",
  "debut_date",
  "description",
  "cover_image_url",
  "privilege_unit_price",
] as const;

export async function GET(_: Request, { params }: Params) {
  try {
    const { groupId } = await params;
    requireUuid(groupId, "groupId");
    const { supabase, workspaceId } = await requireWorkspace();
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .eq("workspace_id", workspaceId)
      .single();

    if (error) throw error;
    return json({ group: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { groupId } = await params;
    requireUuid(groupId, "groupId");
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "owner", "manager"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const payload = pickAllowed(body, groupUpdateFields);
    if (payload.debut_date !== undefined) payload.debut_date = optionalDateString(payload.debut_date, "debut_date") ?? null;
    if (payload.privilege_unit_price !== undefined) {
      payload.privilege_unit_price = requireNonNegativeNumber(payload.privilege_unit_price, "privilege_unit_price");
    }
    const { data, error } = await supabase
      .from("groups")
      .update(payload)
      .eq("id", groupId)
      .eq("workspace_id", workspaceId)
      .select("*")
      .single();

    if (error) throw error;
    return json({ group: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { groupId } = await params;
    requireUuid(groupId, "groupId");
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "owner", "manager"]);
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId)
      .eq("workspace_id", workspaceId);

    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
