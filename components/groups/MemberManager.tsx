"use client";

import { Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ProfileOption = {
  id: string;
  name: string;
  role: string;
};

type GroupMember = {
  id: string;
  user_id: string;
  position: string | null;
  profiles: {
    name: string;
    role: string;
  } | null;
};

export function MemberManager({
  groupId,
  members,
  profiles,
  canEdit,
}: {
  groupId: string;
  members: GroupMember[];
  profiles: ProfileOption[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [position, setPosition] = useState("");
  const [error, setError] = useState("");
  const currentMemberIds = useMemo(() => new Set(members.map((member) => member.user_id)), [members]);
  const addableProfiles = profiles.filter((profile) => !currentMemberIds.has(profile.id));

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const response = await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, position: position || null }),
    });

    if (!response.ok) {
      setError("멤버를 추가하지 못했습니다.");
      return;
    }

    setUserId("");
    setPosition("");
    router.refresh();
  }

  async function removeMember(memberId: string) {
    const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, { method: "DELETE" });

    if (!response.ok) {
      setError("멤버를 삭제하지 못했습니다.");
      return;
    }

    router.refresh();
  }

  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-white">멤버</h2>
      {canEdit ? (
        <form className="rounded-lg border border-white/10 bg-white/[0.04] p-4" onSubmit={addMember}>
          <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <label className="text-sm text-zinc-300">
              계정
              <select className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={userId} onChange={(event) => setUserId(event.target.value)} required>
                <option value="">멤버 선택</option>
                {addableProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} ({profile.role})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-zinc-300">
              포지션
              <input className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white" value={position} onChange={(event) => setPosition(event.target.value)} placeholder="보컬, 댄스 등" />
            </label>
            <button className="mt-7 flex h-10 items-center justify-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white" type="submit">
              <UserPlus className="h-4 w-4" />
              멤버 추가
            </button>
          </div>
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        </form>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {members.map((member) => (
          <article key={member.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{member.profiles?.name ?? "이름 없음"}</p>
                <p className="mt-1 text-sm text-zinc-400">{member.position ?? "포지션 미정"}</p>
              </div>
              {canEdit ? (
                <button className="rounded-md p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-300" type="button" aria-label="멤버 삭제" onClick={() => removeMember(member.user_id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
