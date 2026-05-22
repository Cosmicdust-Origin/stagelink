import { ChecklistPanel } from "@/components/calendar/ChecklistPanel";
import { EventActions } from "@/components/calendar/EventActions";
import { PrivilegeInputTable } from "@/components/calendar/PrivilegeInputTable";
import { TimetablePanel } from "@/components/calendar/TimetablePanel";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

type Params = { params: Promise<{ eventId: string }> };

export default async function EventDetailPage({ params }: Params) {
  const { eventId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: event }, { data: checklist }, { data: timetable }, { data: types }, { data: records }, { data: members }, { data: profile }, { data: groups }] =
    await Promise.all([
      supabase.from("events").select("*, groups(name), profiles!events_manager_id_fkey(name)").eq("id", eventId).single(),
      supabase.from("event_checklists").select("*").eq("event_id", eventId).order("sort_order"),
      supabase.from("timetable_entries").select("*, groups(name)").eq("event_id", eventId).order("sort_order"),
      supabase.from("privilege_types").select("*").eq("is_active", true).order("created_at"),
      supabase.from("privilege_records").select("*").eq("event_id", eventId),
      supabase.from("profiles").select("*").eq("role", "member").order("name"),
      user ? supabase.from("profiles").select("role").eq("id", user.id).single() : Promise.resolve({ data: null }),
      supabase.from("groups").select("id,name").order("name"),
    ]);

  const canEdit = profile?.role === "admin" || profile?.role === "manager";

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <p className="text-sm text-zinc-400">{event?.groups?.name ?? "전체"} · {event?.venue ?? "장소 미정"}</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">{event?.title ?? "이벤트"}</h1>
        {event ? <p className="mt-2 text-sm text-zinc-400">{formatDate(event.start_at)} - {formatDate(event.end_at)}</p> : null}
        {canEdit && event ? <EventActions eventId={eventId} initialTitle={event.title} initialVenue={event.venue ?? ""} initialMemo={event.memo ?? ""} /> : null}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <ChecklistPanel eventId={eventId} items={checklist ?? []} canEdit={canEdit} />
        <TimetablePanel eventId={eventId} entries={timetable ?? []} groups={groups ?? []} canEdit={canEdit} />
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold text-white">특전 수량</h2>
        <PrivilegeInputTable eventId={eventId} members={members ?? []} privilegeTypes={types ?? []} records={records ?? []} canEdit={canEdit} currentUserId={user?.id ?? ""} />
      </section>
    </div>
  );
}
