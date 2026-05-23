"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToastStore } from "@/lib/toast";
import type { SettlementMemberSummary, SettlementLine } from "@/lib/types";

export function SettlementTable({ members }: { members: SettlementMemberSummary[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  function toggle(memberId: string) {
    setExpanded((prev) => (prev === memberId ? null : memberId));
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="min-w-full text-sm">
        <thead className="bg-white/[0.04] text-xs text-zinc-400">
          <tr>
            <th className="px-4 py-3 text-left font-medium">멤버</th>
            <th className="px-4 py-3 text-left font-medium">그룹</th>
            <th className="px-4 py-3 text-right font-medium">총 정산액</th>
            <th className="px-4 py-3 text-right font-medium">정산완료</th>
            <th className="px-4 py-3 text-right font-medium">미정산액</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {members.map((member) => (
            <>
              <MemberRow
                key={member.member_id}
                member={member}
                isExpanded={expanded === member.member_id}
                onToggle={() => toggle(member.member_id)}
              />
              {expanded === member.member_id && (
                <DetailRow key={`detail-${member.member_id}`} member={member} />
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MemberRow({
  member,
  isExpanded,
  onToggle,
}: {
  member: SettlementMemberSummary;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const summary = member.breakdown
    .reduce<Record<string, number>>((acc, l) => {
      acc[l.privilege_type] = (acc[l.privilege_type] ?? 0) + l.quantity;
      return acc;
    }, {});
  const summaryText = Object.entries(summary)
    .map(([type, qty]) => `${type} ${qty}장`)
    .join(" · ");

  return (
    <tr className="cursor-pointer hover:bg-white/[0.03]" onClick={onToggle}>
      <td className="px-4 py-3 font-semibold text-white">{member.member_name}</td>
      <td className="px-4 py-3 text-zinc-400">{member.group_name}</td>
      <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
        <span className="text-xs text-zinc-500">{summaryText}</span>
        <span className="ml-3">{formatCurrency(member.total)}</span>
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-emerald-400">
        {member.paid > 0 ? formatCurrency(member.paid) : <span className="text-zinc-600">—</span>}
      </td>
      <td className="px-4 py-3 text-right tabular-nums font-semibold">
        {member.unpaid > 0 ? (
          <span className="text-[#E8457A]">{formatCurrency(member.unpaid)}</span>
        ) : (
          <span className="text-emerald-400">완납</span>
        )}
      </td>
      <td className="px-4 py-3 text-zinc-500">
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </td>
    </tr>
  );
}

function DetailRow({ member }: { member: SettlementMemberSummary }) {
  const router = useRouter();
  const toast = useToastStore((s) => s.show);
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleSettled(line: SettlementLine) {
    setLoading(line.record_id);
    try {
      const settled_at = line.settled_at ? null : new Date().toISOString();
      const res = await fetch(`/api/privileges/records/${line.record_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settled_at }),
      });
      if (res.ok) {
        router.refresh();
        toast(line.settled_at ? "정산 취소되었습니다." : "정산 완료로 표시되었습니다.");
      } else {
        toast("처리에 실패했습니다.", "error");
      }
    } catch {
      toast("네트워크 오류가 발생했습니다.", "error");
    } finally {
      setLoading(null);
    }
  }

  // 미정산 먼저, 정산완료 나중 정렬
  const sorted = [...member.breakdown].sort((a, b) => {
    if (!a.settled_at && b.settled_at) return -1;
    if (a.settled_at && !b.settled_at) return 1;
    return a.event_date.localeCompare(b.event_date);
  });

  return (
    <tr>
      <td colSpan={6} className="bg-white/[0.025] px-6 py-3">
        <div className="space-y-1">
          <p className="mb-2 text-xs text-zinc-500">공연별 내역 · 정산된 항목은 체크 표시하세요</p>
          {sorted.map((line) => {
            const isSettled = !!line.settled_at;
            const isLoading = loading === line.record_id;
            return (
              <label
                key={line.record_id}
                className={`flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-white/[0.04] ${
                  isLoading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSettled}
                  onChange={() => toggleSettled(line)}
                  disabled={isLoading}
                  className="h-3.5 w-3.5 accent-emerald-500"
                />
                <span className={`w-22 shrink-0 tabular-nums ${isSettled ? "text-zinc-600" : "text-zinc-400"}`}>
                  {line.event_date}
                </span>
                <span className={`flex-1 truncate ${isSettled ? "text-zinc-600 line-through" : "text-zinc-300"}`}>
                  {line.event_name}
                </span>
                <span className={isSettled ? "text-zinc-600" : "text-zinc-400"}>
                  {line.privilege_type} {line.quantity}장
                </span>
                <span className={`w-24 text-right tabular-nums font-medium ${isSettled ? "text-zinc-600" : "text-white"}`}>
                  {formatCurrency(line.amount)}
                </span>
                {isSettled && line.settled_at && (
                  <span className="shrink-0 text-emerald-500">
                    {line.settled_at.slice(0, 10)} 정산
                  </span>
                )}
              </label>
            );
          })}
        </div>
        <div className="mt-3 flex justify-end gap-6 border-t border-white/10 pt-2 text-xs tabular-nums">
          <span className="text-zinc-500">총 {formatCurrency(member.total)}</span>
          {member.paid > 0 && <span className="text-emerald-400">완료 {formatCurrency(member.paid)}</span>}
          <span className={member.unpaid > 0 ? "font-semibold text-[#E8457A]" : "text-emerald-400"}>
            {member.unpaid > 0 ? `미정산 ${formatCurrency(member.unpaid)}` : "전액 정산 완료"}
          </span>
        </div>
      </td>
    </tr>
  );
}
