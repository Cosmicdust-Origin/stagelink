import { handleApiError, json, parseJson, requireRole, requireUser } from "@/lib/api/auth";

type Params = { params: Promise<{ eventId: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { eventId } = await params;
    const { supabase } = await requireUser();
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
    const { supabase } = await requireRole(["admin", "manager"]);
    const body = await parseJson<{ label: string; sort_order?: number }>(request);
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
