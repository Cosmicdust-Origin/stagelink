import { PrivilegeInputTable } from "@/components/calendar/PrivilegeInputTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

type Params = { params: Promise<{ eventId: string }> };

export default async function EventDetailPage({ params }: Params) {
  const { eventId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: event }, { data: checklist }, { data: timetable }, { data: types }, { data: records }, { data: members }, { data: profile }] =
    await Promise.all([
      supabase.from("events").select("*, groups(name), profiles!events_manager_id_fkey(name)").eq("id", eventId).single(),
      supabase.from("event_checklists").select("*").eq("event_id", eventId).order("sort_order"),
      supabase.from("timetable_entries").select("*, groups(name)").eq("event_id", eventId).order("sort_order"),
      supabase.from("privilege_types").select("*").eq("is_active", true).order("created_at"),
      supabase.from("privilege_records").select("*").eq("event_id", eventId),
      supabase.from("profiles").select("*").eq("role", "member").order("name"),
      user ? supabase.from("profiles").select("role").eq("id", user.id).single() : Promise.resolve({ data: null }),
    ]);

  const canEdit = profile?.role === "admin" || profile?.role === "manager";

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <p className="text-sm text-zinc-400">{event?.groups?.name ?? "전체"} · {event?.venue ?? "장소 미정"}</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">{event?.title ?? "이벤트"}</h1>
        {event ? <p className="mt-2 text-sm text-zinc-400">{formatDate(event.start_at)} - {formatDate(event.end_at)}</p> : null}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <h2 className="font-semibold text-white">체크리스트</h2>
          <div className="mt-3 space-y-2">
            {checklist?.length ? checklist.map((item) => <div key={item.id} className="flex items-center gap-2 text-sm text-zinc-300"><span className={item.is_checked ? "text-[#27AE60]" : "text-zinc-500"}>{item.is_checked ? "완료" : "대기"}</span>{item.label}</div>) : <EmptyState title="체크리스트가 없습니다" />}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <h2 className="font-semibold text-white">타임테이블</h2>
          <div className="mt-3 space-y-2">
            {timetable?.length ? timetable.map((entry) => <div key={entry.id} className="flex justify-between rounded-md bg-white/[0.04] px-3 py-2 text-sm text-zinc-300"><span>{entry.start_time}</span><span>{entry.groups?.name ?? "전체"} · {entry.set_count ?? "-"}세트</span></div>) : <EmptyState title="타임테이블이 없습니다" />}
          </div>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold text-white">특전 수량</h2>
        <PrivilegeInputTable eventId={eventId} members={members ?? []} privilegeTypes={types ?? []} records={records ?? []} canEdit={canEdit} currentUserId={user?.id ?? ""} />
      </section>
    </div>
  );
}
