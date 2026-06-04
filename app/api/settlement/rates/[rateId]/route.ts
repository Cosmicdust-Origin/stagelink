import { handleApiError, json, parseJson, requireRole } from "@/lib/api/auth";

type Params = { params: Promise<{ rateId: string }> };

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { rateId } = await params;
    const { supabase } = await requireRole(["admin", "owner"]);
    const { error } = await supabase.from("settlement_rates").delete().eq("id", rateId);
    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { rateId } = await params;
    const { supabase } = await requireRole(["admin", "owner"]);
    const body = await parseJson<Record<string, unknown>>(request);
    const { data, error } = await supabase
      .from("settlement_rates")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", rateId)
      .select("*")
      .single();

    if (error) throw error;
    return json({ rate: data });
  } catch (error) {
    return handleApiError(error);
  }
}
