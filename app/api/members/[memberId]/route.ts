import { ApiError, handleApiError, json, requireRoleWithWorkspace, requireUser } from "@/lib/api/auth";
import { normalizeRole } from "@/lib/rbac";
import { requireUuid } from "@/lib/api/validation";

type Params = { params: Promise<{ memberId: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { memberId } = await params;
    requireUuid(memberId, "memberId");
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("profiles")
      .select("*, group_members(*, groups(name))")
      .eq("id", memberId)
      .single();

    if (error) throw error;
    return json({ member: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { memberId } = await params;
    requireUuid(memberId, "memberId");

    const { supabase, user, workspaceId } = await requireRoleWithWorkspace(["admin"]);
    if (memberId === user.id) throw new ApiError(400, "자기 자신은 탈퇴 처리할 수 없습니다.");

    const { data: targetProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id,role")
      .eq("id", memberId)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!targetProfile) throw new ApiError(404, "회원을 찾을 수 없습니다.");
    if (normalizeRole(targetProfile.role) === "super_admin") {
      throw new ApiError(403, "서비스 마스터 계정은 탈퇴 처리할 수 없습니다.");
    }

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id,user_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", memberId)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership) throw new ApiError(404, "현재 워크스페이스 소속 회원이 아닙니다.");

    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", memberId);

    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
