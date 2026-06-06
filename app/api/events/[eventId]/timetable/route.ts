import { ApiError, handleApiError, json, parseJson, requireRoleWithWorkspace, requireWorkspace } from "@/lib/api/auth";
import { optionalUuid, requireNonNegativeInteger, requireUuid } from "@/lib/api/validation";

type Params = { params: Promise<{ eventId: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { eventId } = await params;
    requireUuid(eventId, "eventId");
    const { supabase, workspaceId } = await requireWorkspace();
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("workspace_id", workspaceId)
      .single();
    if (!event) throw new ApiError(404, "Event not found");

    const { data, error } = await supabase
      .from("timetable_entries")
      .select("*, groups(name)")
      .eq("event_id", eventId)
      .order("sort_order");

    if (error) throw error;
    return json({ entries: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { eventId } = await params;
    requireUuid(eventId, "eventId");
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const payload = {
      start_time: body.start_time,
      end_time: body.end_time ?? null,
      group_id: optionalUuid(body.group_id, "group_id") ?? null,
      note: body.note ?? null,
      sort_order:
        body.sort_order == null ? undefined : requireNonNegativeInteger(body.sort_order, "sort_order"),
    };
    if (typeof payload.start_time !== "string" || !payload.start_time.trim()) {
      throw new ApiError(400, "Missing start_time");
    }
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("workspace_id", workspaceId)
      .single();
    if (!event) throw new ApiError(404, "Event not found");

    const { data, error } = await supabase
      .from("timetable_entries")
      .insert({ ...payload, event_id: eventId })
      .select("*")
      .single();

    if (error) throw error;
    return json({ entry: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
