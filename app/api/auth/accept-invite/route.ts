import { handleApiError, json, parseJson, requireUser } from "@/lib/api/auth";

type AcceptInviteBody = {
  name: string;
  password: string;
};

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const body = await parseJson<AcceptInviteBody>(request);

    const { error: authError } = await supabase.auth.updateUser({
      password: body.password,
      data: { name: body.name },
    });
    if (authError) throw authError;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ name: body.name })
      .eq("id", user.id);
    if (profileError) throw profileError;

    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
