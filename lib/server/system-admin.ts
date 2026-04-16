import { getSupabaseAdmin } from "@/lib/supabase/server";

export const hasSystemAdmin = async (): Promise<boolean> => {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("role_assignments")
    .select("id", { count: "exact", head: true })
    .eq("role", "system_admin");

  if (error) {
    throw error;
  }

  return (count ?? 0) > 0;
};

