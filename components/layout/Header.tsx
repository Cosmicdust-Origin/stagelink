import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-[#101114]/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">오늘도 무대 뒤를 단단하게</p>
          <h1 className="text-lg font-semibold text-white">운영 콘솔</h1>
        </div>
        <div className="rounded-md border border-white/10 px-3 py-2 text-right text-xs text-zinc-400">
          <p className="text-zinc-200">{user?.email ?? "로그인 필요"}</p>
        </div>
      </div>
    </header>
  );
}
