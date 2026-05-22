"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function WorkspaceCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? "오류가 발생했습니다.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        className="h-12 w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 text-white placeholder-zinc-500 focus:border-[#E8457A] focus:outline-none"
        placeholder="예: 너에게 닿기를"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-lg bg-[#E8457A] text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "생성 중…" : "워크스페이스 생성"}
      </button>
    </form>
  );
}
