"use client";

import { getSupabaseClient } from "@/lib/supabase/client";

export const setActorCookie = (profileId: string) => {
  document.cookie = `actor_profile_id=${profileId}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
};

export const clearActorCookie = () => {
  document.cookie = "actor_profile_id=; Path=/; Max-Age=0; SameSite=Lax";
};

export const setSupabaseBrowserSession = async (
  accessToken: string | null,
  refreshToken: string | null
) => {
  if (!accessToken || !refreshToken) return;
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) throw error;
};

export const clearSupabaseBrowserSession = async () => {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
};
