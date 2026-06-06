import {
  handleApiError,
  json,
  parseJson,
  pickAllowed,
  requireRoleWithWorkspace,
  requireWorkspace,
} from "@/lib/api/auth";

type Params = { params: Promise<{ noticeId: string }> };
const noticeUpdateFields = ["title", "content", "target_group_id", "is_pinned"] as const;

export async function GET(_: Request, { params }: Params) {
  try {
    const { noticeId } = await params;
    const { supabase, workspaceId } = await requireWorkspace();
    const { data, error } = await supabase
      .from("notices")
      .select("*, profiles!notices_author_id_fkey(name), notice_attachments(*)")
      .eq("id", noticeId)
      .eq("workspace_id", workspaceId)
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
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const payload = pickAllowed(body, noticeUpdateFields);
    const { data, error } = await supabase
      .from("notices")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", noticeId)
      .eq("workspace_id", workspaceId)
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
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);
    const { error } = await supabase
      .from("notices")
      .delete()
      .eq("id", noticeId)
      .eq("workspace_id", workspaceId);

    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
