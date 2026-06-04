import { handleApiError, json, parseJson, requireRole, requireUser } from "@/lib/api/auth";

type Params = { params: Promise<{ groupId: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { groupId } = await params;
    const { supabase } = await requireUser();
    const { data, error } = await supabase.from("groups").select("*").eq("id", groupId).single();

    if (error) throw error;
    return json({ group: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { groupId } = await params;
    const { supabase } = await requireRole(["admin", "manager"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const { data, error } = await supabase
      .from("groups")
      .update(body)
      .eq("id", groupId)
      .select("*")
      .single();

    if (error) throw error;
    return json({ group: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { groupId } = await params;
    const { supabase } = await requireRole(["admin", "manager"]);
    const { error } = await supabase.from("groups").delete().eq("id", groupId);

    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
