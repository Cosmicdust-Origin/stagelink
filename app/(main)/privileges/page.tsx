import { MonthFilter } from "@/components/privileges/MonthFilter";
import { PrivilegeRecordCreateForm, PrivilegeTypeCreateForm } from "@/components/privileges/PrivilegeForms";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { MonthlyBarChart } from "@/components/privileges/MonthlyBarChart";
import { TrendLineChart } from "@/components/privileges/TrendLineChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";

type Props = { searchParams: Promise<{ month?: string }> };

export default async function PrivilegesPage({ searchParams }: Props) {
  const { month } = await searchParams;
  const selectedMonth = month ?? new Date().toISOString().slice(0, 7);
  const [year, mon] = selectedMonth.split("-").map(Number);
  const rangeStart = `${selectedMonth}-01`;
  const rangeEnd = new Date(year, mon, 1).toISOString().slice(0, 10);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const wsId = user ? await getWorkspaceId(supabase, user.id) : null;

  const [{ data }, { data: events }, { data: members }, { data: types }] = await Promise.all([
    wsId
      ? supabase
          .from("privilege_records")
          .select(
            "quantity, recorded_at, privilege_type_id, members!privilege_records_member_id_fkey(name), privilege_types(name), events(start_at, title, workspace_id)",
          )
          .eq("events.workspace_id", wsId)
          .order("recorded_at", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] }),
    wsId
      ? supabase
          .from("events")
          .select("id,title")
          .eq("workspace_id", wsId)
          .order("start_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),
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
          .select("id,name,unit_price")
          .eq("workspace_id", wsId)
          .eq("is_active", true)
          .order("created_at")
      : Promise.resolve({ data: [] }),
  ]);

  const allRecords = (data ?? []) as unknown as Array<{
    quantity: number;
    recorded_at: string;
    members: { name: string } | null;
    privilege_types: { name: string } | null;
    events: { start_at: string; title: string } | null;
  }>;

  const records = allRecords.filter((r) => {
    const eventDate = r.events?.start_at ?? r.recorded_at;
    return eventDate >= rangeStart && eventDate < rangeEnd;
  });

  const typeNames = [...new Set(records.map((r) => r.privilege_types?.name ?? "기타"))];
  const byMember = new Map<string, Record<string, string | number>>();
  for (const r of records) {
    const member = r.members?.name ?? "멤버";
    const type = r.privilege_types?.name ?? "기타";
    const row = byMember.get(member) ?? { name: member };
    row[type] = Number(row[type] ?? 0) + r.quantity;
    byMember.set(member, row);
  }

  const memberNames = [...new Set(records.map((r) => r.members?.name ?? "멤버"))];
  const dailyMap = new Map<string, Record<string, string | number>>();
  for (const r of records) {
    const day = (r.events?.start_at ?? r.recorded_at).slice(5, 10);
    const member = r.members?.name ?? "멤버";
    const row = dailyMap.get(day) ?? { date: day };
    row[member] = Number(row[member] ?? 0) + r.quantity;
    dailyMap.set(day, row);
  }
  const trendData = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, row]) => row);

  const monthLabel = `${year}년 ${mon}월`;
  const hasData = records.length > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">특전 현황</h1>
          <p className="mt-1 text-sm text-zinc-400">
            특전 종류와 멤버별 수량을 등록하고 확인합니다.
          </p>
        </div>
        <MonthFilter value={selectedMonth} />
      </div>
      <CollapsibleSection label="특전 등록">
        <PrivilegeTypeCreateForm />
      </CollapsibleSection>
      <CollapsibleSection label="수량 등록">
        <PrivilegeRecordCreateForm
          events={(events ?? []).map((e) => ({ id: e.id, name: e.title }))}
          members={members ?? []}
          types={types ?? []}
        />
      </CollapsibleSection>
      {hasData ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <MonthlyBarChart
            title={`${monthLabel} 멤버별 특전 수량`}
            description="특전 종류별로 색상이 구분됩니다"
            data={[...byMember.values()]}
            keys={typeNames}
          />
          <TrendLineChart
            title={`${monthLabel} 공연별 특전 수량 추이`}
            description="공연 날짜 기준 · 멤버별 합산"
            data={
              trendData.length
                ? trendData
                : [{ date: "-", ...Object.fromEntries(memberNames.map((m) => [m, 0])) }]
            }
          />
        </div>
      ) : (
        <EmptyState
          title={`${monthLabel} 특전 기록이 없습니다`}
          description="조회 월을 변경하거나, 위 등록 영역에서 수량을 입력하세요."
        />
      )}
    </div>
  );
}
