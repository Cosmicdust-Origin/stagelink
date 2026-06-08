import { NextResponse } from "next/server";
import { normalizeRole } from "@/lib/rbac";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";
import { getWorkspaceId } from "@/lib/workspace";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json<T>(body: T, status = 200) {
  return NextResponse.json(body, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return json({ error: error.message }, error.status);
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return json({ error: message }, 500);
}

export async function parseJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
}

export async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ApiError(401, "Authentication required");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,name,role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    throw new ApiError(403, "Profile is missing");
  }

  return { supabase, user, profile: profile as { id: string; name: string; role: UserRole } };
}

export async function requireRole(roles: UserRole[]) {
  const context = await requireUser();
  const role = normalizeRole(context.profile.role);

  const allowed = roles.some((requiredRole) => {
    if (role === "super_admin") return true;
    if (requiredRole === "manager") return Boolean(role);
    return role === requiredRole;
  });

  if (!allowed) {
    throw new ApiError(403, "Insufficient permissions");
  }

  return context;
}

export async function requireWorkspace() {
  const context = await requireUser();
  const workspaceId = await getWorkspaceId(context.supabase, context.user.id);

  if (!workspaceId) {
    throw new ApiError(403, "Workspace is missing");
  }

  return { ...context, workspaceId };
}

export async function requireRoleWithWorkspace(roles: UserRole[]) {
  const context = await requireRole(roles);
  const workspaceId = await getWorkspaceId(context.supabase, context.user.id);

  if (!workspaceId) {
    throw new ApiError(403, "Workspace is missing");
  }

  return { ...context, workspaceId };
}

export function pickAllowed<T extends Record<string, unknown>, K extends keyof T>(
  body: T,
  keys: readonly K[],
) {
  const payload: Partial<Pick<T, K>> = {};

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      payload[key] = body[key];
    }
  }

  return payload;
}
