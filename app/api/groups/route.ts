import { handleApiError, json, parseJson, requireRole, requireUser } from "@/lib/api/auth";
import { getWorkspaceId } from "@/lib/workspace";

type GroupBody = {
  name: string;
  debut_date?: string;
  description?: string;
  cover_image_url?: string;
};

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const wsId = await getWorkspaceId(supabase, user.id);
    if (!wsId) return json({ groups: [] });

    const { data, error } = await supabase
      .from("groups")
      .select("*, group_members(count)")
      .eq("workspace_id", wsId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return json({ groups: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireRole(["admin"]);
    const wsId = await getWorkspaceId(supabase, user.id);
    if (!wsId) return json({ error: "워크스페이스 없음" }, 400);

    const body = await parseJson<GroupBody>(request);
    const { data, error } = await supabase
      .from("groups")
      .insert({ ...body, workspace_id: wsId })
      .select("*")
      .single();

    if (error) throw error;
    return json({ group: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
