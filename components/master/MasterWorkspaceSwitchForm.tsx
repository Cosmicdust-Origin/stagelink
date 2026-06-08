"use client";

import { ArrowRightLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToastStore } from "@/lib/toast";

type Props = {
  workspaceId: string;
  currentWorkspaceId: string | null;
};

export function MasterWorkspaceSwitchForm({ workspaceId, currentWorkspaceId }: Props) {
  const router = useRouter();
  const toast = useToastStore((state) => state.show);
  const [isLoading, setIsLoading] = useState(false);
  const isCurrent = workspaceId === currentWorkspaceId;

  async function switchWorkspace() {
    setIsLoading(true);
    const response = await fetch("/api/master/workspaces/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId }),
    });
    setIsLoading(false);

    if (!response.ok) {
      toast("워크스페이스 전환에 실패했어.", "error");
      return;
    }

    toast("비상 관장 워크스페이스를 전환했어.");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={switchWorkspace}
      disabled={isCurrent || isLoading}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-sm text-zinc-200 transition-colors hover:border-[#E8457A]/60 hover:text-white disabled:cursor-default disabled:opacity-50"
    >
      <ArrowRightLeft className="h-4 w-4" />
      {isCurrent ? "관장 중" : isLoading ? "전환 중" : "관장"}
    </button>
  );
}
