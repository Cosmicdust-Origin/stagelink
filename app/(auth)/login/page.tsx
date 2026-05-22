import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <h1 className="text-2xl font-semibold text-white">STAGELINK 로그인</h1>
        <p className="mt-2 text-sm text-zinc-400">초대받은 계정으로 로그인하면 운영 콘솔에 접근할 수 있습니다.</p>
        <Suspense fallback={<div className="mt-6 h-40 rounded-md bg-white/[0.04]" />}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
