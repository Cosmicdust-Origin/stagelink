import { handleApiError, json, parseJson, requireRole, requireUser } from "@/lib/api/auth";
import { getWorkspaceId } from "@/lib/workspace";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const wsId = await getWorkspaceId(supabase, user.id);
    if (!wsId) return json({ notices: [] });

    const { data, error } = await supabase
      .from("notices")
      .select("*, profiles!notices_author_id_fkey(name), groups(name)")
      .eq("workspace_id", wsId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return json({ notices: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireRole(["admin", "manager"]);
    const wsId = await getWorkspaceId(supabase, user.id);
    if (!wsId) return json({ error: "워크스페이스 없음" }, 400);

    const body = await parseJson<Record<string, unknown>>(request);
    const { data, error } = await supabase
      .from("notices")
      .insert({ ...body, author_id: user.id, workspace_id: wsId })
      .select("*")
      .single();

    if (error) throw error;
    return json({ notice: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
