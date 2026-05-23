import { handleApiError, json, parseJson, requireRole } from "@/lib/api/auth";

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
    const { supabase } = await requireRole(["admin", "manager"]);
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
    const { supabase, user } = await requireRole(["admin", "manager"]);
    const body = await parseJson<Body>(request);

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
