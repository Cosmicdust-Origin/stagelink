export default function AcceptInvitePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <h1 className="text-2xl font-semibold text-white">초대 수락</h1>
        <p className="mt-2 text-sm text-zinc-400">이름과 새 비밀번호를 설정해 계정을 마무리합니다.</p>
        <form className="mt-6 space-y-4">
          <label className="block text-sm text-zinc-300">
            이름
            <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" />
          </label>
          <label className="block text-sm text-zinc-300">
            새 비밀번호
            <input className="mt-2 h-11 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" type="password" />
          </label>
          <button className="h-11 w-full rounded-md bg-[#E8457A] text-sm font-semibold text-white hover:bg-[#d93669]" type="button">
            계정 설정 완료
          </button>
        </form>
      </section>
    </main>
  );
}
