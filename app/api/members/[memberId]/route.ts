import { handleApiError, json, requireUser } from "@/lib/api/auth";

type Params = { params: Promise<{ memberId: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { memberId } = await params;
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("profiles")
      .select("*, group_members(*, groups(name))")
      .eq("id", memberId)
      .single();

    if (error) throw error;
    return json({ member: data });
  } catch (error) {
    return handleApiError(error);
  }
}
