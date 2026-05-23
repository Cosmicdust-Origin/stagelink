"use client";

import { Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type GroupMember = {
  id: string;
  member_id: string;
  position: string | null;
  contract_start_date: string | null;
  contract_duration_months: number | null;
  members: {
    name: string;
  } | null;
};

function daysUntilRenewal(startDate: string | null, months: number | null): number | null {
  if (!startDate || !months) return null;
  const [year, month, day] = startDate.split("-").map(Number);
  if (!year || !month || !day) return null;

  const renewal = new Date(year, month - 1, day);
  renewal.setMonth(renewal.getMonth() + months);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function renewalStatus(startDate: string | null, months: number | null) {
  const days = daysUntilRenewal(startDate, months);

  if (days === null) {
    return { className: "text-zinc-500", message: "계약 만료/갱신일 미설정" };
  }
  if (days < 0) {
    return { className: "text-red-400", message: `계약 만료/갱신일 ${Math.abs(days)}일 경과` };
  }
  if (days === 0) {
    return { className: "text-amber-300", message: "계약 만료/갱신일 오늘" };
  }
  return {
    className: days <= 30 ? "text-amber-400" : "text-zinc-300",
    message: `계약 만료/갱신까지 ${days}일`,
  };
}

export function MemberManager({
  groupId,
  members,
  canEdit,
}: {
  groupId: string;
  members: GroupMember[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [error, setError] = useState("");

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const response = await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), position: position || null }),
    });

    if (!response.ok) {
      setError("멤버를 추가하지 못했습니다.");
      return;
    }

    setName("");
    setPosition("");
    router.refresh();
  }

  async function removeMember(memberId: string) {
    const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError("멤버를 삭제하지 못했습니다.");
      return;
    }

    router.refresh();
  }

  async function patchMember(memberId: string, patch: Record<string, unknown>) {
    const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      setError("정보를 수정하지 못했습니다.");
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
              이름
              <input
                className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="김민지"
                required
              />
            </label>
            <label className="text-sm text-zinc-300">
              포지션
              <input
                className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101114] px-3 text-white"
                value={position}
                onChange={(event) => setPosition(event.target.value)}
                placeholder="보컬, 댄스 등"
              />
            </label>
            <button
              className="mt-7 flex h-10 items-center justify-center gap-2 rounded-md bg-[#E8457A] px-4 text-sm font-semibold text-white"
              type="submit"
            >
              <UserPlus className="h-4 w-4" />
              멤버 추가
            </button>
          </div>
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        </form>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {members.map((member) => {
          const contractStatus = renewalStatus(
            member.contract_start_date,
            member.contract_duration_months,
          );

          return (
            <article
              key={member.id}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {canEdit ? (
                    <input
                      className="h-9 w-full rounded-md border border-white/10 bg-[#101114] px-2 text-sm font-semibold text-white"
                      defaultValue={member.members?.name ?? ""}
                      placeholder="이름"
                      onBlur={(event) =>
                        patchMember(member.member_id, { name: event.target.value })
                      }
                    />
                  ) : (
                    <p className="font-semibold text-white">{member.members?.name ?? "이름 없음"}</p>
                  )}
                  {canEdit ? (
                    <input
                      className="mt-2 h-9 w-full rounded-md border border-white/10 bg-[#101114] px-2 text-sm text-white"
                      defaultValue={member.position ?? ""}
                      placeholder="포지션"
                      onBlur={(event) =>
                        patchMember(member.member_id, { position: event.target.value || null })
                      }
                    />
                  ) : (
                    <p className="mt-1 text-sm text-zinc-400">
                      {member.position ?? "포지션 미정"}
                    </p>
                  )}
                  {canEdit ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <label className="text-xs text-zinc-400">
                        계약 시행일
                        <input
                          className="mt-1 h-8 w-full rounded-md border border-white/10 bg-[#101114] px-2 text-xs text-white"
                          type="date"
                          defaultValue={member.contract_start_date ?? ""}
                          onBlur={(event) =>
                            patchMember(member.member_id, {
                              contract_start_date: event.target.value || null,
                            })
                          }
                        />
                      </label>
                      <label className="text-xs text-zinc-400">
                        계약 기간 (개월)
                        <input
                          className="mt-1 h-8 w-full rounded-md border border-white/10 bg-[#101114] px-2 text-xs text-white"
                          type="number"
                          min="1"
                          placeholder="12"
                          defaultValue={member.contract_duration_months ?? ""}
                          onBlur={(event) =>
                            patchMember(member.member_id, {
                              contract_duration_months: event.target.value
                                ? Number(event.target.value)
                                : null,
                            })
                          }
                        />
                      </label>
                    </div>
                  ) : null}
                </div>
                {canEdit ? (
                  <button
                    className="rounded-md p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-300"
                    type="button"
                    aria-label="멤버 삭제"
                    onClick={() => removeMember(member.member_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <p
                className={`mt-3 border-t border-white/5 pt-3 text-xs font-medium ${contractStatus.className}`}
              >
                {contractStatus.message}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
