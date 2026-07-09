import { MonthFilter } from "@/components/privileges/MonthFilter";
import { PrivilegeFilters } from "@/components/privileges/PrivilegeFilters";
import { PrivilegeRecordCreateForm } from "@/components/privileges/PrivilegeForms";
import { PrivilegeRecordsList } from "@/components/privileges/PrivilegeRecordsList";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { MonthlyBarChart } from "@/components/privileges/MonthlyBarChart";
import { TrendLineChart } from "@/components/privileges/TrendLineChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";
import type { PrivilegeRecordRow } from "@/components/privileges/PrivilegeRecordsList";

type Props = { searchParams: Promise<{ month?: string; event_id?: string; group_id?: string }> };

type GroupRef = { id: string; name: string };
type EventGroupRef = { group_id: string; groups: GroupRef | GroupRef[] | null };

type RawRecord = {
  id: string;
  quantity: number;
  recorded_at: string;
  member_id: string;
  members: { name: string } | { name: string }[] | null;
  privilege_types: { name: string } | { name: string }[] | null;
  events:
    | {
        id: string;
        start_at: string;
        title: string;
        group_id: string | null;
        groups: { name: string } | { name: string }[] | null;
        event_groups: EventGroupRef[] | null;
      }
    | Array<{
        id: string;
        start_at: string;
        title: string;
        group_id: string | null;
        groups: { name: string } | { name: string }[] | null;
        event_groups: EventGroupRef[] | null;
      }>
    | null;
};

type GroupMemberRow = {
  member_id: string;
  group_id: string;
  groups: GroupRef | GroupRef[] | null;
};

type AnnotatedRecord = RawRecord & {
  event_id: string;
  event_title: string;
  event_date: string;
  member_name: string;
  privilege_type: string;
  group_id: string | null;
  group_name: string;
};

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function uniqueOptions(options: Array<{ id: string | null; name: string }>) {
  const seen = new Set<string>();
  return options
    .filter((option): option is { id: string; name: string } => Boolean(option.id))
    .filter((option) => {
      if (seen.has(option.id)) return false;
      seen.add(option.id);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export default async function PrivilegesPage({ searchParams }: Props) {
  const { month, event_id: selectedEventId = "", group_id: selectedGroupId = "" } = await searchParams;
  const selectedMonth = month ?? new Date().toISOString().slice(0, 7);
  const [year, mon] = selectedMonth.split("-").map(Number);
  const rangeStart = `${selectedMonth}-01`;
  const rangeEnd = new Date(year, mon, 1).toISOString().slice(0, 10);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const wsId = user ? await getWorkspaceId(supabase, user.id) : null;

  const [{ data }, { data: events }, { data: members }, { data: types }, { data: groupMembers }] = await Promise.all([
    wsId
      ? supabase
          .from("privilege_records")
          .select(
            "id, quantity, recorded_at, member_id, members!privilege_records_member_id_fkey(name), privilege_types(name), events(id,start_at,title,group_id,groups(name),workspace_id,event_groups(group_id,groups(id,name)))",
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
          .select("id,name,category,unit_price")
          .eq("workspace_id", wsId)
          .eq("is_active", true)
          .order("created_at")
      : Promise.resolve({ data: [] }),
    wsId
      ? supabase
          .from("group_members")
          .select("member_id,group_id,groups!inner(id,name,workspace_id)")
          .eq("groups.workspace_id", wsId)
      : Promise.resolve({ data: [] }),
  ]);

  const memberGroups = new Map<string, GroupRef[]>();
  const memberNameById = new Map((members ?? []).map((member) => [member.id, member.name]));
  const membersByGroupId = new Map<string, Set<string>>();
  for (const row of ((groupMembers ?? []) as unknown as GroupMemberRow[])) {
    const group = first(row.groups);
    if (!group) continue;

    const list = memberGroups.get(row.member_id) ?? [];
    list.push({ id: row.group_id, name: group.name });
    memberGroups.set(row.member_id, list);

    const memberName = memberNameById.get(row.member_id);
    if (!memberName) continue;
    const groupMemberNames = membersByGroupId.get(row.group_id) ?? new Set<string>();
    groupMemberNames.add(memberName);
    membersByGroupId.set(row.group_id, groupMemberNames);
  }

  const allRecords = ((data ?? []) as unknown as RawRecord[]).filter((record) => {
    const event = first(record.events);
    const eventDate = event?.start_at ?? record.recorded_at;
    return eventDate >= rangeStart && eventDate < rangeEnd;
  });

  const annotatedRecords: AnnotatedRecord[] = allRecords.map((record) => {
    const event = first(record.events);
    const member = first(record.members);
    const privilegeType = first(record.privilege_types);
    const eventGroups = event?.event_groups ?? [];
    const memberGroupList = memberGroups.get(record.member_id) ?? [];
    const matchedMemberGroup = memberGroupList.find((memberGroup) =>
      eventGroups.some((eventGroup) => eventGroup.group_id === memberGroup.id),
    );
    const fallbackEventGroup = eventGroups[0];
    const fallbackEventGroupName = first(fallbackEventGroup?.groups)?.name;
    const fallbackLegacyGroup = first(event?.groups);
    const groupId = matchedMemberGroup?.id ?? fallbackEventGroup?.group_id ?? event?.group_id ?? memberGroupList[0]?.id ?? null;
    const groupName = matchedMemberGroup?.name ?? fallbackEventGroupName ?? fallbackLegacyGroup?.name ?? memberGroupList[0]?.name ?? "-";

    return {
      ...record,
      event_id: event?.id ?? "",
      event_title: event?.title ?? "-",
      event_date: event?.start_at?.slice(0, 10) ?? record.recorded_at.slice(0, 10),
      member_name: member?.name ?? "멤버",
      privilege_type: privilegeType?.name ?? "특전",
      group_id: groupId,
      group_name: groupName,
    };
  });

  const eventOptions = uniqueOptions(annotatedRecords.map((record) => ({ id: record.event_id, name: record.event_title })));
  const groupOptions = uniqueOptions(annotatedRecords.map((record) => ({ id: record.group_id, name: record.group_name })));

  const records = annotatedRecords.filter((record) => {
    if (selectedEventId && record.event_id !== selectedEventId) return false;
    if (selectedGroupId && record.group_id !== selectedGroupId) return false;
    return true;
  });

  const typeNames = [...new Set(records.map((record) => record.privilege_type))];
  const byMember = new Map<string, Record<string, string | number>>();
  for (const record of records) {
    const row = byMember.get(record.member_name) ?? { name: record.member_name };
    row[record.privilege_type] = Number(row[record.privilege_type] ?? 0) + record.quantity;
    byMember.set(record.member_name, row);
  }

  const memberNames = [...new Set(records.map((record) => record.member_name))];
  const trendMemberNames = new Set(memberNames);
  const dailyMap = new Map<string, Record<string, string | number>>();
  for (const record of records) {
    const day = record.event_date.slice(5, 10);
    const row = dailyMap.get(day) ?? { date: day };
    const targetMemberNames = record.group_id ? membersByGroupId.get(record.group_id) : null;

    for (const memberName of targetMemberNames ?? [record.member_name]) {
      if (row[memberName] == null) row[memberName] = 0;
      trendMemberNames.add(memberName);
    }

    row[record.member_name] = Number(row[record.member_name] ?? 0) + record.quantity;
    dailyMap.set(day, row);
  }
  const trendData = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, row]) => row);

  const recordRows: PrivilegeRecordRow[] = records.map((record) => ({
    id: record.id,
    quantity: record.quantity,
    event_id: record.event_id,
    event_title: record.event_title,
    event_date: record.event_date,
    group_name: record.group_name,
    member_name: record.member_name,
    privilege_type: record.privilege_type,
  }));

  const monthLabel = `${year}년 ${mon}월`;
  const hasData = records.length > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">특전 현황</h1>
          <p className="mt-1 text-sm text-zinc-400">멤버별 특전 수량을 등록하고 확인합니다.</p>
        </div>
        <MonthFilter value={selectedMonth} />
      </div>

      <CollapsibleSection label="수량 등록" defaultOpen>
        <PrivilegeRecordCreateForm
          events={(events ?? []).map((event) => ({ id: event.id, name: event.title }))}
          members={members ?? []}
          types={types ?? []}
        />
      </CollapsibleSection>

      <PrivilegeFilters
        month={selectedMonth}
        eventId={selectedEventId}
        groupId={selectedGroupId}
        events={eventOptions}
        groups={groupOptions}
      />

      {hasData ? (
        <>
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
              keys={[...trendMemberNames]}
              data={
                trendData.length
                  ? trendData
                  : [{ date: "-", ...Object.fromEntries([...trendMemberNames].map((member) => [member, 0])) }]
              }
            />
          </div>

          <CollapsibleSection label={`${monthLabel} 등록 기록 (${records.length}건)`} defaultOpen>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="mb-3 text-xs text-zinc-500">
                공연별로 묶어 표시합니다. 수량 셀을 클릭해 직접 수정하고 Enter 또는 포커스 이동 시 저장됩니다.
              </p>
              <PrivilegeRecordsList records={recordRows} />
            </div>
          </CollapsibleSection>
        </>
      ) : (
        <EmptyState
          title={`${monthLabel} 특전 기록이 없습니다`}
          description="조회 월, 공연, 그룹 필터를 변경하거나 수량 등록 영역에서 수량을 입력하세요."
        />
      )}
    </div>
  );
}
