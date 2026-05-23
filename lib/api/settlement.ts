import { monthRange } from "@/lib/utils";
import type { SettlementMemberSummary } from "@/lib/types";

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => QueryBuilder;
  };
};

type QueryResult<T> = { data: T[] | null; error: Error | null };

type QueryBuilder = PromiseLike<QueryResult<SettlementRecord | SettlementRate>> & {
  eq: (column: string, value: string) => QueryBuilder;
  gte: (column: string, value: string) => QueryBuilder;
  lt: (column: string, value: string) => QueryBuilder;
  lte: (column: string, value: string) => QueryBuilder;
  or: (filters: string) => QueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder;
};

type SettlementRecord = {
  member_id: string;
  quantity: number;
  privilege_types: { id: string; name: string; unit_price: number | string | null } | Array<{ id: string; name: string; unit_price: number | string | null }> | null;
  members: { name: string } | Array<{ name: string }> | null;
  events: { title: string; start_at: string; group_id: string | null; groups: { name: string } | Array<{ name: string }> | null } | Array<{ title: string; start_at: string; group_id: string | null; groups: { name: string } | Array<{ name: string }> | null }> | null;
};

type SettlementRate = {
  member_id: string;
  privilege_type_id: string;
  rate: number | string;
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
      "member_id,quantity,privilege_types(id,name,unit_price),members!privilege_records_member_id_fkey(name),events!inner(title,start_at,group_id,workspace_id,groups(name))",
    )
    .gte("events.start_at", start)
    .lt("events.start_at", end);

  if (workspaceId) {
    recordQuery = recordQuery.eq("events.workspace_id", workspaceId);
  }

  const { data: recordRows, error } = await recordQuery;
  const records = recordRows as SettlementRecord[] | null;
  if (error) throw error;

  let rateQuery = supabase
    .from("settlement_rates")
    .select("member_id,privilege_type_id,rate,valid_from,valid_until,workspace_id")
    .lte("valid_from", `${month}-31`)
    .or(`valid_until.is.null,valid_until.gte.${month}-01`)
    .order("valid_from", { ascending: false });

  if (workspaceId) {
    rateQuery = rateQuery.eq("workspace_id", workspaceId);
  }

  const { data: rateRows, error: ratesError } = await rateQuery;
  const rates = rateRows as SettlementRate[] | null;
  if (ratesError) throw ratesError;

  const grouped = new Map<string, SettlementMemberSummary>();

  for (const record of records ?? []) {
    const privilege = Array.isArray(record.privilege_types)
      ? record.privilege_types[0]
      : record.privilege_types;
    const profile = Array.isArray(record.members) ? record.members[0] : record.members;
    const event = Array.isArray(record.events) ? record.events[0] : record.events;
    const group = Array.isArray(event?.groups) ? event?.groups[0] : event?.groups;
    const rate = (rates ?? []).find(
      (candidate) =>
        candidate.member_id === record.member_id &&
        candidate.privilege_type_id === privilege?.id,
    )?.rate;

    const unitPrice = Number(privilege?.unit_price ?? 0);
    const numericRate = Number(rate ?? 0);
    const amount = Number(record.quantity ?? 0) * unitPrice * numericRate;

    if (!grouped.has(record.member_id)) {
      grouped.set(record.member_id, {
        member_id: record.member_id,
        member_name: profile?.name ?? "Unknown",
        group_name: group?.name ?? "-",
        breakdown: [],
        total: 0,
      });
    }

    const summary = grouped.get(record.member_id)!;
    summary.breakdown.push({
      privilege_type: privilege?.name ?? "Unknown",
      event_name: event?.title ?? "-",
      event_date: event?.start_at?.slice(0, 10) ?? "-",
      quantity: Number(record.quantity ?? 0),
      unit_price: unitPrice,
      rate: numericRate,
      amount,
    });
    summary.total += amount;
  }

  return [...grouped.values()];
}
