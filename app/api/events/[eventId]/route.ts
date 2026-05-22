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
    const { data, error } = await supabase
      .from("events")
      .update(body)
      .eq("id", eventId)
      .select("*")
      .single();

    if (error) throw error;
    return json({ event: data });
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
