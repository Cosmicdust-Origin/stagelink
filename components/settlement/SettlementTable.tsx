import { formatCurrency } from "@/lib/utils";
import type { SettlementMemberSummary } from "@/lib/types";

export function SettlementTable({ members }: { members: SettlementMemberSummary[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-sm">
        <thead className="bg-white/[0.04] text-zinc-400">
          <tr>
            <th className="px-3 py-3 text-left font-medium">멤버</th>
            <th className="px-3 py-3 text-left font-medium">그룹</th>
            <th className="px-3 py-3 text-left font-medium">내역</th>
            <th className="px-3 py-3 text-right font-medium">정산액</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {members.map((member) => (
            <tr key={member.member_id}>
              <td className="px-3 py-3 font-medium text-white">{member.member_name}</td>
              <td className="px-3 py-3 text-zinc-300">{member.group_name}</td>
              <td className="px-3 py-3 text-zinc-400">
                {member.breakdown.map((line) => `${line.privilege_type} ${line.quantity}`).join(" · ")}
              </td>
              <td className="px-3 py-3 text-right font-semibold tabular-nums text-white">{formatCurrency(member.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
