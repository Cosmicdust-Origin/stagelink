import {
  ApiError,
  handleApiError,
  json,
  parseJson,
  pickAllowed,
  requireRoleWithWorkspace,
  requireWorkspace,
} from "@/lib/api/auth";
import { optionalDateString } from "@/lib/api/validation";

const groupCreateFields = ["name", "debut_date", "description", "cover_image_url"] as const;

export async function GET() {
  try {
    const { supabase, workspaceId } = await requireWorkspace();

    const { data, error } = await supabase
      .from("groups")
      .select("*, group_members(count)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return json({ groups: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "owner", "manager"]);

    const body = await parseJson<Record<string, unknown>>(request);
    const payload = pickAllowed(body, groupCreateFields);
    if (typeof payload.name !== "string" || !payload.name.trim()) throw new ApiError(400, "Missing group name");
    payload.name = payload.name.trim();
    if (payload.debut_date !== undefined) payload.debut_date = optionalDateString(payload.debut_date, "debut_date") ?? null;

    const { data, error } = await supabase
      .from("groups")
      .insert({ ...payload, workspace_id: workspaceId })
      .select("*")
      .single();

    if (error) throw error;
    return json({ group: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
