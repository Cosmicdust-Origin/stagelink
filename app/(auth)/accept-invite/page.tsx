import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AcceptInviteForm } from "@/components/auth/AcceptInviteForm";

export default function AcceptInvitePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <h1 className="text-2xl font-semibold text-white">초대 수락</h1>
        <p className="mt-2 text-sm text-zinc-400">
          이름과 새 비밀번호를 설정해 계정을 마무리합니다.
        </p>
        <Suspense
          fallback={
            <div className="mt-8 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              <span className="text-sm text-zinc-400">로딩 중…</span>
            </div>
          }
        >
          <AcceptInviteForm />
        </Suspense>
      </section>
    </main>
  );
}
