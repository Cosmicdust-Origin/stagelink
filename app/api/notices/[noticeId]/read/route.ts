import { handleApiError, json, requireUser } from "@/lib/api/auth";
import { requireUuid } from "@/lib/api/validation";

type Params = { params: Promise<{ noticeId: string }> };

export async function POST(_: Request, { params }: Params) {
  try {
    const { noticeId } = await params;
    requireUuid(noticeId, "noticeId");
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("notice_reads")
      .upsert({ notice_id: noticeId, user_id: user.id, read_at: new Date().toISOString() }, { onConflict: "notice_id,user_id" });

    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
