import { getSettlementSummary } from "@/lib/api/settlement";
import { handleApiError, json, requireRole } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireRole(["admin"]);
    const month = new URL(request.url).searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
    const members = await getSettlementSummary(supabase, month);

    return json({ members });
  } catch (error) {
    return handleApiError(error);
  }
}
