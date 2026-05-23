import { handleApiError, json, parseJson, requireRole, requireUser } from "@/lib/api/auth";
import { getWorkspaceId } from "@/lib/workspace";

type Params = { params: Promise<{ groupId: string }> };
type MemberBody = { name: string; position?: string };

export async function GET(_: Request, { params }: Params) {
  try {
    const { groupId } = await params;
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("group_members")
      .select("*, members(id,name)")
      .eq("group_id", groupId)
      .order("joined_at");

    if (error) throw error;
    return json({ members: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { groupId } = await params;
    const { supabase, user } = await requireRole(["admin", "manager"]);
    const wsId = await getWorkspaceId(supabase, user.id);
    if (!wsId) return json({ error: "워크스페이스 없음" }, 400);

    const body = await parseJson<MemberBody>(request);
    if (!body.name?.trim()) return json({ error: "이름을 입력하세요" }, 400);

    // 중복 이름 체크
    const { data: existing } = await supabase
      .from("members")
      .select("id")
      .eq("workspace_id", wsId)
      .eq("name", body.name.trim())
      .maybeSingle();
    if (existing) return json({ error: `'${body.name.trim()}' 멤버가 이미 존재합니다.` }, 409);

    // 1) members 테이블에 독립 멤버 생성
    const { data: newMember, error: memberErr } = await supabase
      .from("members")
      .insert({ name: body.name.trim(), workspace_id: wsId })
      .select("id")
      .single();

    if (memberErr) throw memberErr;

    // 2) group_members 에 연결
    const { data, error } = await supabase
      .from("group_members")
      .insert({ group_id: groupId, member_id: newMember.id, position: body.position ?? null })
      .select("*")
      .single();

    if (error) throw error;
    return json({ member: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
