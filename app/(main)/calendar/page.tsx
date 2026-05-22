import { CalendarView } from "@/components/calendar/CalendarView";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function CalendarPage() {
  const supabase = await createServerSupabaseClient();
  const { data: events } = await supabase
    .from("events")
    .select("id,title,event_type,group_id,venue,start_at,end_at")
    .order("start_at");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">캘린더</h1>
        <p className="mt-1 text-sm text-zinc-400">라이브, 리허설, 촬영, 미팅 일정을 한 화면에서 확인합니다.</p>
      </div>
      <CalendarView events={events ?? []} />
    </div>
  );
}
