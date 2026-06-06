import {
  ApiError,
  handleApiError,
  json,
  parseJson,
  pickAllowed,
  requireRoleWithWorkspace,
  requireWorkspace,
} from "@/lib/api/auth";

type Params = { params: Promise<{ eventId: string }> };
const eventUpdateFields = [
  "title",
  "event_type",
  "group_id",
  "venue",
  "start_at",
  "end_at",
  "manager_id",
  "on_site_manager",
  "memo",
] as const;

export async function GET(_: Request, { params }: Params) {
  try {
    const { eventId } = await params;
    const { supabase, workspaceId } = await requireWorkspace();
    const { data, error } = await supabase
      .from("events")
      .select("*, groups(name), profiles!events_manager_id_fkey(name)")
      .eq("id", eventId)
      .eq("workspace_id", workspaceId)
      .single();

    if (error) throw error;
    return json({ event: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { eventId } = await params;
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const body = await parseJson<Record<string, unknown>>(request);

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("workspace_id", workspaceId)
      .single();
    if (eventError || !event) throw new ApiError(404, "Event not found");

    // group_ids 처리: event_groups 갱신 후 events 본문에서 제외
    if ("group_ids" in body) {
      const groupIds = (body.group_ids as string[]) ?? [];
      delete body.group_ids;

      if (groupIds.length > 0) {
        const { count, error: groupError } = await supabase
          .from("groups")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .in("id", groupIds);
        if (groupError) throw groupError;
        if ((count ?? 0) !== groupIds.length) throw new ApiError(400, "Invalid group");
      }

      // 마이그레이션 012 미적용 시 무시하고 계속 진행
      const { error: delErr } = await supabase
        .from("event_groups")
        .delete()
        .eq("event_id", eventId);
      if (delErr) {
        console.warn("[event_groups delete failed]", delErr.message);
      } else if (groupIds.length > 0) {
        const { error: insErr } = await supabase
          .from("event_groups")
          .insert(groupIds.map((gid) => ({ event_id: eventId, group_id: gid })));
        if (insErr) console.warn("[event_groups insert failed]", insErr.message);
      }
    }

    // events 테이블 업데이트 (group_ids 제외한 나머지)
    const payload = pickAllowed(body, eventUpdateFields);
    if (Object.keys(payload).length > 0) {
      const { data, error } = await supabase
        .from("events")
        .update(payload)
        .eq("id", eventId)
        .eq("workspace_id", workspaceId)
        .select("*")
        .single();
      if (error) throw error;
      return json({ event: data });
    }

    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { eventId } = await params;
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId)
      .eq("workspace_id", workspaceId);

    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
