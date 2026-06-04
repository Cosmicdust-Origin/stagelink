"use client";

import { LogOut, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeRole, roleLabels } from "@/lib/rbac";
import { useToastStore } from "@/lib/toast";

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  joined_at: string | null;
};

export function AccountForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const toast = useToastStore((s) => s.show);

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const normalizedRole = normalizeRole(profile.role);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);

    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null }),
    });

    setSavingProfile(false);

    if (res.ok) {
      toast("프로필 저장 완료!");
      router.refresh();
    } else {
      toast("저장 실패", "error");
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== newPasswordConfirm) {
      toast("새 비밀번호가 일치하지 않습니다.", "error");
      return;
    }
    if (newPassword.length < 8) {
      toast("비밀번호는 8자 이상이어야 합니다.", "error");
      return;
    }

    setSavingPassword(true);

    // Verify current password first
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (signInError) {
      setSavingPassword(false);
      toast("현재 비밀번호가 올바르지 않습니다.", "error");
      return;
    }

    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });

    setSavingPassword(false);

    if (res.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      toast("비밀번호 변경 완료!");
    } else {
      toast("비밀번호 변경 실패", "error");
    }
  }

  async function logout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="space-y-6">
      {/* Profile info */}
      <form
        onSubmit={saveProfile}
        className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
      >
        <h2 className="font-semibold text-white">프로필</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-zinc-300">
            이름
            <input
              className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm text-zinc-300">
            연락처
            <input
              className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white placeholder-zinc-600"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
            />
          </label>
          <div className="text-sm text-zinc-300">
            이메일
            <p className="mt-2 flex h-10 items-center rounded-md border border-white/10 bg-white/[0.02] px-3 text-zinc-500 select-all">
              {profile.email}
            </p>
          </div>
          <div className="text-sm text-zinc-300">
            역할
            <p className="mt-2 flex h-10 items-center rounded-md border border-white/10 bg-white/[0.02] px-3 text-zinc-500">
              {normalizedRole ? roleLabels[normalizedRole] : profile.role}
              {profile.joined_at ? (
                <span className="ml-auto text-xs text-zinc-600">
                  {profile.joined_at.slice(0, 10)} 입사
                </span>
              ) : null}
            </p>
          </div>
        </div>
        <button
          className="mt-4 flex h-10 items-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white disabled:opacity-60"
          type="submit"
          disabled={savingProfile}
        >
          <Save className="h-4 w-4" />
          {savingProfile ? "저장 중…" : "저장"}
        </button>
      </form>

      {/* Password change */}
      <form
        onSubmit={changePassword}
        className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
      >
        <h2 className="font-semibold text-white">비밀번호 변경</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block text-sm text-zinc-300">
            현재 비밀번호
            <input
              className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm text-zinc-300">
            새 비밀번호
            <input
              className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white placeholder-zinc-600"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8자 이상"
              minLength={8}
              required
            />
          </label>
          <label className="block text-sm text-zinc-300">
            새 비밀번호 확인
            <input
              className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white"
              type="password"
              autoComplete="new-password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              required
            />
          </label>
        </div>
        <button
          className="mt-4 flex h-10 items-center gap-2 rounded-md bg-white/[0.08] px-4 text-sm font-semibold text-white hover:bg-white/[0.12] disabled:opacity-60"
          type="submit"
          disabled={savingPassword}
        >
          <Save className="h-4 w-4" />
          {savingPassword ? "변경 중…" : "비밀번호 변경"}
        </button>
      </form>

      {/* Logout */}
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
        <h2 className="font-semibold text-white">계정 관리</h2>
        <p className="mt-1 text-sm text-zinc-400">로그아웃하면 다시 로그인해야 합니다.</p>
        <button
          className="mt-4 flex h-10 items-center gap-2 rounded-md border border-red-500/40 px-4 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-60"
          type="button"
          onClick={logout}
          disabled={loggingOut}
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? "로그아웃 중…" : "로그아웃"}
        </button>
      </div>
    </div>
  );
}
