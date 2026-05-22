"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type MonthlyBarChartProps = {
  data: Array<Record<string, string | number>>;
  keys: string[];
};

const colors = ["#E8457A", "#4A9FE8", "#27AE60", "#F5B642", "#9B59B6"];

export function MonthlyBarChart({ data, keys }: MonthlyBarChartProps) {
  return (
    <div className="h-80 rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="name" stroke="#a1a1aa" />
          <YAxis stroke="#a1a1aa" />
          <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", color: "#fff" }} />
          {keys.map((key, index) => (
            <Bar key={key} dataKey={key} stackId="total" fill={colors[index % colors.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
