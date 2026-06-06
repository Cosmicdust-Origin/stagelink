import {
  ApiError,
  handleApiError,
  json,
  parseJson,
  pickAllowed,
  requireRoleWithWorkspace,
  requireWorkspace,
} from "@/lib/api/auth";
import { requireNonNegativeNumber } from "@/lib/api/validation";
import { canAccessSettlement } from "@/lib/rbac";

const privilegeTypeCreateFields = [
  "name",
  "category",
  "unit_price",
  "settlement_type",
  "is_active",
] as const;

export async function GET() {
  try {
    const { supabase, profile, workspaceId } = await requireWorkspace();

    // Admin sees unit_price; others do not
    const select = canAccessSettlement(profile.role) ? "*" : "id,name,category,is_active,created_at";

    const { data, error } = await supabase
      .from("privilege_types")
      .select(select)
      .eq("workspace_id", workspaceId)
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
    const { supabase, user, workspaceId } = await requireRoleWithWorkspace(["admin", "owner"]);

    const body = await parseJson<Record<string, unknown>>(request);
    const payload = pickAllowed(body, privilegeTypeCreateFields);
    if (!payload.name) throw new ApiError(400, "Missing privilege type name");
    if ("unit_price" in payload && payload.unit_price != null) {
      payload.unit_price = requireNonNegativeNumber(payload.unit_price, "unit_price");
    }

    const { data, error } = await supabase
      .from("privilege_types")
      .insert({ ...payload, created_by: user.id, workspace_id: workspaceId })
      .select("*")
      .single();

    if (error) throw error;
    return json({ type: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
