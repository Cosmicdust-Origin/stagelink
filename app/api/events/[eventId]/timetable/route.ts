import { handleApiError, json, parseJson, requireRole, requireUser } from "@/lib/api/auth";

type Params = { params: Promise<{ eventId: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { eventId } = await params;
    const { supabase } = await requireUser();
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
    const { supabase } = await requireRole(["admin", "manager"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const { data, error } = await supabase
      .from("timetable_entries")
      .insert({ ...body, event_id: eventId })
      .select("*")
      .single();

    if (error) throw error;
    return json({ entry: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
