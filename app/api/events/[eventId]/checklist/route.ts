import { ApiError, handleApiError, json, parseJson, requireRoleWithWorkspace, requireWorkspace } from "@/lib/api/auth";

type Params = { params: Promise<{ eventId: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { eventId } = await params;
    const { supabase, workspaceId } = await requireWorkspace();
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("workspace_id", workspaceId)
      .single();
    if (!event) throw new ApiError(404, "Event not found");

    const { data, error } = await supabase
      .from("event_checklists")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order");

    if (error) throw error;
    return json({ items: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { eventId } = await params;
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const body = await parseJson<{ label: string; sort_order?: number }>(request);
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("workspace_id", workspaceId)
      .single();
    if (!event) throw new ApiError(404, "Event not found");

    const { data, error } = await supabase
      .from("event_checklists")
      .insert({ ...body, event_id: eventId })
      .select("*")
      .single();

    if (error) throw error;
    return json({ item: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
