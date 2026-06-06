import {
  handleApiError,
  json,
  parseJson,
  pickAllowed,
  requireRoleWithWorkspace,
  requireWorkspace,
} from "@/lib/api/auth";
import { optionalUuid } from "@/lib/api/validation";

const noticeCreateFields = ["title", "content", "target_group_id", "is_pinned"] as const;

export async function GET() {
  try {
    const { supabase, workspaceId } = await requireWorkspace();

    const { data, error } = await supabase
      .from("notices")
      .select("*, profiles!notices_author_id_fkey(name), groups(name)")
      .eq("workspace_id", workspaceId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return json({ notices: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user, workspaceId } = await requireRoleWithWorkspace(["admin", "manager"]);

    const body = await parseJson<Record<string, unknown>>(request);
    const payload = pickAllowed(body, noticeCreateFields);
    if ("target_group_id" in payload) {
      payload.target_group_id = optionalUuid(payload.target_group_id, "target_group_id") ?? null;
    }
    const { data, error } = await supabase
      .from("notices")
      .insert({ ...payload, author_id: user.id, workspace_id: workspaceId })
      .select("*")
      .single();

    if (error) throw error;
    return json({ notice: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
