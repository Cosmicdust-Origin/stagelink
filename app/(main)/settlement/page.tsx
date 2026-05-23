import { RatesManager } from "@/components/settlement/RatesManager";
import { SettlementTable } from "@/components/settlement/SettlementTable";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSettlementSummary } from "@/lib/api/settlement";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";

export default async function SettlementPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month = new Date().toISOString().slice(0, 7) } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const wsId = user ? await getWorkspaceId(supabase, user.id) : null;

  const [members, { data: artistMembers }, { data: types }, { data: rates }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wsId ? getSettlementSummary(supabase as any, month, wsId) : Promise.resolve([]),
    wsId
      ? supabase
          .from("members")
          .select("id,name")
          .eq("workspace_id", wsId)
          .order("name")
      : Promise.resolve({ data: [] }),
    wsId
      ? supabase
          .from("privilege_types")
          .select("id,name")
          .eq("workspace_id", wsId)
          .eq("is_active", true)
          .order("created_at")
      : Promise.resolve({ data: [] }),
    wsId
      ? supabase
          .from("settlement_rates")
          .select("*, members!settlement_rates_member_id_fkey(name), privilege_types(name)")
          .eq("workspace_id", wsId)
          .order("valid_from", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">정산 관리</h1>
          <p className="mt-1 text-sm text-zinc-400">{month} 월간 특전 정산 현황</p>
        </div>
        <a
          className="rounded-md bg-[#E8457A] px-4 py-2 text-sm font-semibold text-white"
          href={`/api/settlement/export/${month}`}
        >
          PDF 내보내기
        </a>
      </div>

      <CollapsibleSection label="멤버별 장당 정산액 설정">
        <RatesManager
          members={artistMembers ?? []}
          types={types ?? []}
          initialRates={rates ?? []}
        />
      </CollapsibleSection>

      {members.length ? (
        <SettlementTable members={members} />
      ) : (
        <EmptyState title="정산 가능한 기록이 없습니다" />
      )}
    </div>
  );
}
