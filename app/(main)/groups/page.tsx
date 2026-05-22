import Link from "next/link";
import { GroupCreateForm } from "@/components/groups/GroupCreateForm";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function GroupsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: groups }, { data: profile }] = await Promise.all([
    supabase.from("groups").select("*, group_members(count)").order("created_at", { ascending: false }),
    user ? supabase.from("profiles").select("role").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);
  const canEdit = profile?.role === "admin";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">그룹 관리</h1>
        <p className="mt-1 text-sm text-zinc-400">그룹을 만들고 멤버를 배정합니다.</p>
      </div>
      {canEdit ? <CollapsibleSection label="그룹 추가"><GroupCreateForm /></CollapsibleSection> : null}
      {groups?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`} className="rounded-lg border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.07]">
              <p className="text-lg font-semibold text-white">{group.name}</p>
              <p className="mt-2 text-sm text-zinc-400">{group.description ?? "설명 없음"}</p>
              <p className="mt-4 text-xs text-zinc-500">데뷔일 {group.debut_date ?? "-"}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="등록된 그룹이 없습니다" description={canEdit ? "위 입력 영역에서 첫 그룹을 추가하세요." : "관리자 계정으로 그룹을 추가할 수 있습니다."} />
      )}
    </div>
  );
}
