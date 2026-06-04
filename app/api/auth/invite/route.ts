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

    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
