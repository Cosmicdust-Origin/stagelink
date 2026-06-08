"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "verifying" | "form" | "error";

export function AcceptInviteForm() {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<Status>("verifying");
  const [verifyError, setVerifyError] = useState("");
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // Exchange invite token for session on mount
  useEffect(() => {
    async function verify() {
      const supabase = createClient();

      // ── 방식 1: token_hash (Supabase email OTP 방식) ──────────
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      if (token_hash && type === "invite") {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type: "invite" });
        if (error) {
          setVerifyError("초대 링크가 만료되었거나 이미 사용된 링크입니다. 관리자에게 재초대를 요청해주세요.");
          setStatus("error");
          return;
        }
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u?.email) setInvitedEmail(u.email);
        setStatus("form");
        return;
      }

      // ── 방식 2: code (PKCE 방식, 현재 Supabase 기본값) ─────────
      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setVerifyError("초대 링크가 만료되었거나 이미 사용된 링크입니다. 관리자에게 재초대를 요청해주세요.");
          setStatus("error");
          return;
        }
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u?.email) setInvitedEmail(u.email);
        setStatus("form");
        return;
      }

      // ── 방식 3: implicit (URL 해시에 access_token + type=invite) ────────────
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash.includes("access_token") && hash.includes("type=invite")) {
        // Supabase 클라이언트가 해시를 자동으로 파싱해서 세션을 수립함
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u?.email) {
          setInvitedEmail(u.email);
          setStatus("form");
          return;
        }
      }

      // 어떤 방식도 해당하지 않으면 잘못된 링크
      setVerifyError("유효하지 않은 초대 링크입니다. 이메일의 링크를 다시 확인해주세요.");
      setStatus("error");
    }

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const trimmedUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(trimmedUsername)) {
      setFormError("아이디는 영문 소문자·숫자·밑줄(_)만 사용 가능하며 3~20자여야 합니다.");
      return;
    }
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
      body: JSON.stringify({ name: name.trim(), username: trimmedUsername, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError((data as { error?: string }).error ?? "설정 중 오류가 발생했습니다. 다시 시도해주세요.");
      return;
    }

    // hard redirect: Next.js 서버 컴포넌트가 캐시된 세션 대신 새 쿠키를 읽도록 강제
    window.location.replace("/dashboard");
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
      {invitedEmail ? (
        <div className="rounded-md bg-white/5 border border-white/10 px-4 py-3 text-sm">
          <p className="text-zinc-400">초대받은 계정</p>
          <p className="mt-0.5 font-medium text-white">{invitedEmail}</p>
        </div>
      ) : null}
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
        아이디 <span className="text-zinc-500">(로그인에 사용)</span>
        <input
          className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white placeholder-zinc-600"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="영문 소문자·숫자·밑줄, 3~20자"
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
