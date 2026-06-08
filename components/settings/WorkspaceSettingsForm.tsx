"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToastStore } from "@/lib/toast";

type Props = {
  initialName: string;
  initialTagline: string;
  canEdit: boolean;
};

export function WorkspaceSettingsForm({ initialName, initialTagline, canEdit }: Props) {
  const router = useRouter();
  const toast = useToastStore((state) => state.show);
  const [name, setName] = useState(initialName);
  const [tagline, setTagline] = useState(initialTagline);
  const [isSaving, setIsSaving] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;

    setIsSaving(true);
    const response = await fetch("/api/workspaces", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, tagline }),
    });
    setIsSaving(false);

    if (!response.ok) {
      toast("워크스페이스 설정 저장에 실패했어.", "error");
      return;
    }

    toast("워크스페이스 설정을 저장했어.");
    router.refresh();
  }

  return (
    <form className="space-y-3" onSubmit={save}>
      <label className="block text-sm text-zinc-300">
        워크스페이스명
        <input
          className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white disabled:opacity-60"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={!canEdit}
          required
        />
      </label>
      <label className="block text-sm text-zinc-300">
        상단 멘트
        <input
          className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white disabled:opacity-60"
          value={tagline}
          onChange={(event) => setTagline(event.target.value)}
          disabled={!canEdit}
          placeholder="오늘도 무대 뒤를 단단하게"
        />
      </label>
      {canEdit ? (
        <button
          className="flex h-10 items-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white disabled:opacity-60"
          type="submit"
          disabled={isSaving}
        >
          <Save className="h-4 w-4" />
          {isSaving ? "저장 중" : "저장"}
        </button>
      ) : (
        <p className="text-sm text-zinc-500">관리자만 워크스페이스 설정을 수정할 수 있습니다.</p>
      )}
    </form>
  );
}
