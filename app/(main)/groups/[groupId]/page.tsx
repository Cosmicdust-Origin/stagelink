import Link from "next/link";
import { MonthlyBarChart } from "@/components/privileges/MonthlyBarChart";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ groupId: string }> };

export default async function GroupDetailPage({ params }: Params) {
  const { groupId } = await params;
  const supabase = await createServerSupabaseClient();
  const [{ data: group }, { data: members }, { data: events }] = await Promise.all([
    supabase.from("groups").select("*").eq("id", groupId).single(),
    supabase.from("group_members").select("*, profiles(*)").eq("group_id", groupId),
    supabase.from("events").select("*").eq("group_id", groupId).order("start_at", { ascending: false }).limit(5),
  ]);

  const chartData = (members ?? []).map((member) => ({ name: member.profiles?.name ?? "멤버", check: 0, goods: 0 }));

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <h1 className="text-2xl font-semibold text-white">{group?.name}</h1>
        <p className="mt-2 text-sm text-zinc-400">{group?.description ?? "그룹 기본 정보를 관리합니다."}</p>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {members?.map((member) => (
          <Link key={member.id} href={`/groups/${groupId}/${member.user_id}`} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="font-semibold text-white">{member.profiles?.name}</p>
            <p className="mt-1 text-sm text-zinc-400">{member.position ?? "포지션 미정"}</p>
          </Link>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-semibold text-white">최근 일정</h2>
          <div className="space-y-2">{events?.map((event) => <Link key={event.id} href={`/calendar/${event.id}`} className="block rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300">{event.title}</Link>)}</div>
        </div>
        <div>
          <h2 className="mb-3 font-semibold text-white">월간 특전 요약</h2>
          <MonthlyBarChart data={chartData} keys={["check", "goods"]} />
        </div>
      </section>
    </div>
  );
}
