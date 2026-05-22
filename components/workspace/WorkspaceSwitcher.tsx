"use client";

import { useRouter } from "next/navigation";

type Workspace = { id: string; name: string };

export function WorkspaceSwitcher({
  workspaces,
  currentId,
}: {
  workspaces: Workspace[];
  currentId: string;
}) {
  const router = useRouter();

  if (workspaces.length <= 1) return null;

  async function handleChange(wsId: string) {
    await fetch("/api/workspaces/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: wsId }),
    });
    router.refresh();
  }

  return (
    <select
      className="h-8 rounded-md border border-white/10 bg-[#101114] px-2 text-xs text-zinc-300"
      value={currentId}
      onChange={(e) => handleChange(e.target.value)}
    >
      {workspaces.map((ws) => (
        <option key={ws.id} value={ws.id}>
          {ws.name}
        </option>
      ))}
    </select>
  );
}
