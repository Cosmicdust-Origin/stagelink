import { handleApiError, json, parseJson, requireRole } from "@/lib/api/auth";

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireRole(["admin"]);
    const body = await parseJson<{ label: string; is_default?: boolean }>(request);
    const { data, error } = await supabase
      .from("checklist_templates")
      .insert({ label: body.label, is_default: body.is_default ?? false, created_by: user.id })
      .select("*")
      .single();

    if (error) throw error;
    return json({ template: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
