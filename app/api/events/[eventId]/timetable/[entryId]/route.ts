import {
  ApiError,
  handleApiError,
  json,
  parseJson,
  pickAllowed,
  requireRoleWithWorkspace,
} from "@/lib/api/auth";

type Params = { params: Promise<{ entryId: string }> };
const timetableUpdateFields = [
  "start_time",
  "end_time",
  "group_id",
  "note",
  "sort_order",
] as const;

export async function PUT(request: Request, { params }: Params) {
  try {
    const { entryId } = await params;
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const payload = pickAllowed(body, timetableUpdateFields);
    const { data: entry } = await supabase
      .from("timetable_entries")
      .select("id, events!inner(workspace_id)")
      .eq("id", entryId)
      .eq("events.workspace_id", workspaceId)
      .single();
    if (!entry) throw new ApiError(404, "Timetable entry not found");

    const { data, error } = await supabase
      .from("timetable_entries")
      .update(payload)
      .eq("id", entryId)
      .select("*")
      .single();

    if (error) throw error;
    return json({ entry: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { entryId } = await params;
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const { data: entry } = await supabase
      .from("timetable_entries")
      .select("id, events!inner(workspace_id)")
      .eq("id", entryId)
      .eq("events.workspace_id", workspaceId)
      .single();
    if (!entry) throw new ApiError(404, "Timetable entry not found");

    const { error } = await supabase.from("timetable_entries").delete().eq("id", entryId);

    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
