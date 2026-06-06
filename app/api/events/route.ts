import { monthRange } from "@/lib/utils";
import {
  ApiError,
  handleApiError,
  json,
  parseJson,
  pickAllowed,
  requireRoleWithWorkspace,
  requireWorkspace,
} from "@/lib/api/auth";
import { optionalMonth, optionalUuid, requireDateString } from "@/lib/api/validation";

type EventBody = {
  title: string;
  event_type?: string;
  group_id?: string | null;
  group_ids?: string[];       // 다중 그룹 (event_groups 테이블)
  venue?: string;
  start_at: string;
  end_at: string;
  manager_id?: string | null;
  on_site_manager?: string | null;
  memo?: string;
  checklist_template_ids?: string[];
};
const eventCreateFields = [
  "title",
  "event_type",
  "group_id",
  "venue",
  "start_at",
  "end_at",
  "manager_id",
  "on_site_manager",
  "memo",
] as const;

export async function GET(request: Request) {
  try {
    const { supabase, workspaceId } = await requireWorkspace();

    const { searchParams } = new URL(request.url);
    const month = optionalMonth(searchParams.get("month"));
    const groupId = optionalUuid(searchParams.get("group_id"), "group_id");

    let query = supabase
      .from("events")
      .select("id,title,event_type,group_id,venue,start_at,end_at")
      .eq("workspace_id", workspaceId)
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
    const { supabase, user, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);

    const body = await parseJson<EventBody>(request);
    const { checklist_template_ids: checklistTemplateIds, group_ids: groupIds } = body;
    const eventPayload = pickAllowed(body, eventCreateFields);

    if (!eventPayload.title || !eventPayload.start_at || !eventPayload.end_at) {
      throw new ApiError(400, "Missing required event fields");
    }
    eventPayload.start_at = requireDateString(eventPayload.start_at, "start_at");
    eventPayload.end_at = requireDateString(eventPayload.end_at, "end_at");

    if (eventPayload.group_id !== undefined) {
      eventPayload.group_id = optionalUuid(eventPayload.group_id, "group_id") ?? null;
    }

    if (eventPayload.group_id) {
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("id")
        .eq("id", eventPayload.group_id)
        .eq("workspace_id", workspaceId)
        .single();
      if (groupError || !group) throw new ApiError(400, "Invalid group");
    }

    const { data: event, error } = await supabase
      .from("events")
      .insert({ ...eventPayload, created_by: user.id, workspace_id: workspaceId })
      .select("*")
      .single();
    if (error) throw error;

    // event_groups 에 다중 그룹 연결 (마이그레이션 012 적용 후 동작)
    if (groupIds && groupIds.length > 0) {
      const validGroupIds = groupIds.map((groupId) => optionalUuid(groupId, "group_id"));
      if (validGroupIds.some((groupId) => !groupId)) throw new ApiError(400, "Invalid group");
      const { count, error: groupError } = await supabase
        .from("groups")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .in("id", validGroupIds as string[]);
      if (groupError) throw groupError;
      if ((count ?? 0) !== validGroupIds.length) throw new ApiError(400, "Invalid group");

      const { error: egErr } = await supabase
        .from("event_groups")
        .insert((validGroupIds as string[]).map((gid) => ({ event_id: event.id, group_id: gid })));
      if (egErr) {
        // 테이블 미존재 등 마이그레이션 미적용 시 이벤트 생성은 유지하고 경고만 반환
        console.warn("[event_groups insert failed]", egErr.message);
        return json({ event, warning: "그룹 연결 실패 — 마이그레이션 012 실행 필요" }, 201);
      }
    }

    if (checklistTemplateIds?.length) {
      const validTemplateIds = checklistTemplateIds.map((templateId) =>
        optionalUuid(templateId, "checklist_template_id"),
      );
      if (validTemplateIds.some((templateId) => !templateId)) {
        throw new ApiError(400, "Invalid checklist template");
      }
      const { data: templates, error: templateError } = await supabase
        .from("checklist_templates")
        .select("label")
        .eq("workspace_id", workspaceId)
        .in("id", validTemplateIds as string[]);
      if (templateError) throw templateError;
      if ((templates ?? []).length !== validTemplateIds.length) {
        throw new ApiError(400, "Invalid checklist template");
      }

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
