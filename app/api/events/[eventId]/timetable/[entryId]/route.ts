import { handleApiError, json, parseJson, requireRole } from "@/lib/api/auth";

type Params = { params: Promise<{ entryId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const { entryId } = await params;
    const { supabase } = await requireRole(["admin", "manager"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const { data, error } = await supabase
      .from("timetable_entries")
      .update(body)
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
    const { supabase } = await requireRole(["admin", "manager"]);
    const { error } = await supabase.from("timetable_entries").delete().eq("id", entryId);

    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
