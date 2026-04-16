"use client";

export const setActorCookie = (profileId: string) => {
  document.cookie = `actor_profile_id=${profileId}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
};

export const clearActorCookie = () => {
  document.cookie = "actor_profile_id=; Path=/; Max-Age=0; SameSite=Lax";
};
