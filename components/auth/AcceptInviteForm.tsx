"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "verifying" | "form" | "error";

export function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<Status>("verifying");
  const [verifyError, setVerifyError] = useState("");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // Exchange invite token for session on mount
  useEffect(() => {
    async function verify() {
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (!token_hash || type !== "invite") {
        setVerifyError("유효하지 않은 초대 링크입니다. 이메일의 링크를 다시 확인해주세요.");
        setStatus("error");
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ token_hash, type: "invite" });

      if (error) {
        setVerifyError("초대 링크가 만료되었거나 이미 사용된 링크입니다. 관리자에게 재초대를 요청해주세요.");
        setStatus("error");
        return;
      }

      setStatus("form");
    }

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (password !== passwordConfirm) {
      setFormError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 8) {
      setFormError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError((data as { error?: string }).error ?? "설정 중 오류가 발생했습니다. 다시 시도해주세요.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (status === "verifying") {
    return (
      <div className="mt-8 flex items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        <span className="text-sm text-zinc-400">초대 링크 확인 중…</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mt-6 rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {verifyError}
      </div>
    );
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm text-zinc-300">
        이름
        <input
          className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white placeholder-zinc-600"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="홍길동"
          required
        />
      </label>
      <label className="block text-sm text-zinc-300">
        새 비밀번호
        <input
          className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white placeholder-zinc-600"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8자 이상"
          minLength={8}
          required
        />
      </label>
      <label className="block text-sm text-zinc-300">
        비밀번호 확인
        <input
          className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white placeholder-zinc-600"
          type="password"
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
        />
      </label>
      {formError ? (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">{formError}</p>
      ) : null}
      <button
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#E8457A] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        계정 설정 완료
      </button>
    </form>
  );
}
