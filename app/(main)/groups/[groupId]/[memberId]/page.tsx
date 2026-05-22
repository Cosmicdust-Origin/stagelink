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

  const chartData = (records ?? []).map((record) => ({ month: record.recorded_at.slice(5, 10), total: record.quantity }));

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <h1 className="text-2xl font-semibold text-white">{member?.name}</h1>
        <p className="mt-2 text-sm text-zinc-400">{member?.phone ?? "연락처 없음"}</p>
      </section>
      <TrendLineChart data={chartData.length ? chartData : [{ month: "이번달", total: 0 }]} />
    </div>
  );
}
