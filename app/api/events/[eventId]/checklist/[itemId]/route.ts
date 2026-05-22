import { handleApiError, json, parseJson, requireRole } from "@/lib/api/auth";

type Params = { params: Promise<{ itemId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const { itemId } = await params;
    const { supabase, user } = await requireRole(["admin", "manager"]);
    const body = await parseJson<{ is_checked: boolean }>(request);
    const { data, error } = await supabase
      .from("event_checklists")
      .update({
        is_checked: body.is_checked,
        checked_by: body.is_checked ? user.id : null,
        checked_at: body.is_checked ? new Date().toISOString() : null,
      })
      .eq("id", itemId)
      .select("*")
      .single();

    if (error) throw error;
    return json({ item: data });
  } catch (error) {
    return handleApiError(error);
  }
}
