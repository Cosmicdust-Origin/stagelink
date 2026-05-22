import { redirect } from "next/navigation";
import { WorkspaceCreateForm } from "@/components/workspace/WorkspaceCreateForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NewWorkspacePage() {
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

  // Only admins can create workspaces
  if (profile?.role !== "admin") redirect("/dashboard");

  // If already owns a workspace, skip this step
  const { data: existing } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (existing) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#101114] px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8457A]/20">
              <span className="text-2xl">🎪</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">워크스페이스 만들기</h1>
          <p className="mt-2 text-sm text-zinc-400">
            팀 이름을 입력하면 전용 워크스페이스가 생성됩니다.
            <br />
            이후 스태프·매니저를 초대해 함께 사용할 수 있어요.
          </p>
        </div>
        <WorkspaceCreateForm />
      </div>
    </div>
  );
}
