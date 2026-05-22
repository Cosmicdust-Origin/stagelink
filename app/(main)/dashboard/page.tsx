import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);

  const [{ data: events }, { data: tasks }, { data: notices }, { count: groupCount }] = await Promise.all([
    supabase.from("events").select("id,title,start_at,venue").gte("start_at", now.toISOString()).lte("start_at", nextWeek.toISOString()).order("start_at").limit(5),
    supabase.from("tasks").select("id,title,due_date,status").neq("status", "done").order("due_date", { ascending: true, nullsFirst: false }).limit(5),
    supabase.from("notices").select("id,title,created_at").order("created_at", { ascending: false }).limit(3),
    supabase.from("groups").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="등록 그룹" value={groupCount ?? 0} />
        <StatCard label="7일 내 일정" value={events?.length ?? 0} />
        <StatCard label="미완료 업무" value={tasks?.length ?? 0} />
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <h2 className="text-base font-semibold text-white">다가오는 일정</h2>
          <div className="mt-4 space-y-3">
            {events?.length ? (
              events.map((event) => (
                <Link key={event.id} href={`/calendar/${event.id}`} className="block rounded-md border border-white/10 p-3 hover:bg-white/[0.04]">
                  <p className="font-medium text-white">{event.title}</p>
                  <p className="text-sm text-zinc-400">{formatDate(event.start_at)} · {event.venue ?? "장소 미정"}</p>
                </Link>
              ))
            ) : (
              <EmptyState title="예정된 일정이 없습니다" />
            )}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <h2 className="text-base font-semibold text-white">업무와 공지</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-sm text-zinc-400">마감 업무</p>
              {tasks?.length ? tasks.map((task) => <p key={task.id} className="rounded-md bg-white/[0.04] px-3 py-2 text-sm text-zinc-200">{task.title}</p>) : <EmptyState title="급한 업무가 없습니다" />}
            </div>
            <div>
              <p className="mb-2 text-sm text-zinc-400">최근 공지</p>
              {notices?.length ? notices.map((notice) => <Link key={notice.id} href={`/notice/${notice.id}`} className="block px-3 py-2 text-sm text-zinc-200 hover:text-white">{notice.title}</Link>) : <EmptyState title="공지 없음" />}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
