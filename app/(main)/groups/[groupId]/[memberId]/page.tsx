import { TrendLineChart } from "@/components/privileges/TrendLineChart";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ groupId: string; memberId: string }> };

export default async function MemberDetailPage({ params }: Params) {
  const { memberId } = await params;
  const supabase = await createServerSupabaseClient();
  const [{ data: member }, { data: records }] = await Promise.all([
    supabase.from("profiles").select("*, group_members(*, groups(name))").eq("id", memberId).single(),
    supabase.from("privilege_records").select("quantity, recorded_at, privilege_types(name)").eq("member_id", memberId).limit(30),
  ]);

  const memberName = member?.name ?? "멤버";
  const chartData = (records ?? []).map((record) => ({
    date: record.recorded_at.slice(5, 10),
    [memberName]: record.quantity,
  }));

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <h1 className="text-2xl font-semibold text-white">{member?.name}</h1>
        <p className="mt-2 text-sm text-zinc-400">{member?.phone ?? "연락처 없음"}</p>
      </section>
      <TrendLineChart
        title="특전 등록 이력"
        description="날짜별 특전 수량"
        data={chartData.length ? chartData : [{ date: "-", [memberName]: 0 }]}
      />
    </div>
  );
}
