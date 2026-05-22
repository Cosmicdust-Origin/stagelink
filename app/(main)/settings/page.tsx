import { ChecklistTemplateForm, InviteUserForm } from "@/components/settings/SettingsForms";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const [{ data: profiles }, { data: privilegeTypes }, { data: templates }, { data: groups }] = await Promise.all([
    supabase.from("profiles").select("id,name,role").order("name"),
    supabase.from("privilege_types").select("*").order("created_at"),
    supabase.from("checklist_templates").select("*").order("created_at"),
    supabase.from("groups").select("*").order("name"),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-white">설정</h1>
      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="계정 초대">
          <InviteUserForm />
          {profiles?.map((profile) => <Row key={profile.id} label={profile.name} value={profile.role} />)}
        </Panel>
        <Panel title="특전 항목">
          {privilegeTypes?.map((type) => <Row key={type.id} label={type.name} value={type.unit_price ? `${Number(type.unit_price).toLocaleString("ko-KR")}원` : "단가 없음"} />)}
        </Panel>
        <Panel title="체크리스트 템플릿">
          <ChecklistTemplateForm />
          {templates?.map((template) => <Row key={template.id} label={template.label} value={template.is_default ? "기본" : "선택"} />)}
        </Panel>
        <Panel title="그룹별 매니저 배정">
          {groups?.map((group) => <Row key={group.id} label={group.name} value="그룹 상세에서 멤버를 배정하세요" />)}
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
