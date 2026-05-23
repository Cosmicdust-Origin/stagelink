import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/Toaster";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  // Workspace check
  if (user && profile) {
    const wsId = await getWorkspaceId(supabase, user.id);
    if (!wsId) {
      if (profile.role === "admin") {
        redirect("/workspace/new");
      }
      // 매니저인데 아직 워크스페이스 미소속
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#101114] px-6">
          <div className="text-center">
            <p className="text-lg font-semibold text-white">워크스페이스 소속 대기 중</p>
            <p className="mt-2 text-sm text-zinc-400">
              관리자가 워크스페이스에 초대할 때까지 기다려주세요.
            </p>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar role={profile?.role} />
      <div className="min-w-0 flex-1 pb-20 md:pb-0">
        <Header />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">{children}</main>
      </div>
      <MobileNav role={profile?.role} />
      <Toaster />
    </div>
  );
}
