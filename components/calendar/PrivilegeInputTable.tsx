"use client";

import { useMemo, useState } from "react";
import { useToastStore } from "@/lib/toast";
import type { PrivilegeRecord, PrivilegeType, Profile } from "@/lib/types";

type PrivilegeInputTableProps = {
  eventId: string;
  members: Profile[];
  privilegeTypes: PrivilegeType[];
  records: PrivilegeRecord[];
  canEdit: boolean;
  currentUserId: string;
};

export function PrivilegeInputTable({
  eventId,
  members,
  privilegeTypes,
  records,
  canEdit,
  currentUserId,
}: PrivilegeInputTableProps) {
  const toast = useToastStore((s) => s.show);
  const [values, setValues] = useState(() => {
    const initial: Record<string, number> = {};
    records.forEach((record) => {
      initial[`${record.member_id}:${record.privilege_type_id}`] = record.quantity;
    });
    return initial;
  });

  const visibleMembers = canEdit ? members : members.filter((member) => member.id === currentUserId);
  const totals = useMemo(
    () =>
      privilegeTypes.map((type) => ({
        id: type.id,
        total: visibleMembers.reduce((sum, member) => sum + (values[`${member.id}:${type.id}`] ?? 0), 0),
      })),
    [privilegeTypes, values, visibleMembers],
  );

  async function save() {
    const payload = Object.entries(values).map(([key, quantity]) => {
      const [member_id, privilege_type_id] = key.split(":");
      return { member_id, privilege_type_id, quantity };
    });

    const response = await fetch(`/api/events/${eventId}/privileges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: payload }),
    });
    if (response.ok) toast("수량 저장 완료!");
    else toast("저장 실패", "error");
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-sm">
        <thead className="bg-white/[0.04] text-zinc-400">
          <tr>
            <th className="px-3 py-3 text-left font-medium">멤버</th>
            {privilegeTypes.map((type) => (
              <th key={type.id} className="px-3 py-3 text-right font-medium">
                {type.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {visibleMembers.map((member) => (
            <tr key={member.id}>
              <td className="whitespace-nowrap px-3 py-3 font-medium text-white">{member.name}</td>
              {privilegeTypes.map((type) => {
                const key = `${member.id}:${type.id}`;
                return (
                  <td key={type.id} className="px-3 py-2 text-right">
                    {canEdit ? (
                      <input
                        className="h-9 w-20 rounded-md border border-white/10 bg-[#101114] px-2 text-right tabular-nums text-white"
                        min={0}
                        type="number"
                        value={values[key] ?? 0}
                        onBlur={save}
                        onChange={(event) => setValues((current) => ({ ...current, [key]: Number(event.target.value) }))}
                      />
                    ) : (
                      <span className="tabular-nums text-zinc-300">{values[key] ?? 0}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-white/[0.04] text-zinc-200">
          <tr>
            <td className="px-3 py-3 font-semibold">합계</td>
            {totals.map((total) => (
              <td key={total.id} className="px-3 py-3 text-right font-semibold tabular-nums">
                {total.total}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
