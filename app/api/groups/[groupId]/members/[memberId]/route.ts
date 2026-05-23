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

    // group_members 연결 해제
    const { error: gmErr } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("member_id", memberId);
    if (gmErr) throw gmErr;

    // members 레코드 삭제 (privilege_records 등 연관 데이터가 있으면 DB가 차단)
    const { error: mErr } = await supabase
      .from("members")
      .delete()
      .eq("id", memberId);
    if (mErr) {
      // FK 제약으로 실패한 경우 (특전 기록 등이 있음) — group_members만 해제된 상태로 성공 처리
      console.warn("members record kept (has related records):", mErr.message);
    }

    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
