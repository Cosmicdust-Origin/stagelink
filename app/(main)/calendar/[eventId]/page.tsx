import { ChecklistPanel } from "@/components/calendar/ChecklistPanel";
import { EventActions } from "@/components/calendar/EventActions";
import { PrivilegeInputTable } from "@/components/calendar/PrivilegeInputTable";
import { TimetablePanel } from "@/components/calendar/TimetablePanel";
import { canOperate } from "@/lib/rbac";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { getWorkspaceId } from "@/lib/workspace";

type Params = { params: Promise<{ eventId: string }> };

export default async function EventDetailPage({ params }: Params) {
  const { eventId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const workspaceId = user ? await getWorkspaceId(supabase, user.id) : null;

  const [
    { data: event },
    { data: checklist },
    { data: timetable },
    { data: types },
    { data: records },
    { data: members },
    { data: profile },
    { data: groups },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("*, event_groups(group_id, groups(name))")
      .eq("id", eventId)
      .eq("workspace_id", workspaceId)
      .single(),
    supabase.from("event_checklists").select("*").eq("event_id", eventId).order("sort_order"),
    supabase.from("timetable_entries").select("id,start_time,end_time,group_id,note,sort_order,groups(name)").eq("event_id", eventId).order("sort_order"),
    supabase.from("privilege_types").select("*").eq("workspace_id", workspaceId).eq("is_active", true).order("created_at"),
    supabase.from("privilege_records").select("*").eq("event_id", eventId),
    supabase.from("profiles").select("*").eq("role", "member").order("name"),
    user ? supabase.from("profiles").select("role").eq("id", user.id).single() : Promise.resolve({ data: null }),
    supabase.from("groups").select("id,name").eq("workspace_id", workspaceId).order("name"),
  ]);

  const canEdit = canOperate(profile?.role);
  const managerName = event?.on_site_manager as string | null | undefined;

  // event_groups에서 그룹 목록 추출
  const eventGroupRows = (event?.event_groups ?? []) as Array<{
    group_id: string;
    groups: { name: string } | { name: string }[] | null;
  }>;
  const linkedGroupIds = eventGroupRows.map((eg) => eg.group_id);
  const linkedGroupNames = eventGroupRows
    .map((eg) => (Array.isArray(eg.groups) ? eg.groups[0]?.name : eg.groups?.name))
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <p className="text-sm text-zinc-400">
          {linkedGroupNames || "전체"} · {event?.venue ?? "장소 미정"}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-white">{event?.title ?? "이벤트"}</h1>
          {managerName ? (
            <span className="rounded border border-[#E8457A]/40 bg-[#E8457A]/10 px-2 py-1 text-xs font-medium text-[#ff8eb3]">
              현장 담당자: {managerName}
            </span>
          ) : null}
        </div>
        {event ? <p className="mt-2 text-sm text-zinc-400">{formatDate(event.start_at)} - {formatDate(event.end_at)}</p> : null}
        {canEdit && event ? (
          <EventActions
            eventId={eventId}
            initialTitle={event.title}
            initialVenue={event.venue ?? ""}
            initialMemo={event.memo ?? ""}
            initialOnSiteManager={(event.on_site_manager as string | null) ?? ""}
            initialGroupIds={linkedGroupIds}
            groups={groups ?? []}
          />
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChecklistPanel eventId={eventId} items={checklist ?? []} canEdit={canEdit} />
        <TimetablePanel eventId={eventId} entries={timetable ?? []} groups={groups ?? []} canEdit={canEdit} />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-white">특전 수량</h2>
        <PrivilegeInputTable
          eventId={eventId}
          members={members ?? []}
          privilegeTypes={types ?? []}
          records={records ?? []}
          canEdit={canEdit}
          currentUserId={user?.id ?? ""}
        />
      </section>
    </div>
  );
}
