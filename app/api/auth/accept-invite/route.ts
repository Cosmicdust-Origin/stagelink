import { ApiError, handleApiError, json, parseJson, requireUser } from "@/lib/api/auth";

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

    // Add to workspace if workspace_id was included in the invite metadata
    const workspaceId = user.user_metadata?.workspace_id as string | undefined;
    if (workspaceId) {
      await supabase
        .from("workspace_members")
        .upsert({ workspace_id: workspaceId, user_id: user.id }, { onConflict: "workspace_id,user_id" });
    }

    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
