"use client";

import { UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToastStore } from "@/lib/toast";

type Props = {
  memberId: string;
  memberName: string;
};

export function MemberWithdrawButton({ memberId, memberName }: Props) {
  const router = useRouter();
  const toast = useToastStore((state) => state.show);
  const [isLoading, setIsLoading] = useState(false);

  async function withdraw() {
    const ok = window.confirm(
      `${memberName} 회원을 현재 워크스페이스에서 탈퇴 처리할까요?\n계정 자체는 삭제되지 않습니다.`,
    );
    if (!ok) return;

    setIsLoading(true);
    const response = await fetch(`/api/members/${memberId}`, { method: "DELETE" });
    setIsLoading(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      toast(data.error ?? "탈퇴 처리에 실패했습니다.", "error");
      return;
    }

    toast("회원 탈퇴 처리가 완료되었습니다.");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={withdraw}
      disabled={isLoading}
      className="inline-flex h-9 items-center justify-center gap-2 border border-white/10 px-3 text-sm font-medium text-zinc-300 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <UserMinus className="h-4 w-4" />
      {isLoading ? "처리 중" : "탈퇴 처리"}
    </button>
  );
}
