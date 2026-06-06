import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) process.env[key] = value;
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function createConfirmedUser(admin, email, password, role = "admin") {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: email.split("@")[0],
      role,
    },
  });
  if (error) throw error;
  if (!data.user?.id) throw new Error(`Failed to create ${email}`);
  return data.user.id;
}

async function cleanup(admin, ids) {
  const failures = [];

  for (const eventId of ids.events.reverse()) {
    const { error } = await admin.from("events").delete().eq("id", eventId);
    if (error) failures.push(`event ${eventId}: ${error.message}`);
  }

  for (const groupId of ids.groups.reverse()) {
    const { error } = await admin.from("groups").delete().eq("id", groupId);
    if (error) failures.push(`group ${groupId}: ${error.message}`);
  }

  for (const workspaceId of ids.workspaces.reverse()) {
    const { error } = await admin.from("workspaces").delete().eq("id", workspaceId);
    if (error) failures.push(`workspace ${workspaceId}: ${error.message}`);
  }

  for (const userId of ids.users.reverse()) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) failures.push(`user ${userId}: ${error.message}`);
  }

  if (failures.length) {
    console.warn("Cleanup warnings:");
    for (const failure of failures) console.warn(`- ${failure}`);
  }
}

loadLocalEnv();

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ids = { users: [], workspaces: [], groups: [], events: [] };
const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const password = `SecurityAudit-${stamp}!`;
const emailA = `security-a-${stamp}@stagelink.local`;
const emailB = `security-b-${stamp}@stagelink.local`;

try {
  const userA = await createConfirmedUser(admin, emailA, password);
  const userB = await createConfirmedUser(admin, emailB, password);
  ids.users.push(userA, userB);

  const { data: workspaceA, error: workspaceAError } = await admin
    .from("workspaces")
    .insert({ name: `Security Audit A ${stamp}`, owner_id: userA })
    .select("id")
    .single();
  if (workspaceAError) throw workspaceAError;
  ids.workspaces.push(workspaceA.id);

  const { data: workspaceB, error: workspaceBError } = await admin
    .from("workspaces")
    .insert({ name: `Security Audit B ${stamp}`, owner_id: userB })
    .select("id")
    .single();
  if (workspaceBError) throw workspaceBError;
  ids.workspaces.push(workspaceB.id);

  const { data: groupA, error: groupError } = await admin
    .from("groups")
    .insert({ name: `Security Audit Group ${stamp}`, workspace_id: workspaceA.id })
    .select("id")
    .single();
  if (groupError) throw groupError;
  ids.groups.push(groupA.id);

  const { data: eventA, error: eventError } = await admin
    .from("events")
    .insert({
      title: `Security Audit Event ${stamp}`,
      event_type: "live",
      group_id: groupA.id,
      workspace_id: workspaceA.id,
      start_at: "2026-06-01T10:00:00+09:00",
      end_at: "2026-06-01T12:00:00+09:00",
      created_by: userA,
    })
    .select("id")
    .single();
  if (eventError) throw eventError;
  ids.events.push(eventA.id);

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await userClient.auth.signInWithPassword({
    email: emailB,
    password,
  });
  if (signInError) throw signInError;

  const checks = [];
  const { data: directEvents, error: directEventsError } = await userClient
    .from("events")
    .select("id")
    .eq("id", eventA.id);
  checks.push(["cross-workspace direct event lookup", directEventsError, directEvents?.length ?? 0]);

  const { data: listedEvents, error: listedEventsError } = await userClient.from("events").select("id");
  checks.push(["cross-workspace event listing", listedEventsError, listedEvents?.length ?? 0]);

  const { data: directGroups, error: directGroupsError } = await userClient
    .from("groups")
    .select("id")
    .eq("id", groupA.id);
  checks.push(["cross-workspace direct group lookup", directGroupsError, directGroups?.length ?? 0]);

  const failures = checks.filter(([, error, count]) => error || count !== 0);
  if (failures.length) {
    for (const [name, error, count] of failures) {
      console.error(`${name}: expected 0 rows, got ${count}${error ? ` (${error.message})` : ""}`);
    }
    throw new Error("Security audit failed");
  }

  console.log("Security audit passed");
  for (const [name] of checks) console.log(`- ${name}: blocked`);
} finally {
  await cleanup(admin, ids);
}
