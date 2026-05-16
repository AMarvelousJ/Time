import { NextRequest, NextResponse } from "next/server";
import { messageFromUnknown } from "@/lib/server/error-message";
import { ensureProfileExists } from "@/lib/server/profile-bootstrap";
import { getActorProfileIdFromRequest } from "@/lib/server/request-context";

export async function POST(request: NextRequest) {
  try {
    const actorProfileId = getActorProfileIdFromRequest(request);
    if (!actorProfileId) {
      return NextResponse.json({ error: "Missing actorProfileId" }, { status: 400 });
    }

    await ensureProfileExists(actorProfileId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
