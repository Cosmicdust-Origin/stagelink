import { cookies } from "next/headers";
import { handleApiError, json, parseJson, requireUser } from "@/lib/api/auth";
import { WORKSPACE_COOKIE } from "@/lib/workspace";

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { workspace_id } = await parseJson<{ workspace_id: string }>(request);

    // Verify user belongs to this workspace
    const { data: member } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) return json({ error: "접근 권한 없음" }, 403);

    const cookieStore = await cookies();
    cookieStore.set(WORKSPACE_COOKIE, workspace_id, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    return json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
