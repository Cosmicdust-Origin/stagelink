import { EventCreateForm } from "@/components/calendar/EventCreateForm";
import { CalendarView } from "@/components/calendar/CalendarView";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";

export default async function CalendarPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const wsId = user ? await getWorkspaceId(supabase, user.id) : null;

  const [{ data: events }, { data: groups }, { data: profile }] =
    await Promise.all([
      wsId
        ? supabase
            .from("events")
            .select("id,title,event_type,group_id,venue,start_at,end_at")
            .eq("workspace_id", wsId)
            .order("start_at")
        : Promise.resolve({ data: [] }),
      wsId
        ? supabase.from("groups").select("id,name").eq("workspace_id", wsId).order("name")
        : Promise.resolve({ data: [] }),
      user
        ? supabase.from("profiles").select("role").eq("id", user.id).single()
        : Promise.resolve({ data: null }),
    ]);
  const canEdit = profile?.role === "admin" || profile?.role === "manager";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">캘린더</h1>
        <p className="mt-1 text-sm text-zinc-400">
          라이브, 리허설, 촬영, 미팅 일정을 만들고 확인합니다.
        </p>
      </div>
      {canEdit ? (
        <EventCreateForm groups={groups ?? []} />
      ) : null}
      <CalendarView events={events ?? []} />
    </div>
  );
}
