import { createServiceRoleClient } from "@/lib/supabase/server";
import { handleApiError, json, parseJson, requireRole } from "@/lib/api/auth";

type InviteBody = {
  email: string;
  role: "manager" | "member";
  name?: string;
};

export async function POST(request: Request) {
  try {
    await requireRole(["admin"]);
    const body = await parseJson<InviteBody>(request);
    const supabase = createServiceRoleClient();

    const { error } = await supabase.auth.admin.inviteUserByEmail(body.email, {
      data: { role: body.role, name: body.name },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/accept-invite`,
    });

    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
