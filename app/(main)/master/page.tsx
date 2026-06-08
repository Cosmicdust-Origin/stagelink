import { redirect } from "next/navigation";
import { MasterWorkspaceSwitchForm } from "@/components/master/MasterWorkspaceSwitchForm";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";

type WorkspaceRow = {
  id: string;
  name: string;
  tagline: string | null;
  owner_id: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  email: string | null;
  username: string | null;
  name: string;
  role: string;
};

type AuditRow = {
  id: string;
  action: string;
  target_workspace_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profiles:
    | { name: string; username: string | null; email: string | null }
    | Array<{ name: string; username: string | null; email: string | null }>
    | null;
  workspaces: { name: string } | Array<{ name: string }> | null;
};

export default async function MasterPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") redirect("/dashboard");

  const service = createServiceRoleClient();
  const currentWorkspaceId = await getWorkspaceId(supabase, user.id);

  const [{ data: workspaces }, { data: profiles }, { data: auditLogs }] = await Promise.all([
    service
      .from("workspaces")
      .select("id,name,tagline,owner_id,created_at")
      .order("created_at", { ascending: false }),
    service.from("profiles").select("id,email,username,name,role"),
    service
      .from("master_audit_logs")
      .select("id,action,target_workspace_id,metadata,created_at,profiles!master_audit_logs_actor_id_fkey(name,username,email),workspaces(name)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const profileById = new Map((profiles as ProfileRow[] | null ?? []).map((item) => [item.id, item]));
  const rows = await Promise.all(
    ((workspaces ?? []) as WorkspaceRow[]).map(async (workspace) => {
      const [members, groups, events, rates] = await Promise.all([
        countByWorkspace(service, "members", workspace.id),
        countByWorkspace(service, "groups", workspace.id),
        countByWorkspace(service, "events", workspace.id),
        countByWorkspace(service, "settlement_rates", workspace.id),
      ]);

      return {
        ...workspace,
        owner: profileById.get(workspace.owner_id) ?? null,
        counts: { members, groups, events, rates },
      };
    }),
  );
  const masterLogs = ((auditLogs ?? []) as unknown as AuditRow[]).map((log) => ({
    ...log,
    profile: firstRelation(log.profiles),
    workspace: firstRelation(log.workspaces),
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-sky-300">서비스 마스터</p>
        <h1 className="text-2xl font-semibold text-white">슈퍼어드민 콘솔</h1>
        <p className="mt-2 text-sm text-zinc-400">
          비상 상황에서 전체 워크스페이스를 확인하고 관장 대상을 전환합니다.
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-4">
        <Metric label="전체 워크스페이스" value={rows.length} />
        <Metric label="전체 멤버" value={rows.reduce((sum, row) => sum + row.counts.members, 0)} />
        <Metric label="전체 그룹" value={rows.reduce((sum, row) => sum + row.counts.groups, 0)} />
        <Metric label="전체 일정" value={rows.reduce((sum, row) => sum + row.counts.events, 0)} />
      </section>

      <section className="rounded-lg border border-white/10 bg-white/[0.04]">
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="font-semibold text-white">워크스페이스 관장</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="text-zinc-500">
              <tr className="border-b border-white/10">
                <th className="px-4 py-3">워크스페이스</th>
                <th className="px-4 py-3">소유자</th>
                <th className="px-4 py-3 text-right">그룹</th>
                <th className="px-4 py-3 text-right">멤버</th>
                <th className="px-4 py-3 text-right">일정</th>
                <th className="px-4 py-3 text-right">정산 비율</th>
                <th className="px-4 py-3 text-right">비상 관장</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((workspace) => (
                <tr key={workspace.id} className="border-b border-white/10 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white">{workspace.name}</p>
                    <p className="text-xs text-zinc-500">{workspace.tagline ?? "상단 멘트 없음"}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    <p>{workspace.owner?.name ?? "소유자 없음"}</p>
                    <p className="text-xs text-zinc-500">{workspace.owner?.email ?? "-"}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-200">{workspace.counts.groups}</td>
                  <td className="px-4 py-3 text-right text-zinc-200">{workspace.counts.members}</td>
                  <td className="px-4 py-3 text-right text-zinc-200">{workspace.counts.events}</td>
                  <td className="px-4 py-3 text-right text-zinc-200">{workspace.counts.rates}</td>
                  <td className="px-4 py-3 text-right">
                    <MasterWorkspaceSwitchForm
                      workspaceId={workspace.id}
                      currentWorkspaceId={currentWorkspaceId}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
        <h2 className="font-semibold text-white">최근 마스터 감사 로그</h2>
        <div className="mt-4 space-y-3">
          {masterLogs.length ? (
            masterLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-4 border-t border-white/10 pt-3 text-sm">
                <div>
                  <p className="text-zinc-200">{log.action}</p>
                  <p className="text-xs text-zinc-500">
                    {log.profile?.name ?? "알 수 없음"} · {log.workspace?.name ?? "대상 없음"}
                  </p>
                </div>
                <time className="text-xs text-zinc-500">
                  {new Date(log.created_at).toLocaleString("ko-KR")}
                </time>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-500">아직 기록된 마스터 액션이 없습니다.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-white/10 bg-white/[0.04] p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value.toLocaleString("ko-KR")}</p>
    </div>
  );
}

async function countByWorkspace(
  service: ReturnType<typeof createServiceRoleClient>,
  table: string,
  workspaceId: string,
) {
  const { count, error } = await service
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (error) return 0;
  return count ?? 0;
}

function firstRelation<T>(relation: T | T[] | null | undefined) {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation ?? null;
}
