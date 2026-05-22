import { handleApiError, json, requireRole } from "@/lib/api/auth";

type Params = { params: Promise<{ groupId: string; memberId: string }> };

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { groupId, memberId } = await params;
    const { supabase } = await requireRole(["admin"]);
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", memberId);

    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
