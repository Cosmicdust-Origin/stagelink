import { handleApiError, json, parseJson, requireRole, requireUser } from "@/lib/api/auth";
import { getWorkspaceId } from "@/lib/workspace";

/** GET /api/members — 워크스페이스 소속 아티스트 멤버 목록 */
export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const wsId = await getWorkspaceId(supabase, user.id);
    if (!wsId) return json({ members: [] });

    const { data, error } = await supabase
      .from("members")
      .select("id,name,created_at")
      .eq("workspace_id", wsId)
      .order("name");

    if (error) throw error;
    return json({ members: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

/** POST /api/members — 새 아티스트 멤버 생성 */
export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireRole(["admin", "manager"]);
    const wsId = await getWorkspaceId(supabase, user.id);
    if (!wsId) return json({ error: "워크스페이스 없음" }, 400);

    const { name } = await parseJson<{ name: string }>(request);
    if (!name?.trim()) return json({ error: "이름을 입력하세요" }, 400);

    const { data, error } = await supabase
      .from("members")
      .insert({ name: name.trim(), workspace_id: wsId })
      .select("*")
      .single();

    if (error) throw error;
    return json({ member: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
