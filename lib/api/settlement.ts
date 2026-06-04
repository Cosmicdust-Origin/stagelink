import { monthRange } from "@/lib/utils";
import type { SettlementMemberSummary } from "@/lib/types";

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => QueryBuilder;
  };
};

type QueryResult<T> = { data: T[] | null; error: Error | null };

type QueryBuilder = PromiseLike<QueryResult<SettlementRecord | SettlementRate | GroupMemberRow>> & {
  eq: (column: string, value: string) => QueryBuilder;
  gte: (column: string, value: string) => QueryBuilder;
  lt: (column: string, value: string) => QueryBuilder;
  lte: (column: string, value: string) => QueryBuilder;
  or: (filters: string) => QueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder;
};

type PrivilegeTypeRef = {
  id: string;
  name: string;
};

type EventGroupRef = {
  group_id: string;
  groups: { name: string } | { name: string }[] | null;
};

type GroupRef = {
  id: string;
  name: string;
};

type GroupMemberRow = {
  member_id: string;
  group_id: string;
  groups: GroupRef | GroupRef[] | null;
};

type SettlementRecord = {
  id: string;
  settled_at: string | null;
  member_id: string;
  quantity: number;
  privilege_types: PrivilegeTypeRef | PrivilegeTypeRef[] | null;
  members: { name: string } | Array<{ name: string }> | null;
  events: {
    title: string;
    start_at: string;
    group_id: string | null;
    workspace_id: string;
    groups: { name: string } | { name: string }[] | null;
    event_groups: EventGroupRef[] | null;
  } | Array<{
    title: string;
    start_at: string;
    group_id: string | null;
    workspace_id: string;
    groups: { name: string } | { name: string }[] | null;
    event_groups: EventGroupRef[] | null;
  }> | null;
};

type SettlementRate = {
  member_id: string;
  privilege_type_id: string;
  unit_price: number | string | null; // 멤버별 장당 정산액 (절대값)
};

export async function getSettlementSummary(
  supabase: SupabaseLike,
  month: string,
  workspaceId?: string,
): Promise<SettlementMemberSummary[]> {
  const { start, end } = monthRange(month);

  let recordQuery = supabase
    .from("privilege_records")
    .select(
      "id,settled_at,member_id,quantity,privilege_types(id,name),members!privilege_records_member_id_fkey(name),events(title,start_at,group_id,workspace_id,groups(name),event_groups(group_id,groups(name)))",
    );

  if (workspaceId) {
    recordQuery = recordQuery.eq("events.workspace_id", workspaceId);
  }

  const { data: recordRows, error } = await recordQuery;
  if (error) throw error;

  // 날짜 필터는 클라이언트에서 처리 (PostgREST 임베디드 필터 우회)
  const startDate = start.slice(0, 10);
  const endDate = end.slice(0, 10);
  const records = ((recordRows as SettlementRecord[] | null) ?? []).filter((r) => {
    const event = Array.isArray(r.events) ? r.events[0] : r.events;
    if (!event) return false;
    const d = event.start_at?.slice(0, 10) ?? "";
    return d >= startDate && d < endDate;
  });

  let groupMemberQuery = supabase
    .from("group_members")
    .select("member_id,group_id,groups!inner(id,name,workspace_id)");

  if (workspaceId) {
    groupMemberQuery = groupMemberQuery.eq("groups.workspace_id", workspaceId);
  }

  const { data: groupMemberRows, error: groupMembersError } = await groupMemberQuery;
  if (groupMembersError) throw groupMembersError;

  const memberGroups = new Map<string, GroupRef[]>();
  for (const row of (groupMemberRows as GroupMemberRow[] | null) ?? []) {
    const group = Array.isArray(row.groups) ? row.groups[0] : row.groups;
    if (!group) continue;

    const list = memberGroups.get(row.member_id) ?? [];
    list.push({ id: row.group_id, name: group.name });
    memberGroups.set(row.member_id, list);
  }

  // 멤버별 장당 정산액 조회 (시간 필터 없음 — 현재 단가 기준)
  let rateQuery = supabase
    .from("settlement_rates")
    .select("member_id,privilege_type_id,unit_price");

  if (workspaceId) {
    rateQuery = rateQuery.eq("workspace_id", workspaceId);
  }

  const { data: rateRows, error: ratesError } = await rateQuery;
  const rates = rateRows as SettlementRate[] | null;
  if (ratesError) throw ratesError;

  const grouped = new Map<string, SettlementMemberSummary>();

  for (const record of records) {
    const privilege = Array.isArray(record.privilege_types)
      ? record.privilege_types[0]
      : record.privilege_types;
    const profile = Array.isArray(record.members) ? record.members[0] : record.members;
    const event = Array.isArray(record.events) ? record.events[0] : record.events;
    const eventGroups = Array.isArray(event?.event_groups) ? event.event_groups : event?.event_groups ? [event.event_groups] : [];
    const memberGroupList = memberGroups.get(record.member_id) ?? [];
    const matchedMemberGroup = memberGroupList.find((memberGroup) =>
      eventGroups.some((eventGroup) => eventGroup.group_id === memberGroup.id),
    );
    const fallbackEventGroup = eventGroups[0];
    const fallbackEventGroupName = Array.isArray(fallbackEventGroup?.groups)
      ? fallbackEventGroup?.groups[0]?.name
      : fallbackEventGroup?.groups?.name;
    const fallbackLegacyGroup = Array.isArray(event?.groups) ? event?.groups[0] : event?.groups;
    const groupId = matchedMemberGroup?.id ?? fallbackEventGroup?.group_id ?? event?.group_id ?? memberGroupList[0]?.id ?? null;
    const groupName = matchedMemberGroup?.name ?? fallbackEventGroupName ?? fallbackLegacyGroup?.name ?? memberGroupList[0]?.name ?? "-";

    // 해당 멤버+특전 유형의 장당 정산액 조회
    const rateEntry = (rates ?? []).find(
      (c) => c.member_id === record.member_id && c.privilege_type_id === privilege?.id,
    );

    const qty = Number(record.quantity ?? 0);
    const unitPrice = Number(rateEntry?.unit_price ?? 0);
    const amount = qty * unitPrice;

    const summaryKey = `${record.member_id}:${groupId ?? "none"}`;

    if (!grouped.has(summaryKey)) {
      grouped.set(summaryKey, {
        member_id: record.member_id,
        group_id: groupId,
        member_name: profile?.name ?? "Unknown",
        group_name: groupName,
        breakdown: [],
        total: 0,
        paid: 0,
        unpaid: 0,
      });
    }

    const summary = grouped.get(summaryKey)!;
    summary.breakdown.push({
      record_id: record.id,
      privilege_type: privilege?.name ?? "Unknown",
      event_name: event?.title ?? "-",
      event_date: event?.start_at?.slice(0, 10) ?? "-",
      quantity: qty,
      unit_price: unitPrice,
      amount,
      settled_at: record.settled_at ?? null,
    });
    summary.total += amount;
    if (record.settled_at) {
      summary.paid += amount;
    } else {
      summary.unpaid += amount;
    }
  }

  return [...grouped.values()];
}
