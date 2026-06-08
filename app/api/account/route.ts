import { ApiError, handleApiError, json, parseJson, requireUser } from "@/lib/api/auth";

type AccountBody = {
  name?: string;
  username?: string;
  phone?: string;
  password?: string;
};

export async function PATCH(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const body = await parseJson<AccountBody>(request);

    // 아이디 변경 시 중복 확인
    if (body.username !== undefined) {
      const username = body.username.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        throw new ApiError(400, "아이디는 영문 소문자·숫자·밑줄(_)만 사용 가능하며 3~20자여야 합니다.");
      }
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("id", user.id)
        .maybeSingle();
      if (existing) throw new ApiError(409, "이미 사용 중인 아이디입니다.");
      body.username = username;
    }

    // Update auth user metadata
    if (body.password || body.name !== undefined || body.username !== undefined) {
      const updateData: { password?: string; data?: Record<string, string> } = {};
      if (body.password) updateData.password = body.password;
      if (body.name !== undefined || body.username !== undefined) {
        updateData.data = {};
        if (body.name !== undefined) updateData.data.name = body.name;
        if (body.username !== undefined) updateData.data.username = body.username;
      }
      const { error } = await supabase.auth.updateUser(updateData);
      if (error) throw error;
    }

    // Update profile row
    const profileUpdate: Record<string, unknown> = {};
    if (body.name !== undefined) profileUpdate.name = body.name;
    if (body.username !== undefined) profileUpdate.username = body.username;
    if (body.phone !== undefined) profileUpdate.phone = body.phone;

    if (Object.keys(profileUpdate).length > 0) {
      const { error } = await supabase.from("profiles").update(profileUpdate).eq("id", user.id);
      if (error) throw error;
    }

    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
