import {
  ApiError,
  handleApiError,
  json,
  parseJson,
  pickAllowed,
  requireRoleWithWorkspace,
  requireWorkspace,
} from "@/lib/api/auth";

type GroupBody = {
  name: string;
  debut_date?: string;
  description?: string;
  cover_image_url?: string;
};
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
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);

    const body = await parseJson<GroupBody>(request);
    const payload = pickAllowed(body, groupCreateFields);
    if (!payload.name) throw new ApiError(400, "Missing group name");

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
