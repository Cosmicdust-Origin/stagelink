import { handleApiError, json, parseJson, requireRole } from "@/lib/api/auth";

export async function GET() {
  try {
    const { supabase } = await requireRole(["admin"]);
    const { data, error } = await supabase
      .from("settlement_rates")
      .select("*, profiles(name), privilege_types(name)")
      .order("valid_from", { ascending: false });

    if (error) throw error;
    return json({ rates: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireRole(["admin"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const { data, error } = await supabase
      .from("settlement_rates")
      .insert({ ...body, created_by: user.id })
      .select("*")
      .single();

    if (error) throw error;
    return json({ rate: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
