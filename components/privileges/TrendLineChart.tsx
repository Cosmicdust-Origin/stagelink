"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TrendLineChart({ data }: { data: Array<Record<string, string | number>> }) {
  const keys = Object.keys(data[0] ?? {}).filter((key) => key !== "month");

  return (
    <div className="h-80 rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="month" stroke="#a1a1aa" />
          <YAxis stroke="#a1a1aa" />
          <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", color: "#fff" }} />
          {keys.map((key, index) => (
            <Line key={key} type="monotone" dataKey={key} stroke={index % 2 ? "#4A9FE8" : "#E8457A"} strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
