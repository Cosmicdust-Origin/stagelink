import { handleApiError, json, requireUser } from "@/lib/api/auth";

type Params = { params: Promise<{ noticeId: string }> };

export async function POST(_: Request, { params }: Params) {
  try {
    const { noticeId } = await params;
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
