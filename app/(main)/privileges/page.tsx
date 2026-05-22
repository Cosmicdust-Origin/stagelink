import { PrivilegeRecordCreateForm, PrivilegeTypeCreateForm } from "@/components/privileges/PrivilegeForms";
import { MonthlyBarChart } from "@/components/privileges/MonthlyBarChart";
import { TrendLineChart } from "@/components/privileges/TrendLineChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function PrivilegesPage() {
  const supabase = await createServerSupabaseClient();
  const [{ data }, { data: events }, { data: members }, { data: types }] = await Promise.all([
    supabase
      .from("privilege_records")
      .select("quantity, recorded_at, privilege_type_id, profiles!privilege_records_member_id_fkey(name), privilege_types(name)")
      .order("recorded_at", { ascending: false })
      .limit(200),
    supabase.from("events").select("id,title").order("start_at", { ascending: false }).limit(50),
    supabase.from("profiles").select("id,name").eq("role", "member").order("name"),
    supabase.from("privilege_types").select("id,name,unit_price").eq("is_active", true).order("created_at"),
  ]);
  const records = (data ?? []) as unknown as Array<{
    quantity: number;
    recorded_at: string;
    profiles: { name: string } | null;
    privilege_types: { name: string } | null;
  }>;

  const typeNames = [...new Set(records.map((record) => record.privilege_types?.name ?? "기타"))];
  const byMember = new Map<string, Record<string, string | number>>();

  for (const record of records) {
    const member = record.profiles?.name ?? "멤버";
    const type = record.privilege_types?.name ?? "기타";
    const row = byMember.get(member) ?? { name: member };
    row[type] = Number(row[type] ?? 0) + record.quantity;
    byMember.set(member, row);
  }

  const trendData = records.slice(0, 12).reverse().map((record) => ({
    month: record.recorded_at.slice(5, 10),
    total: record.quantity,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-white">특전 현황</h1>
        <p className="mt-1 text-sm text-zinc-400">특전 종류와 멤버별 수량을 등록하고 확인합니다.</p>
      </div>
      <PrivilegeTypeCreateForm />
      <PrivilegeRecordCreateForm
        events={(events ?? []).map((event) => ({ id: event.id, name: event.title }))}
        members={members ?? []}
        types={types ?? []}
      />
      {records.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <MonthlyBarChart data={[...byMember.values()]} keys={typeNames} />
          <TrendLineChart data={trendData} />
        </div>
      ) : (
        <EmptyState title="특전 기록이 없습니다" description="위 등록 영역에서 이벤트, 멤버, 특전 수량을 입력하세요." />
      )}
    </div>
  );
}
