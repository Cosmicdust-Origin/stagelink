import Link from "next/link";
import { NoticeCreateForm } from "@/components/notice/NoticeCreateForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function NoticePage() {
  const supabase = await createServerSupabaseClient();
  const [{ data: notices }, { data: groups }] = await Promise.all([
    supabase
      .from("notices")
      .select("*, profiles!notices_author_id_fkey(name)")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("groups").select("id,name").order("name"),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-white">공지 게시판</h1>
        <p className="mt-1 text-sm text-zinc-400">전체 또는 그룹 대상 공지를 작성합니다.</p>
      </div>
      <NoticeCreateForm groups={groups ?? []} />
      <div className="space-y-3">
        {notices?.length ? (
          notices.map((notice) => (
            <Link key={notice.id} href={`/notice/${notice.id}`} className="block rounded-lg border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.07]">
              <div className="flex items-center gap-2">
                {notice.is_pinned ? <span className="rounded bg-[#E8457A]/20 px-2 py-1 text-xs text-[#ff8fb1]">고정</span> : null}
                <p className="font-semibold text-white">{notice.title}</p>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{notice.profiles?.name ?? "작성자"} · {formatDate(notice.created_at)}</p>
            </Link>
          ))
        ) : (
          <EmptyState title="공지사항이 없습니다" />
        )}
      </div>
    </div>
  );
}
