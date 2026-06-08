import { createServiceRoleClient } from "@/lib/supabase/server";
import { handleApiError, json, parseJson, requireRole } from "@/lib/api/auth";
import { getWorkspaceId } from "@/lib/workspace";

type InviteBody = {
  email: string;
  role: "owner" | "staff";
  name?: string;
};

export async function POST(request: Request) {
  try {
    const { supabase: ctx, user } = await requireRole(["admin"]);
    const wsId = await getWorkspaceId(ctx, user.id);
    const body = await parseJson<InviteBody>(request);
    const supabase = createServiceRoleClient();

    const { error } = await supabase.auth.admin.inviteUserByEmail(body.email, {
      data: { role: body.role, name: body.name, workspace_id: wsId },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/accept-invite`,
    });

    if (error) {
      // 이미 수락 완료된 계정(auth.users에 confirmed로 존재)
      const msg = error.message?.toLowerCase() ?? "";
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        throw Object.assign(new Error("이미 가입된 이메일 주소입니다. 해당 계정을 삭제한 뒤 재초대해주세요."), { status: 409 });
      }
      throw error;
    }
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
