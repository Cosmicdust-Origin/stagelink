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
  const [{ data: group }, { data: members }, { data: events }, { data: profile }] = await Promise.all([
    supabase.from("groups").select("*").eq("id", groupId).single(),
    supabase.from("group_members").select("*, members(id,name)").eq("group_id", groupId),
    supabase.from("events").select("*").eq("group_id", groupId).order("start_at", { ascending: false }).limit(5),
    user ? supabase.from("profiles").select("role").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);
  const canEdit = profile?.role === "admin" || profile?.role === "manager";

  // Current month range
  const now = new Date();
  const monthStr = now.toISOString().slice(0, 7);
  const [year, mon] = monthStr.split("-").map(Number);
  const rangeStart = `${monthStr}-01`;
  const rangeEnd = new Date(year, mon, 1).toISOString().slice(0, 10);

  // Fetch this month's privilege records for the group's members
  const memberIds = (members ?? []).map((m) => m.member_id).filter(Boolean);
  const { data: rawRecords } = memberIds.length
    ? await supabase
        .from("privilege_records")
        .select("quantity, recorded_at, member_id, members!privilege_records_member_id_fkey(name), privilege_types(name), events(start_at)")
        .in("member_id", memberIds)
    : { data: [] as unknown[] };

  type PrivRow = {
    quantity: number;
    recorded_at: string;
    members: { name: string } | null;
    privilege_types: { name: string } | null;
    events: { start_at: string } | null;
  };

  const monthRecords = ((rawRecords ?? []) as unknown as PrivRow[]).filter((r) => {
    const date = r.events?.start_at ?? r.recorded_at;
    return date >= rangeStart && date < rangeEnd;
  });

  // Build chart: member on X-axis, stacked by privilege type name
  const typeNames = [...new Set(monthRecords.map((r) => r.privilege_types?.name ?? "기타"))];
  const memberMap = new Map<string, Record<string, string | number>>();
  for (const m of members ?? []) {
    const name = (m.members as { name?: string } | null)?.name ?? "멤버";
    memberMap.set(name, { name });
  }
  for (const r of monthRecords) {
    const memberName = r.members?.name ?? "멤버";
    const typeName = r.privilege_types?.name ?? "기타";
    const row = memberMap.get(memberName) ?? { name: memberName };
    row[typeName] = Number(row[typeName] ?? 0) + r.quantity;
    memberMap.set(memberName, row);
  }

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
            initialPrivilegeUnitPrice={group.privilege_unit_price != null ? String(group.privilege_unit_price) : ""}
          />
        ) : null}
      </section>
      <MemberManager groupId={groupId} members={members ?? []} canEdit={canEdit} />
      <section className="grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-semibold text-white">최근 일정</h2>
          <div className="space-y-2">
            {events?.map((event) => (
              <Link key={event.id} href={`/calendar/${event.id}`} className="block rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300">
                {event.title}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 font-semibold text-white">{year}년 {mon}월 특전 요약</h2>
          <MonthlyBarChart
            title={`${year}년 ${mon}월 특전 요약`}
            data={[...memberMap.values()]}
            keys={typeNames.length ? typeNames : ["특전"]}
          />
        </div>
      </section>
    </div>
  );
}
