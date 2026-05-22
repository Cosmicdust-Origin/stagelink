import { handleApiError, json, parseJson, requireRole, requireUser } from "@/lib/api/auth";

export async function GET() {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("notices")
      .select("*, profiles!notices_author_id_fkey(name), groups(name)")
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
    const { supabase, user } = await requireRole(["admin", "manager"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const { data, error } = await supabase
      .from("notices")
      .insert({ ...body, author_id: user.id })
      .select("*")
      .single();

    if (error) throw error;
    return json({ notice: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
