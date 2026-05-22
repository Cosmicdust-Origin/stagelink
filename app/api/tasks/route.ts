import { handleApiError, json, parseJson, requireRole } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireRole(["admin", "manager"]);
    const { searchParams } = new URL(request.url);

    let query = supabase
      .from("tasks")
      .select("*, groups(name), profiles!tasks_assignee_id_fkey(name)")
      .order("due_date", { ascending: true, nullsFirst: false });

    for (const key of ["status", "group_id", "assignee_id"] as const) {
      const value = searchParams.get(key);
      if (value) query = query.eq(key, value);
    }

    const archived = searchParams.get("archived");
    if (archived) query = query.eq("is_archived", archived === "true");

    const { data, error } = await query;
    if (error) throw error;
    return json({ tasks: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireRole(["admin", "manager"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...body, created_by: user.id })
      .select("*")
      .single();

    if (error) throw error;
    return json({ task: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
