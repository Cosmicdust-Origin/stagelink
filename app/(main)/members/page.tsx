import { ShieldCheck, UserCog } from "lucide-react";
import { MemberWithdrawButton } from "@/components/members/MemberWithdrawButton";
import { normalizeRole, roleBadgeClasses, roleLabels } from "@/lib/rbac";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";

type WorkspaceUser = {
  id: string;
  email: string | null;
  created_at: string;
};

export default async function MembersPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const wsId = user ? await getWorkspaceId(supabase, user.id) : null;

  const { data: wsMembers } = wsId
    ? await supabase.from("workspace_members").select("user_id").eq("workspace_id", wsId)
    : { data: [] };

  const workspaceUserIds = [...new Set((wsMembers ?? []).map((member) => member.user_id))];

  const { data: profiles } = workspaceUserIds.length
    ? await supabase
        .from("profiles")
        .select("id,name,username,role,phone,joined_at")
        .in("id", workspaceUserIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const serviceClient = createServiceRoleClient();
  const authUsers = (
    await Promise.all(
      workspaceUserIds.map(async (id) => {
        const { data } = await serviceClient.auth.admin.getUserById(id);
        return data.user
          ? ({
              id: data.user.id,
              email: data.user.email ?? null,
              created_at: data.user.created_at ?? null,
            } satisfies WorkspaceUser)
          : null;
      }),
    )
  ).filter((authUser): authUser is WorkspaceUser => authUser !== null);

  const rows = authUsers
    .map((authUser) => ({
      authUser,
      profile: profileMap.get(authUser.id) ?? null,
    }))
    .filter(({ profile }) => normalizeRole(profile?.role) !== "super_admin")
    .sort((a, b) => (a.profile?.name ?? a.authUser.email ?? "").localeCompare(b.profile?.name ?? b.authUser.email ?? "", "ko"));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-white">회원 관리</h1>
        <p className="mt-1 text-sm text-zinc-400">
          현재 워크스페이스에 초대된 대표·직원 계정만 표시됩니다. 총 {rows.length}명
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 bg-white/[0.04]">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">이름</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">아이디</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">이메일</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">등급</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">가입일</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-400">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map(({ authUser, profile }) => {
              const role = profile?.role ?? "-";
              const normalizedRole = normalizeRole(role);

              return (
                <tr key={authUser.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {normalizedRole === "owner" ? (
                        <ShieldCheck className="h-4 w-4 shrink-0 text-amber-300" />
                      ) : (
                        <UserCog className="h-4 w-4 shrink-0 text-zinc-400" />
                      )}
                      <span className="font-medium text-white">
                        {profile?.name ?? authUser.email ?? "-"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {profile?.username ?? <span className="text-zinc-600">-</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{authUser.email ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        normalizedRole ? roleBadgeClasses[normalizedRole] : "bg-zinc-500/20 text-zinc-400"
                      }`}
                    >
                      {normalizedRole ? roleLabels[normalizedRole] : role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {authUser.created_at
                      ? new Date(authUser.created_at).toLocaleDateString("ko-KR")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <MemberWithdrawButton
                      memberId={authUser.id}
                      memberName={profile?.name ?? authUser.email ?? "이 회원"}
                    />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  이 워크스페이스에 초대된 계정이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
