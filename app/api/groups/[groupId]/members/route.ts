import {
  ApiError,
  handleApiError,
  json,
  parseJson,
  requireRoleWithWorkspace,
  requireWorkspace,
} from "@/lib/api/auth";
import { requireUuid } from "@/lib/api/validation";

type Params = { params: Promise<{ groupId: string }> };
type MemberBody = { name: string; position?: string };

export async function GET(_: Request, { params }: Params) {
  try {
    const { groupId } = await params;
    requireUuid(groupId, "groupId");
    const { supabase, workspaceId } = await requireWorkspace();

    const { data: group } = await supabase
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("workspace_id", workspaceId)
      .single();
    if (!group) throw new ApiError(404, "Group not found");

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
    requireUuid(groupId, "groupId");
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin"]);

    const { data: group } = await supabase
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("workspace_id", workspaceId)
      .single();
    if (!group) throw new ApiError(404, "Group not found");

    const body = await parseJson<MemberBody>(request);
    const name = body.name?.trim();
    if (!name) throw new ApiError(400, "Missing member name");

    const { data: existing } = await supabase
      .from("members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("name", name)
      .maybeSingle();

    if (existing) {
      const { data: inGroup } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("member_id", existing.id)
        .maybeSingle();

      if (inGroup) {
        return json({ error: `'${name}' member already belongs to this group.` }, 409);
      }

      const { data, error } = await supabase
        .from("group_members")
        .insert({ group_id: groupId, member_id: existing.id, position: body.position ?? null })
        .select("*")
        .single();

      if (error) throw error;
      return json({ member: data }, 201);
    }

    const { data: newMember, error: memberErr } = await supabase
      .from("members")
      .insert({ name, workspace_id: workspaceId })
      .select("id")
      .single();

    if (memberErr) throw memberErr;

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
