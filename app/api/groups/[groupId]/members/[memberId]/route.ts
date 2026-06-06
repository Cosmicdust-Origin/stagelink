import { ApiError, handleApiError, json, parseJson, requireRoleWithWorkspace } from "@/lib/api/auth";
import { optionalDateString, requireNonNegativeInteger, requireUuid } from "@/lib/api/validation";

type Params = { params: Promise<{ groupId: string; memberId: string }> };

async function assertMembership(
  supabase: Awaited<ReturnType<typeof requireRoleWithWorkspace>>["supabase"],
  workspaceId: string,
  groupId: string,
  memberId: string,
) {
  const { data } = await supabase
    .from("group_members")
    .select("id, groups!inner(workspace_id)")
    .eq("group_id", groupId)
    .eq("member_id", memberId)
    .eq("groups.workspace_id", workspaceId)
    .single();

  if (!data) throw new ApiError(404, "Group member not found");
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { groupId, memberId } = await params;
    requireUuid(groupId, "groupId");
    requireUuid(memberId, "memberId");
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin"]);
    const body = await parseJson<{
      name?: string;
      position?: string | null;
      contract_start_date?: string | null;
      contract_duration_months?: number | null;
    }>(request);

    await assertMembership(supabase, workspaceId, groupId, memberId);

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) throw new ApiError(400, "Missing member name");

      const { error: nameErr } = await supabase
        .from("members")
        .update({ name })
        .eq("id", memberId)
        .eq("workspace_id", workspaceId);
      if (nameErr) throw nameErr;
    }

    const patch: Record<string, unknown> = {};
    if ("position" in body) patch.position = body.position ?? null;
    if ("contract_start_date" in body) {
      patch.contract_start_date = optionalDateString(body.contract_start_date, "contract_start_date") ?? null;
    }
    if ("contract_duration_months" in body) {
      patch.contract_duration_months =
        body.contract_duration_months == null
          ? null
          : requireNonNegativeInteger(body.contract_duration_months, "contract_duration_months");
    }

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
    requireUuid(groupId, "groupId");
    requireUuid(memberId, "memberId");
    const { supabase, workspaceId } = await requireRoleWithWorkspace(["admin"]);

    await assertMembership(supabase, workspaceId, groupId, memberId);

    const { error: gmErr } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("member_id", memberId);
    if (gmErr) throw gmErr;

    const { error: mErr } = await supabase
      .from("members")
      .delete()
      .eq("id", memberId)
      .eq("workspace_id", workspaceId);
    if (mErr) {
      console.warn("members record kept because related records exist:", mErr.message);
    }

    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
