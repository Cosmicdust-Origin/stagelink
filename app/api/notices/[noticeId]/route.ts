import { handleApiError, json, parseJson, requireRole, requireUser } from "@/lib/api/auth";

type Params = { params: Promise<{ noticeId: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { noticeId } = await params;
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("notices")
      .select("*, profiles!notices_author_id_fkey(name), notice_attachments(*)")
      .eq("id", noticeId)
      .single();

    if (error) throw error;
    return json({ notice: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { noticeId } = await params;
    const { supabase } = await requireRole(["admin", "manager"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const { data, error } = await supabase
      .from("notices")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", noticeId)
      .select("*")
      .single();

    if (error) throw error;
    return json({ notice: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { noticeId } = await params;
    const { supabase } = await requireRole(["admin"]);
    const { error } = await supabase.from("notices").delete().eq("id", noticeId);

    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
