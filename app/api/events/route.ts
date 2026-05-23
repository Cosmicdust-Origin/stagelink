import { monthRange } from "@/lib/utils";
import { handleApiError, json, parseJson, requireRole, requireUser } from "@/lib/api/auth";
import { getWorkspaceId } from "@/lib/workspace";

type EventBody = {
  title: string;
  event_type?: string;
  group_id?: string | null;
  group_ids?: string[];       // 다중 그룹 (event_groups 테이블)
  venue?: string;
  start_at: string;
  end_at: string;
  manager_id?: string | null;
  memo?: string;
  checklist_template_ids?: string[];
};

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const wsId = await getWorkspaceId(supabase, user.id);
    if (!wsId) return json({ events: [] });

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const groupId = searchParams.get("group_id");

    let query = supabase
      .from("events")
      .select("id,title,event_type,group_id,venue,start_at,end_at")
      .eq("workspace_id", wsId)
      .order("start_at");

    if (month) {
      const { start, end } = monthRange(month);
      query = query.gte("start_at", start).lt("start_at", end);
    }
    if (groupId) query = query.eq("group_id", groupId);

    const { data, error } = await query;
    if (error) throw error;
    return json({ events: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireRole(["admin", "manager"]);
    const wsId = await getWorkspaceId(supabase, user.id);
    if (!wsId) return json({ error: "워크스페이스 없음" }, 400);

    const body = await parseJson<EventBody>(request);
    const { checklist_template_ids: checklistTemplateIds, group_ids: groupIds, ...eventPayload } = body;

    const { data: event, error } = await supabase
      .from("events")
      .insert({ ...eventPayload, created_by: user.id, workspace_id: wsId })
      .select("*")
      .single();
    if (error) throw error;

    // event_groups 에 다중 그룹 연결 (마이그레이션 012 적용 후 동작)
    if (groupIds && groupIds.length > 0) {
      const { error: egErr } = await supabase
        .from("event_groups")
        .insert(groupIds.map((gid) => ({ event_id: event.id, group_id: gid })));
      if (egErr) {
        // 테이블 미존재 등 마이그레이션 미적용 시 이벤트 생성은 유지하고 경고만 반환
        console.warn("[event_groups insert failed]", egErr.message);
        return json({ event, warning: "그룹 연결 실패 — 마이그레이션 012 실행 필요" }, 201);
      }
    }

    if (checklistTemplateIds?.length) {
      const { data: templates, error: templateError } = await supabase
        .from("checklist_templates")
        .select("label")
        .in("id", checklistTemplateIds);
      if (templateError) throw templateError;

      const { error: checklistError } = await supabase.from("event_checklists").insert(
        (templates ?? []).map((template, index) => ({
          event_id: event.id,
          label: template.label,
          sort_order: index,
        })),
      );
      if (checklistError) throw checklistError;
    }

    return json({ event }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
