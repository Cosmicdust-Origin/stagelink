import { NoticeActions } from "@/components/notice/NoticeActions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

type Params = { params: Promise<{ noticeId: string }> };

export default async function NoticeDetailPage({ params }: Params) {
  const { noticeId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: notice } = await supabase
    .from("notices")
    .select("*, profiles!notices_author_id_fkey(name)")
    .eq("id", noticeId)
    .single();

  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <p className="text-sm text-zinc-400">{notice?.profiles?.name ?? "작성자"} · {notice ? formatDate(notice.created_at) : ""}</p>
      <h1 className="mt-2 text-2xl font-semibold text-white">{notice?.title}</h1>
      <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-zinc-200">{notice?.content}</div>
      {notice ? <NoticeActions noticeId={noticeId} initialTitle={notice.title} initialContent={notice.content} /> : null}
    </article>
  );
}
