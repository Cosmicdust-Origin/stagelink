import { ApiError, handleApiError, json, parseJson, requireUser } from "@/lib/api/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

type AcceptInviteBody = {
  name: string;
  username: string;
  password: string;
};

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const body = await parseJson<AcceptInviteBody>(request);

    if (!body.username?.trim()) throw new ApiError(400, "아이디를 입력해주세요.");
    const username = body.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      throw new ApiError(400, "아이디는 영문 소문자·숫자·밑줄(_)만 사용 가능하며 3~20자여야 합니다.");
    }

    // 아이디 중복 확인
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", user.id)
      .maybeSingle();
    if (existing) throw new ApiError(409, "이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.");

    const { error: authError } = await supabase.auth.updateUser({
      password: body.password,
      data: { name: body.name, username },
    });
    if (authError) throw authError;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ name: body.name, username })
      .eq("id", user.id);
    if (profileError) throw profileError;

    // Add to workspace if workspace_id was included in the invite metadata.
    // The invited user cannot write workspace_members directly under RLS;
    // the server validates the invite metadata and performs the membership write.
    const workspaceId = user.user_metadata?.workspace_id as string | undefined;
    if (!workspaceId) throw new ApiError(400, "초대 정보에 워크스페이스가 없습니다. 관리자에게 다시 초대를 요청해주세요.");

    const service = createServiceRoleClient();
    const { data: workspace, error: workspaceError } = await service
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .maybeSingle();

    if (workspaceError) throw workspaceError;
    if (!workspace) throw new ApiError(404, "초대된 워크스페이스를 찾을 수 없습니다. 관리자에게 다시 초대를 요청해주세요.");

    const { error: membershipError } = await service
      .from("workspace_members")
      .upsert({ workspace_id: workspaceId, user_id: user.id }, { onConflict: "workspace_id,user_id" });

    if (membershipError) throw membershipError;

    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
