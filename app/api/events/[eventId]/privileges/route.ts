import { ApiError, handleApiError, json, parseJson, requireRoleWithWorkspace } from "@/lib/api/auth";
import { requireNonNegativeInteger, requireUuid } from "@/lib/api/validation";

type Params = { params: Promise<{ eventId: string }> };
type Body = {
  records: Array<{
    member_id: string;
    privilege_type_id: string;
    quantity: number;
  }>;
};

export async function GET(_: Request, { params }: Params) {
  try {
    const { eventId } = await params;
    requireUuid(eventId, "eventId");
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("workspace_id", workspaceId)
      .single();
    if (!event) throw new ApiError(404, "Event not found");

    const { data, error } = await supabase
      .from("privilege_records")
      .select("*, members(name), privilege_types(name,unit_price)")
      .eq("event_id", eventId);

    if (error) throw error;
    return json({ records: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { eventId } = await params;
    requireUuid(eventId, "eventId");
    const { supabase, user, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const body = await parseJson<Body>(request);
    if (!Array.isArray(body.records)) throw new ApiError(400, "Invalid records");
    body.records = body.records.map((record) => ({
      member_id: requireUuid(record.member_id, "member_id"),
      privilege_type_id: requireUuid(record.privilege_type_id, "privilege_type_id"),
      quantity: requireNonNegativeInteger(record.quantity, "quantity"),
    }));

    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("workspace_id", workspaceId)
      .single();
    if (!event) throw new ApiError(404, "Event not found");

    const memberIds = [...new Set(body.records.map((record) => record.member_id))];
    const typeIds = [...new Set(body.records.map((record) => record.privilege_type_id))];
    if (memberIds.length > 0) {
      const { count, error: memberError } = await supabase
        .from("members")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .in("id", memberIds);
      if (memberError) throw memberError;
      if ((count ?? 0) !== memberIds.length) throw new ApiError(400, "Invalid member");
    }
    if (typeIds.length > 0) {
      const { count, error: typeError } = await supabase
        .from("privilege_types")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .in("id", typeIds);
      if (typeError) throw typeError;
      if ((count ?? 0) !== typeIds.length) throw new ApiError(400, "Invalid privilege type");
    }

    const { error } = await supabase.from("privilege_records").upsert(
      body.records.map((record) => ({
        ...record,
        event_id: eventId,
        recorded_by: user.id,
        recorded_at: new Date().toISOString(),
      })),
      { onConflict: "event_id,member_id,privilege_type_id" },
    );

    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
