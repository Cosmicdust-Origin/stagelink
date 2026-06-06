import {
  handleApiError,
  json,
  parseJson,
  pickAllowed,
  requireRoleWithWorkspace,
} from "@/lib/api/auth";

const taskCreateFields = [
  "title",
  "description",
  "status",
  "group_id",
  "assignee_id",
  "due_date",
] as const;

export async function GET(request: Request) {
  try {
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);

    const { searchParams } = new URL(request.url);

    let query = supabase
      .from("tasks")
      .select("*, groups(name), profiles!tasks_assignee_id_fkey(name)")
      .eq("workspace_id", workspaceId)
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
    const { supabase, user, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);

    const body = await parseJson<Record<string, unknown>>(request);
    const payload = pickAllowed(body, taskCreateFields);
    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...payload, created_by: user.id, workspace_id: workspaceId })
      .select("*")
      .single();

    if (error) throw error;
    return json({ task: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
