import { handleApiError, json, parseJson, requireRole } from "@/lib/api/auth";

type Params = { params: Promise<{ typeId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const { typeId } = await params;
    const { supabase } = await requireRole(["admin"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const { data, error } = await supabase
      .from("privilege_types")
      .update(body)
      .eq("id", typeId)
      .select("*")
      .single();

    if (error) throw error;
    return json({ type: data });
  } catch (error) {
    return handleApiError(error);
  }
}
