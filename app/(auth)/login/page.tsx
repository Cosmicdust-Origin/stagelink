export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <h1 className="text-2xl font-semibold text-white">STAGELINK 로그인</h1>
        <p className="mt-2 text-sm text-zinc-400">초대받은 이메일로 Supabase 인증을 연결하면 운영 콘솔에 접근할 수 있습니다.</p>
        <form className="mt-6 space-y-4">
          <label className="block text-sm text-zinc-300">
            이메일
            <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" type="email" placeholder="name@example.com" />
          </label>
          <label className="block text-sm text-zinc-300">
            비밀번호
            <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" type="password" />
          </label>
          <button className="h-11 w-full rounded-md bg-[#E8457A] text-sm font-semibold text-white hover:bg-[#d93669]" type="button">
            로그인
          </button>
        </form>
      </section>
    </main>
  );
}
