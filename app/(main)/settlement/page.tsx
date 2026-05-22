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
  const members = await getSettlementSummary(supabase, month);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">정산 관리</h1>
          <p className="mt-1 text-sm text-zinc-400">{month} 월간 정산 요약</p>
        </div>
        <a className="rounded-md bg-[#E8457A] px-4 py-2 text-sm font-semibold text-white" href={`/api/settlement/export/${month}`}>
          PDF 내보내기
        </a>
      </div>
      {members.length ? <SettlementTable members={members} /> : <EmptyState title="정산 가능한 기록이 없습니다" />}
    </div>
  );
}
