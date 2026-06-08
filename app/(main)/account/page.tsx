import { redirect } from "next/navigation";
import { AccountForm } from "@/components/account/AccountForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,name,username,role,phone,joined_at")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">마이페이지</h1>
        <p className="mt-1 text-sm text-zinc-400">프로필 정보를 확인하고 수정합니다.</p>
      </div>
      <AccountForm
        profile={{
          id: profile.id,
          name: profile.name,
          username: profile.username ?? "",
          email: user.email ?? "",
          role: profile.role,
          phone: profile.phone,
          joined_at: profile.joined_at,
        }}
      />
    </div>
  );
}
