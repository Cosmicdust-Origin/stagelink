import { handleApiError, json, parseJson, requireRole, requireUser } from "@/lib/api/auth";

type GroupBody = {
  name: string;
  debut_date?: string;
  description?: string;
  cover_image_url?: string;
};

export async function GET() {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("groups")
      .select("*, group_members(count)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return json({ groups: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase } = await requireRole(["admin"]);
    const body = await parseJson<GroupBody>(request);
    const { data, error } = await supabase.from("groups").insert(body).select("*").single();

    if (error) throw error;
    return json({ group: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
