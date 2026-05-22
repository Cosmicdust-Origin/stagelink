"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type MonthlyBarChartProps = {
  title: string;
  description?: string;
  data: Array<Record<string, string | number>>;
  keys: string[];
};

const colors = ["#E8457A", "#4A9FE8", "#27AE60", "#F5B642", "#9B59B6"];

export function MonthlyBarChart({ title, description, data, keys }: MonthlyBarChartProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fontSize: 12 }} />
            <YAxis stroke="#a1a1aa" tick={{ fontSize: 12 }} unit="장" />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", color: "#fff", fontSize: 13 }}
              formatter={(value: number, name: string) => [`${value}장`, name]}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "#a1a1aa", paddingTop: 8 }}
            />
            {keys.map((key, index) => (
              <Bar key={key} dataKey={key} stackId="stack" fill={colors[index % colors.length]} radius={index === keys.length - 1 ? [3, 3, 0, 0] : undefined} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
