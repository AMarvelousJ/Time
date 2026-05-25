import { NextRequest, NextResponse } from "next/server";
import { canAccessStudent, getActorContext } from "@/lib/server/actor-auth";
import { messageFromUnknown } from "@/lib/server/error-message";
import { getActorProfileIdFromRequest } from "@/lib/server/request-context";
import { updateTimelineSnapshotField } from "@/lib/server/timeline-repository";

interface RouteContext {
  params: Promise<{ studentId: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const actorProfileId = getActorProfileIdFromRequest(request);
    if (!actorProfileId) {
      return NextResponse.json(
        { error: "Missing actorProfileId" },
        { status: 400 }
      );
    }
    const { studentId } = await context.params;
    const body = (await request.json()) as {
      fieldKey?: string;
      value?: string | null;
    };

    if (!body.fieldKey) {
      return NextResponse.json({ error: "fieldKey is required" }, { status: 400 });
    }

    const actor = await getActorContext(actorProfileId);
    const allowed = await canAccessStudent(actor, studentId);
    if (!allowed) {
      return NextResponse.json({ error: "No permission" }, { status: 403 });
    }

    const payload = await updateTimelineSnapshotField({
      studentId,
      fieldKey: body.fieldKey,
      value: body.value ?? null,
      actorProfileId: actor.profileId,
    });
    return NextResponse.json(payload);
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
