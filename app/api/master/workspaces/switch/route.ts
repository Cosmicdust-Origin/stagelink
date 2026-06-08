import { cookies } from "next/headers";
import { ApiError, handleApiError, json, parseJson, requireUser } from "@/lib/api/auth";
import { requireUuid } from "@/lib/api/validation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { WORKSPACE_COOKIE } from "@/lib/workspace";

export async function POST(request: Request) {
  try {
    const { profile, user } = await requireUser();
    if (profile.role !== "super_admin") throw new ApiError(403, "Service master access required");

    const body = await parseJson<{ workspace_id?: string }>(request);
    const workspaceId = requireUuid(body.workspace_id, "workspace_id");
    const service = createServiceRoleClient();

    const { data: workspace, error: workspaceError } = await service
      .from("workspaces")
      .select("id,name")
      .eq("id", workspaceId)
      .single();
    if (workspaceError || !workspace) throw new ApiError(404, "Workspace not found");

    const cookieStore = await cookies();
    cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    await service.from("master_audit_logs").insert({
      actor_id: user.id,
      action: "workspace.switch",
      target_workspace_id: workspaceId,
      metadata: { workspace_name: workspace.name },
    });

    return json({ workspace });
  } catch (error) {
    return handleApiError(error);
  }
}
