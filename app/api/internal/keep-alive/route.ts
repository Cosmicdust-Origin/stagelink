import { timingSafeEqual } from "node:crypto";

import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  if (!hasValidKeepAliveToken(request)) return new Response(null, { status: 401, headers: noStore });

  try {
    const { error } = await createServiceRoleClient().from("workspaces").select("id", { head: true }).limit(1);
    return new Response(null, { status: error ? 503 : 204, headers: noStore });
  } catch {
    return new Response(null, { status: 503, headers: noStore });
  }
}

function hasValidKeepAliveToken(request: Request) {
  const token = process.env.KEEP_ALIVE_TOKEN;
  if (!token) return false;

  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${token}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
