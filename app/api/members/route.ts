import {
  ApiError,
  handleApiError,
  json,
  parseJson,
  requireRoleWithWorkspace,
  requireWorkspace,
} from "@/lib/api/auth";

export async function GET() {
  try {
    const { supabase, workspaceId } = await requireWorkspace();

    const { data, error } = await supabase
      .from("members")
      .select("id,name,created_at")
      .eq("workspace_id", workspaceId)
      .order("name");

    if (error) throw error;
    return json({ members: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin"]);
    const { name } = await parseJson<{ name: string }>(request);
    const trimmedName = name?.trim();
    if (!trimmedName) throw new ApiError(400, "Missing member name");

    const { data, error } = await supabase
      .from("members")
      .insert({ name: trimmedName, workspace_id: workspaceId })
      .select("*")
      .single();

    if (error) throw error;
    return json({ member: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
