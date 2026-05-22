import { RateCreateForm } from "@/components/settlement/RateCreateForm";
import { SettlementTable } from "@/components/settlement/SettlementTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSettlementSummary } from "@/lib/api/settlement";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SettlementPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month = new Date().toISOString().slice(0, 7) } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const [members, { data: profiles }, { data: types }, { data: rates }] = await Promise.all([
    getSettlementSummary(supabase, month),
    supabase.from("profiles").select("id,name").eq("role", "member").order("name"),
    supabase.from("privilege_types").select("id,name").eq("is_active", true).order("created_at"),
    supabase.from("settlement_rates").select("*, profiles(name), privilege_types(name)").order("valid_from", { ascending: false }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">정산 관리</h1>
          <p className="mt-1 text-sm text-zinc-400">{month} 월간 정산 요약과 비율 설정</p>
        </div>
        <a className="rounded-md bg-[#E8457A] px-4 py-2 text-sm font-semibold text-white" href={`/api/settlement/export/${month}`}>
          PDF 내보내기
        </a>
      </div>
      <RateCreateForm members={profiles ?? []} types={types ?? []} />
      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
        <h2 className="font-semibold text-white">등록된 정산 비율</h2>
        <div className="mt-3 divide-y divide-white/10">
          {(rates ?? []).map((rate) => (
            <div key={rate.id} className="flex items-center justify-between gap-4 py-2 text-sm">
              <span className="text-zinc-200">{rate.profiles?.name ?? "멤버"} · {rate.privilege_types?.name ?? "특전"}</span>
              <span className="tabular-nums text-zinc-400">{Number(rate.rate) * 100}%</span>
            </div>
          ))}
        </div>
      </section>
      {members.length ? <SettlementTable members={members} /> : <EmptyState title="정산 가능한 기록이 없습니다" />}
    </div>
  );
}
