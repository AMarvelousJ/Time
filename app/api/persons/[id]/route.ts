import { NextRequest, NextResponse } from "next/server";
import { canAccessStudent, getActorContext } from "@/lib/server/actor-auth";
import { messageFromUnknown } from "@/lib/server/error-message";
import { getActorProfileIdFromRequest } from "@/lib/server/request-context";
import { deleteStudent, updateStudent } from "@/lib/server/student-repository";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const actorProfileId = getActorProfileIdFromRequest(request);
    if (!actorProfileId) {
      return NextResponse.json(
        { error: "Missing actorProfileId" },
        { status: 400 }
      );
    }
    const { id } = await context.params;
    const body = (await request.json()) as { name?: string; status?: string };

    const actor = await getActorContext(actorProfileId);
    const allowed = await canAccessStudent(actor, id);
    if (!allowed) {
      return NextResponse.json({ error: "No permission" }, { status: 403 });
    }

    const updatePayload: Record<string, string> = {};
    if (body.name?.trim()) updatePayload.full_name = body.name.trim();
    if (body.status) updatePayload.status = body.status;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const person = await updateStudent(id, updatePayload);
    return NextResponse.json({ person });
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const actorProfileId = getActorProfileIdFromRequest(request);
    if (!actorProfileId) {
      return NextResponse.json(
        { error: "Missing actorProfileId" },
        { status: 400 }
      );
    }
    const { id } = await context.params;
    const actor = await getActorContext(actorProfileId);
    const allowed = await canAccessStudent(actor, id);
    if (!allowed) {
      return NextResponse.json({ error: "No permission" }, { status: 403 });
    }

    await deleteStudent(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
