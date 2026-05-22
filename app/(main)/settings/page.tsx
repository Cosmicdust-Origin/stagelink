import { ChecklistTemplateForm, InviteUserForm } from "@/components/settings/SettingsForms";
import { PrivilegeTypeManager } from "@/components/settings/PrivilegeTypeManager";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const wsId = user ? await getWorkspaceId(supabase, user.id) : null;

  // Workspace-scoped user IDs
  const memberIds: string[] = [];
  if (wsId) {
    const [{ data: workspace }, { data: wsMembers }] = await Promise.all([
      supabase.from("workspaces").select("owner_id").eq("id", wsId).single(),
      supabase.from("workspace_members").select("user_id").eq("workspace_id", wsId),
    ]);
    if (workspace?.owner_id) memberIds.push(workspace.owner_id);
    (wsMembers ?? []).forEach((m: { user_id: string }) => memberIds.push(m.user_id));
  }

  const [{ data: profiles }, { data: privilegeTypes }, { data: templates }, { data: groups }] =
    await Promise.all([
      memberIds.length
        ? supabase.from("profiles").select("id,name,role").in("id", memberIds).order("name")
        : Promise.resolve({ data: [] }),
      wsId
        ? supabase
            .from("privilege_types")
            .select("id,name,category,unit_price,is_active")
            .eq("workspace_id", wsId)
            .order("created_at")
        : Promise.resolve({ data: [] }),
      wsId
        ? supabase
            .from("checklist_templates")
            .select("*")
            .eq("workspace_id", wsId)
            .order("created_at")
        : Promise.resolve({ data: [] }),
      wsId
        ? supabase.from("groups").select("*").eq("workspace_id", wsId).order("name")
        : Promise.resolve({ data: [] }),
    ]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-white">설정</h1>
      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="계정 초대">
          <InviteUserForm />
          {profiles?.map((profile) => (
            <Row key={profile.id} label={profile.name} value={profile.role} />
          ))}
        </Panel>
        <Panel title="특전 항목 관리">
          <PrivilegeTypeManager types={privilegeTypes ?? []} />
        </Panel>
        <Panel title="체크리스트 템플릿">
          <ChecklistTemplateForm />
          {templates?.map((template) => (
            <Row
              key={template.id}
              label={template.label}
              value={template.is_default ? "기본" : "선택"}
            />
          ))}
        </Panel>
        <Panel title="그룹별 매니저 배정">
          {groups?.map((group) => (
            <Row key={group.id} label={group.name} value="그룹 상세에서 멤버를 배정하세요" />
          ))}
        </Panel>
      </section>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <h2 className="font-semibold text-white">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3 text-sm">
      <span className="text-zinc-200">{label}</span>
      <span className="text-zinc-500">{value}</span>
    </div>
  );
}
