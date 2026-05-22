import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <h1 className="text-2xl font-semibold text-white">관리자 계정 만들기</h1>
        <p className="mt-2 text-sm text-zinc-400">
          계정을 생성하면 전용 워크스페이스를 구축하고
          <br />
          스태프·매니저를 초대해 함께 사용할 수 있습니다.
        </p>
        <SignupForm />
        <p className="mt-5 text-center text-sm text-zinc-500">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-[#E8457A] hover:underline">
            로그인
          </Link>
        </p>
      </section>
    </main>
  );
}
