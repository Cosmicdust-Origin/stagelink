import { handleApiError, json, requireUser } from "@/lib/api/auth";
import { getWorkspaceId } from "@/lib/workspace";

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const wsId = await getWorkspaceId(supabase, user.id);
    if (!wsId) return json({ members: [] });

    // Collect all user IDs that belong to this workspace (owner + members)
    const [{ data: workspace }, { data: wsMembers }] = await Promise.all([
      supabase.from("workspaces").select("owner_id").eq("id", wsId).single(),
      supabase.from("workspace_members").select("user_id").eq("workspace_id", wsId),
    ]);

    const memberIds = [
      workspace?.owner_id,
      ...(wsMembers ?? []).map((m: { user_id: string }) => m.user_id),
    ].filter(Boolean) as string[];

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .in("id", memberIds)
      .order("name");

    if (error) throw error;
    return json({ members: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}
