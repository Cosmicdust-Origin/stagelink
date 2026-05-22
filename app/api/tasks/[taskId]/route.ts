import { handleApiError, json, parseJson, requireRole } from "@/lib/api/auth";

type Params = { params: Promise<{ taskId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    const { supabase } = await requireRole(["admin", "manager"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const { data, error } = await supabase
      .from("tasks")
      .update(body)
      .eq("id", taskId)
      .select("*")
      .single();

    if (error) throw error;
    return json({ task: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    const { supabase } = await requireRole(["admin"]);
    const { data, error } = await supabase
      .from("tasks")
      .update({ is_archived: true })
      .eq("id", taskId)
      .select("*")
      .single();

    if (error) throw error;
    return json({ task: data });
  } catch (error) {
    return handleApiError(error);
  }
}
