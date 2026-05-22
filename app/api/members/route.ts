import { handleApiError, json, requireUser } from "@/lib/api/auth";

export async function GET() {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("name");

    if (error) throw error;
    return json({ members: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}
