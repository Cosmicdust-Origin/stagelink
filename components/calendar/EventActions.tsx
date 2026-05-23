"use client";

import { Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToastStore } from "@/lib/toast";

type GroupOption = { id: string; name: string };

export function EventActions({
  eventId,
  initialTitle,
  initialVenue,
  initialMemo,
  initialOnSiteManager,
  initialGroupIds,
  groups,
}: {
  eventId: string;
  initialTitle: string;
  initialVenue: string;
  initialMemo: string;
  initialOnSiteManager: string;
  initialGroupIds: string[];
  groups: GroupOption[];
}) {
  const router = useRouter();
  const toast = useToastStore((s) => s.show);
  const [title, setTitle] = useState(initialTitle);
  const [venue, setVenue] = useState(initialVenue);
  const [memo, setMemo] = useState(initialMemo);
  const [onSiteManager, setOnSiteManager] = useState(initialOnSiteManager);
  const [groupIds, setGroupIds] = useState<string[]>(initialGroupIds);

  function toggleGroup(id: string) {
    setGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/events/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        venue: venue || null,
        memo: memo || null,
        on_site_manager: onSiteManager || null,
        group_ids: groupIds,
      }),
    });

    if (response.ok) {
      toast("저장 완료!");
      router.refresh();
    } else {
      toast("저장 실패", "error");
    }
  }

  async function remove() {
    if (!window.confirm("이 일정을 삭제할까요?")) return;
    const response = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    if (response.ok) router.push("/calendar");
    else toast("삭제 실패", "error");
  }

  return (
    <form className="mt-4 rounded-lg border border-white/10 bg-[#101114] p-4" onSubmit={save}>
      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        <input
          className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-white"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="일정명"
          placeholder="일정명"
        />
        <input
          className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-white"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="장소"
          aria-label="장소"
        />
        <input
          className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-white"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모"
          aria-label="메모"
        />
        <input
          className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-white"
          value={onSiteManager}
          onChange={(e) => setOnSiteManager(e.target.value)}
          placeholder="현장 담당자"
          aria-label="현장 담당자"
        />
      </div>

      {/* 그룹 다중 선택 */}
      {groups.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-zinc-500">그룹 <span className="text-zinc-600">(복수 선택 가능)</span></p>
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => {
              const active = groupIds.includes(group.id);
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-[#E8457A]/60 bg-[#E8457A]/15 text-[#ff8eb3]"
                      : "border-white/10 bg-white/[0.04] text-zinc-400 hover:border-white/20 hover:text-zinc-300"
                  }`}
                >
                  {group.name}
                </button>
              );
            })}
          </div>
          {groupIds.length === 0 && (
            <p className="mt-1 text-xs text-zinc-600">선택 없음 = 전체 일정</p>
          )}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-[#E8457A] text-sm font-semibold text-white"
          type="submit"
        >
          <Save className="h-4 w-4" />
          저장
        </button>
        <button
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-red-500/40 text-red-300"
          type="button"
          onClick={remove}
          title="삭제"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
