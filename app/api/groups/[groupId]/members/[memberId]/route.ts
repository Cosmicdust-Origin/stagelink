import { handleApiError, json, parseJson, requireRole } from "@/lib/api/auth";

type Params = { params: Promise<{ groupId: string; memberId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const { groupId, memberId } = await params;
    const { supabase } = await requireRole(["admin", "manager"]);
    const body = await parseJson<{
      name?: string;
      position?: string | null;
      contract_start_date?: string | null;
      contract_duration_months?: number | null;
    }>(request);

    // members 테이블 이름 변경
    if (body.name !== undefined) {
      const { error: nameErr } = await supabase
        .from("members")
        .update({ name: body.name.trim() })
        .eq("id", memberId);
      if (nameErr) throw nameErr;
    }

    // group_members 계약 정보 변경
    const patch: Record<string, unknown> = {};
    if ("position" in body) patch.position = body.position ?? null;
    if ("contract_start_date" in body) patch.contract_start_date = body.contract_start_date ?? null;
    if ("contract_duration_months" in body)
      patch.contract_duration_months = body.contract_duration_months ?? null;

    if (Object.keys(patch).length > 0) {
      const { data, error } = await supabase
        .from("group_members")
        .update(patch)
        .eq("group_id", groupId)
        .eq("member_id", memberId)
        .select("*")
        .single();

      if (error) throw error;
      return json({ member: data });
    }

    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { groupId, memberId } = await params;
    const { supabase } = await requireRole(["admin", "manager"]);

    // group_members 에서 연결 해제 (members 레코드는 보존)
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("member_id", memberId);

    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
