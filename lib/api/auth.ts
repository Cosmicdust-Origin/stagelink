import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

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

  if (!roles.includes(context.profile.role)) {
    throw new ApiError(403, "Insufficient permissions");
  }

  return context;
}
