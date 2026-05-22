import { handleApiError, json, parseJson, requireUser } from "@/lib/api/auth";

type AcceptInviteBody = {
  name: string;
  password: string;
};

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const body = await parseJson<AcceptInviteBody>(request);

    const { error: authError } = await supabase.auth.updateUser({
      password: body.password,
      data: { name: body.name },
    });
    if (authError) throw authError;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ name: body.name })
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
