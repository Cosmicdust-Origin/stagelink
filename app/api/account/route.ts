import { handleApiError, json, parseJson, requireUser } from "@/lib/api/auth";

type AccountBody = {
  name?: string;
  phone?: string;
  password?: string;
};

export async function PATCH(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const body = await parseJson<AccountBody>(request);

    // Update auth user (password and/or display name in metadata)
    if (body.password || body.name !== undefined) {
      const updateData: { password?: string; data?: { name: string } } = {};
      if (body.password) updateData.password = body.password;
      if (body.name !== undefined) updateData.data = { name: body.name };

      const { error } = await supabase.auth.updateUser(updateData);
      if (error) throw error;
    }

    // Update profile row
    const profileUpdate: Record<string, unknown> = {};
    if (body.name !== undefined) profileUpdate.name = body.name;
    if (body.phone !== undefined) profileUpdate.phone = body.phone;

    if (Object.keys(profileUpdate).length > 0) {
      const { error } = await supabase.from("profiles").update(profileUpdate).eq("id", user.id);
      if (error) throw error;
    }

    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
