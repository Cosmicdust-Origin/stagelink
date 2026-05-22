import { monthRange } from "@/lib/utils";
import { handleApiError, json, requireUser } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    const { supabase, user, profile } = await requireUser();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const memberId = searchParams.get("member_id");
    const groupId = searchParams.get("group_id");

    let query = supabase
      .from("privilege_records")
      .select("*, privilege_types(name,category), events!inner(start_at,group_id,title), profiles!privilege_records_member_id_fkey(name)")
      .order("recorded_at", { ascending: false });

    if (month) {
      const { start, end } = monthRange(month);
      query = query.gte("events.start_at", start).lt("events.start_at", end);
    }
    if (groupId) query = query.eq("events.group_id", groupId);
    if (memberId) query = query.eq("member_id", memberId);
    if (profile.role === "member") query = query.eq("member_id", user.id);

    const { data, error } = await query;
    if (error) throw error;

    const totalByType = (data ?? []).reduce<Record<string, number>>((acc, record) => {
      acc[record.privilege_type_id] = (acc[record.privilege_type_id] ?? 0) + record.quantity;
      return acc;
    }, {});

    return json({ records: data ?? [], total_by_type: totalByType });
  } catch (error) {
    return handleApiError(error);
  }
}
