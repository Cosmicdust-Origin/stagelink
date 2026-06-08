import { WorkspaceSwitcher } from "@/components/workspace/WorkspaceSwitcher";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserWorkspaces, getWorkspaceId } from "@/lib/workspace";

export async function Header() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let wsName: string | null = null;
  let wsTagline: string | null = null;
  let wsId: string | null = null;
  let workspaces: Array<{ id: string; name: string }> = [];

  if (user) {
    wsId = await getWorkspaceId(supabase, user.id);
    workspaces = await getUserWorkspaces(supabase, user.id);

    if (wsId) {
      const { data } = await supabase
        .from("workspaces")
        .select("name,tagline")
        .eq("id", wsId)
        .single();
      wsName = data?.name ?? null;
      wsTagline = data?.tagline ?? null;
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-[#101114]/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">{wsTagline ?? "오늘도 무대 뒤를 단단하게"}</p>
          <h1 className="text-lg font-semibold text-white">{wsName ?? "운영 콘솔"}</h1>
        </div>
        <div className="flex items-center gap-3">
          {wsId && workspaces.length > 1 ? (
            <WorkspaceSwitcher workspaces={workspaces} currentId={wsId} />
          ) : null}
          <div className="rounded-md border border-white/10 px-3 py-2 text-right text-xs text-zinc-400">
            <p className="text-zinc-200">{user?.email ?? "로그인 필요"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
