import { handleApiError, json, parseJson, requireRole, requireUser } from "@/lib/api/auth";

export async function GET() {
  try {
    const { supabase, profile } = await requireUser();
    const table = profile.role === "admin" ? "privilege_types" : "privilege_types_public";
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("is_active", true)
      .order("created_at");

    if (error) throw error;
    return json({ types: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireRole(["admin"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const { data, error } = await supabase
      .from("privilege_types")
      .insert({ ...body, created_by: user.id })
      .select("*")
      .single();

    if (error) throw error;
    return json({ type: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
