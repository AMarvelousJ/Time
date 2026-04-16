import { NextRequest } from "next/server";

const bootstrapActorId = process.env.NEXT_PUBLIC_BOOTSTRAP_ACTOR_ID;

export const getActorProfileIdFromRequest = (
  request: NextRequest
): string | null => {
  const fromHeader = request.headers.get("x-actor-profile-id");
  if (fromHeader) return fromHeader;

  const fromQuery = request.nextUrl.searchParams.get("actorProfileId");
  if (fromQuery) return fromQuery;

  if (bootstrapActorId) return bootstrapActorId;
  return null;
};
