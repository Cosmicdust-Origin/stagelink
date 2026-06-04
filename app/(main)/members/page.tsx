import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { roleBadgeClasses, roleLabels, normalizeRole } from "@/lib/rbac";
import { ShieldCheck, UserCog } from "lucide-react";

type Props = { searchParams: Promise<{ page?: string }> };

const PAGE_SIZE = 20;

export default async function MembersPage({ searchParams }: Props) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr ?? "1"));

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const wsId = user ? await getWorkspaceId(supabase, user.id) : null;

  // 서비스 롤로 auth 계정 전체 조회 (페이지네이션)
  const serviceClient = createServiceRoleClient();

  const { data: authData } = await serviceClient.auth.admin.listUsers({
    page,
    perPage: PAGE_SIZE,
  });

  const authUsers = authData?.users ?? [];
  const totalCount = (authData as { total?: number } | undefined)?.total ?? authUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // profiles 정보 조회 (username, role 포함)
  const userIds = authUsers.map((u) => u.id);
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id,name,username,role,phone,joined_at")
        .in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // 워크스페이스 소속 여부 확인
  const wsOwner = wsId
    ? (await supabase.from("workspaces").select("owner_id").eq("id", wsId).single()).data
        ?.owner_id
    : null;
  const { data: wsMembers } = wsId
    ? await supabase.from("workspace_members").select("user_id").eq("workspace_id", wsId)
    : { data: [] };
  const wsUserIds = new Set([
    wsOwner,
    ...(wsMembers ?? []).map((m: { user_id: string }) => m.user_id),
  ].filter(Boolean));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-white">회원 관리</h1>
        <p className="mt-1 text-sm text-zinc-400">
          로그인 가능한 관리자·매니저 계정 목록입니다. (총 {totalCount}명)
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
              <th className="px-4 py-3 text-left font-medium text-zinc-400">워크스페이스</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {authUsers.map((authUser) => {
              const profile = profileMap.get(authUser.id);
              const isInWs = wsUserIds.has(authUser.id);
              const role = profile?.role ?? "—";
              const normalizedRole = normalizeRole(role);

              return (
                <tr key={authUser.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {role === "admin" ? (
                        <ShieldCheck className="h-4 w-4 shrink-0 text-[#E8457A]" />
                      ) : (
                        <UserCog className="h-4 w-4 shrink-0 text-zinc-400" />
                      )}
                      <span className="font-medium text-white">
                        {profile?.name ?? authUser.email ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {profile?.username ?? <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{authUser.email ?? "—"}</td>
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
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {isInWs ? (
                      <span className="text-xs text-green-400">소속</span>
                    ) : (
                      <span className="text-xs text-zinc-600">미소속</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {authUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  등록된 계정이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`/members?page=${page - 1}`}
              className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/10"
            >
              이전
            </a>
          )}
          <span className="text-sm text-zinc-500">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/members?page=${page + 1}`}
              className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/10"
            >
              다음
            </a>
          )}
        </div>
      )}
    </div>
  );
}
