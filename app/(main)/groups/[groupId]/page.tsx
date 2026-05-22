import Link from "next/link";
import { GroupActions } from "@/components/groups/GroupActions";
import { MemberManager } from "@/components/groups/MemberManager";
import { MonthlyBarChart } from "@/components/privileges/MonthlyBarChart";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ groupId: string }> };

export default async function GroupDetailPage({ params }: Params) {
  const { groupId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: group }, { data: members }, { data: events }, { data: profiles }, { data: profile }] = await Promise.all([
    supabase.from("groups").select("*").eq("id", groupId).single(),
    supabase.from("group_members").select("*, profiles(*)").eq("group_id", groupId),
    supabase.from("events").select("*").eq("group_id", groupId).order("start_at", { ascending: false }).limit(5),
    supabase.from("profiles").select("id,name,role").order("name"),
    user ? supabase.from("profiles").select("role").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);
  const canEdit = profile?.role === "admin";
  const chartData = (members ?? []).map((member) => ({ name: member.profiles?.name ?? "멤버", check: 0, goods: 0 }));

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <h1 className="text-2xl font-semibold text-white">{group?.name}</h1>
        <p className="mt-2 text-sm text-zinc-400">{group?.description ?? "그룹 기본 정보를 관리합니다."}</p>
        {canEdit && group ? (
          <GroupActions
            groupId={groupId}
            initialName={group.name}
            initialDescription={group.description ?? ""}
            initialDebutDate={group.debut_date ?? ""}
          />
        ) : null}
      </section>
      <MemberManager groupId={groupId} members={members ?? []} profiles={profiles ?? []} canEdit={canEdit} />
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
