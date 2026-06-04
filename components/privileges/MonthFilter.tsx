"use client";

import { useRouter } from "next/navigation";

export function MonthFilter({
  value,
  basePath = "/privileges",
  label = "조회 월",
}: {
  value: string;
  basePath?: string;
  label?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-zinc-400">{label}</label>
      <input
        type="month"
        value={value}
        onChange={(e) => router.push(`${basePath}?month=${e.target.value}`)}
        className="h-9 rounded-md border border-white/10 bg-[#101114] px-3 text-sm text-white [color-scheme:dark]"
      />
    </div>
  );
}
