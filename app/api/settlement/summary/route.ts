import { getSettlementSummary } from "@/lib/api/settlement";
import { handleApiError, json, requireRole } from "@/lib/api/auth";
import { getWorkspaceId } from "@/lib/workspace";
import { optionalMonth } from "@/lib/api/validation";

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireRole(["admin", "owner"]);
    const wsId = await getWorkspaceId(supabase, user.id);
    if (!wsId) return json({ members: [] });

    const month = optionalMonth(new URL(request.url).searchParams.get("month")) ?? new Date().toISOString().slice(0, 7);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const members = await getSettlementSummary(supabase as any, month, wsId ?? undefined);

    return json({ members });
  } catch (error) {
    return handleApiError(error);
  }
}
