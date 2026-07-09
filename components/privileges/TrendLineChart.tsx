"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type TrendLineChartProps = {
  title: string;
  description?: string;
  data: Array<Record<string, string | number>>;
  keys?: string[];
};

const colors = [
  "#E8457A",
  "#4A9FE8",
  "#27AE60",
  "#F5B642",
  "#9B59B6",
  "#06B6D4",
  "#F97316",
  "#84CC16",
  "#EC4899",
  "#38BDF8",
  "#A3E635",
  "#F43F5E",
];

export function TrendLineChart({ title, description, data, keys: explicitKeys }: TrendLineChartProps) {
  const keys = explicitKeys?.length
    ? explicitKeys
    : Object.keys(data[0] ?? {}).filter((key) => key !== "date");
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  function getOpacity(key: string) {
    return focusedKey && focusedKey !== key ? 0.16 : 1;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" stroke="#a1a1aa" tick={{ fontSize: 12 }} />
            <YAxis stroke="#a1a1aa" tick={{ fontSize: 12 }} unit="장" />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", color: "#fff", fontSize: 13 }}
              formatter={(value, name) => [`${value}장`, name]}
            />
            {keys.map((key, index) => {
              const color = colors[index % colors.length];
              const isFocused = focusedKey === key;
              const opacity = getOpacity(key);

              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeOpacity={opacity}
                  strokeWidth={isFocused ? 4 : 2}
                  connectNulls
                  dot={{ r: isFocused ? 4 : 3, fill: color, opacity }}
                  activeDot={{ r: isFocused ? 7 : 5 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs">
        {keys.map((key, index) => {
          const color = colors[index % colors.length];
          const isFocused = focusedKey === key;
          const isDimmed = focusedKey !== null && !isFocused;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setFocusedKey((current) => (current === key ? null : key))}
              className={`inline-flex items-center gap-1.5 transition-opacity ${
                isDimmed ? "opacity-35" : "opacity-100"
              } ${isFocused ? "font-semibold text-white" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
