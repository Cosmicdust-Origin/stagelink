import {
  ApiError,
  handleApiError,
  json,
  parseJson,
  pickAllowed,
  requireRoleWithWorkspace,
} from "@/lib/api/auth";
import { optionalDateString, optionalUuid } from "@/lib/api/validation";

const taskCreateFields = [
  "title",
  "description",
  "status",
  "group_id",
  "assignee_id",
  "due_date",
] as const;
const taskStatuses = new Set(["todo", "in_progress", "done"]);

export async function GET(request: Request) {
  try {
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);

    const { searchParams } = new URL(request.url);

    let query = supabase
      .from("tasks")
      .select("*, groups(name), profiles!tasks_assignee_id_fkey(name)")
      .eq("workspace_id", workspaceId)
      .order("due_date", { ascending: true, nullsFirst: false });

    const status = searchParams.get("status");
    if (status) {
      if (!taskStatuses.has(status)) throw new ApiError(400, "Invalid status");
      query = query.eq("status", status);
    }

    for (const key of ["group_id", "assignee_id"] as const) {
      const value = optionalUuid(searchParams.get(key), key);
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
    if (payload.group_id !== undefined) payload.group_id = optionalUuid(payload.group_id, "group_id") ?? null;
    if (payload.assignee_id !== undefined) payload.assignee_id = optionalUuid(payload.assignee_id, "assignee_id") ?? null;
    if (payload.due_date !== undefined) payload.due_date = optionalDateString(payload.due_date, "due_date") ?? null;
    if (payload.status !== undefined && (typeof payload.status !== "string" || !taskStatuses.has(payload.status))) {
      throw new ApiError(400, "Invalid status");
    }
    if (!payload.title || typeof payload.title !== "string" || !payload.title.trim()) {
      throw new ApiError(400, "Missing task title");
    }
    payload.title = payload.title.trim();
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
