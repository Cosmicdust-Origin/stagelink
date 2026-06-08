import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "./supabase/server";

export const WORKSPACE_COOKIE = "ws_id";

/**
 * Resolves the active workspace_id for a given user.
 * - Admin  : returns the workspace they own.
 * - Staff/Manager : returns workspace from cookie (verified) or first membership.
 *
 * Pass an existing supabase client + userId to avoid creating duplicate clients.
 */
export async function getWorkspaceId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const cookieStore = await cookies();
  const preferred = cookieStore.get(WORKSPACE_COOKIE)?.value;

  if (profile?.role === "super_admin") {
    if (preferred) {
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .eq("id", preferred)
        .maybeSingle();
      if (workspace) return workspace.id;
    }

    const { data: firstWorkspace } = await supabase
      .from("workspaces")
      .select("id")
      .order("created_at")
      .limit(1)
      .maybeSingle();
    return firstWorkspace?.id ?? null;
  }

  // Admin: owns a workspace
  const { data: ownWs } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (ownWs) return ownWs.id;

  // Staff/manager: check cookie preference first
  if (preferred) {
    const { data: m } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("workspace_id", preferred)
      .eq("user_id", userId)
      .maybeSingle();
    if (m) return m.workspace_id;
  }

  // Fall back to first available membership
  const { data: first } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .order("joined_at")
    .limit(1)
    .maybeSingle();

  return first?.workspace_id ?? null;
}

/**
 * Convenience wrapper for server components that create their own supabase client.
 */
export async function resolveWorkspaceId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return getWorkspaceId(supabase, user.id);
}

/**
 * Returns all workspace_ids a user belongs to (owned + memberships).
 */
export async function getUserWorkspaces(
  supabase: SupabaseClient,
  userId: string,
): Promise<Array<{ id: string; name: string }>> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role === "super_admin") {
    const { data } = await supabase
      .from("workspaces")
      .select("id,name")
      .order("created_at");
    return data ?? [];
  }

  const [{ data: owned }, { data: memberships }] = await Promise.all([
    supabase.from("workspaces").select("id,name").eq("owner_id", userId),
    supabase
      .from("workspace_members")
      .select("workspaces(id,name)")
      .eq("user_id", userId),
  ]);

  const memberWs = (memberships ?? [])
    .map((m: Record<string, unknown>) => m.workspaces as { id: string; name: string } | null)
    .filter((w): w is { id: string; name: string } => w !== null);

  return [...(owned ?? []), ...memberWs];
}
