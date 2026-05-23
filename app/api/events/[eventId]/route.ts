import { handleApiError, json, parseJson, requireRole, requireUser } from "@/lib/api/auth";

type Params = { params: Promise<{ eventId: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { eventId } = await params;
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("events")
      .select("*, groups(name), profiles!events_manager_id_fkey(name)")
      .eq("id", eventId)
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
    const { supabase } = await requireRole(["admin", "manager"]);
    const body = await parseJson<Record<string, unknown>>(request);

    // group_ids 처리: event_groups 갱신 후 events 본문에서 제외
    if ("group_ids" in body) {
      const groupIds = (body.group_ids as string[]) ?? [];
      delete body.group_ids;

      const { error: delErr } = await supabase
        .from("event_groups")
        .delete()
        .eq("event_id", eventId);
      if (delErr) throw delErr;

      if (groupIds.length > 0) {
        const { error: insErr } = await supabase
          .from("event_groups")
          .insert(groupIds.map((gid) => ({ event_id: eventId, group_id: gid })));
        if (insErr) throw insErr;
      }
    }

    // events 테이블 업데이트 (group_ids 제외한 나머지)
    if (Object.keys(body).length > 0) {
      const { data, error } = await supabase
        .from("events")
        .update(body)
        .eq("id", eventId)
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
    const { supabase } = await requireRole(["admin"]);
    const { error } = await supabase.from("events").delete().eq("id", eventId);

    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
