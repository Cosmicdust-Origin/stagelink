import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function GroupsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: groups } = await supabase.from("groups").select("*, group_members(count)").order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">그룹 관리</h1>
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
        <EmptyState title="등록된 그룹이 없습니다" description="관리자 계정으로 그룹을 추가할 수 있습니다." />
      )}
    </div>
  );
}
