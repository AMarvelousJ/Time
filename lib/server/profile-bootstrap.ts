import { getSupabaseAdmin } from "@/lib/supabase/server";

export const ensureProfileExists = async (profileId: string) => {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: queryError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .maybeSingle();

  if (queryError) throw queryError;
  if (existing?.id) return;

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profileId);
  if (userError) throw userError;

  const email = userData.user?.email ?? null;
  const displayName =
    (userData.user?.user_metadata?.display_name as string | undefined) ??
    (userData.user?.email?.split("@")[0] ?? "未命名用户");

  const { error: insertError } = await supabase.from("profiles").insert({
    id: profileId,
    display_name: displayName,
    email,
  });

  if (insertError) throw insertError;
};
