"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (signInError) {
      setError("이메일 또는 비밀번호를 확인해주세요.");
      return;
    }

    router.replace(searchParams.get("next") || "/dashboard");
    router.refresh();
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm text-zinc-300">
        이메일
        <input
          className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white"
          type="email"
          autoComplete="email"
          placeholder="admin@stageoftheground.local"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="block text-sm text-zinc-300">
        비밀번호
        <input
          className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {error ? <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null}
      <button
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#E8457A] text-sm font-semibold text-white hover:bg-[#d93669] disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        로그인
      </button>
    </form>
  );
}
