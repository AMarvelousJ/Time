import { NextRequest, NextResponse } from "next/server";
import { canAccessStudent, getActorContext } from "@/lib/server/actor-auth";
import { messageFromUnknown } from "@/lib/server/error-message";
import { getActorProfileIdFromRequest } from "@/lib/server/request-context";
import { getTimelineSnapshotWithLogs } from "@/lib/server/timeline-repository";

interface RouteContext {
  params: Promise<{ studentId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const actorProfileId = getActorProfileIdFromRequest(request);
    if (!actorProfileId) {
      return NextResponse.json(
        { error: "Missing actorProfileId" },
        { status: 400 }
      );
    }
    const { studentId } = await context.params;
    const actor = await getActorContext(actorProfileId);
    const allowed = await canAccessStudent(actor, studentId);
    if (!allowed) {
      return NextResponse.json({ error: "No permission" }, { status: 403 });
    }

    const payload = await getTimelineSnapshotWithLogs(studentId);
    return NextResponse.json(payload);
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
