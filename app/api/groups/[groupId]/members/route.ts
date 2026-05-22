import { handleApiError, json, parseJson, requireRole, requireUser } from "@/lib/api/auth";

type Params = { params: Promise<{ groupId: string }> };
type MemberBody = { user_id: string; position?: string };

export async function GET(_: Request, { params }: Params) {
  try {
    const { groupId } = await params;
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("group_members")
      .select("*, profiles(id,name,phone,role)")
      .eq("group_id", groupId)
      .order("joined_at");

    if (error) throw error;
    return json({ members: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { groupId } = await params;
    const { supabase } = await requireRole(["admin"]);
    const body = await parseJson<MemberBody>(request);
    const { data, error } = await supabase
      .from("group_members")
      .insert({ ...body, group_id: groupId })
      .select("*")
      .single();

    if (error) throw error;
    return json({ member: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
