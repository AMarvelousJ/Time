import { NextRequest, NextResponse } from "next/server";
import { canCreateInBranch, getActorContext, getPrimaryRole } from "@/lib/server/actor-auth";
import { messageFromUnknown } from "@/lib/server/error-message";
import { getActorProfileIdFromRequest } from "@/lib/server/request-context";
import {
  createStudent,
  getActorStudentBranchId,
  listStudentsForActor,
} from "@/lib/server/student-repository";

export async function GET(request: NextRequest) {
  try {
    const actorProfileId = getActorProfileIdFromRequest(request);
    if (!actorProfileId) {
      return NextResponse.json(
        { error: "Missing actorProfileId" },
        { status: 400 }
      );
    }

    const actor = await getActorContext(actorProfileId);
    const role = getPrimaryRole(actor.roles);
    if (!role) {
      return NextResponse.json({ error: "Actor has no role" }, { status: 403 });
    }

    const persons = await listStudentsForActor(actor);
    return NextResponse.json({ persons });
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actorProfileId = getActorProfileIdFromRequest(request);
    if (!actorProfileId) {
      return NextResponse.json(
        { error: "Missing actorProfileId" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as {
      name?: string;
      partyBranchId?: string;
      studentProfileId?: string;
    };
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const actor = await getActorContext(actorProfileId);
    const role = getPrimaryRole(actor.roles);
    if (!role) return NextResponse.json({ error: "Actor has no role" }, { status: 403 });

    let targetPartyBranchId = body.partyBranchId;
    if (!targetPartyBranchId && role === "branch_admin") {
      targetPartyBranchId = actor.branchAdminBranchId;
    }
    if (!targetPartyBranchId && role === "student") {
      targetPartyBranchId = await getActorStudentBranchId(actor.profileId);
    }

    if (!targetPartyBranchId) {
      return NextResponse.json(
        { error: "partyBranchId is required for this actor" },
        { status: 400 }
      );
    }

    const allowed = await canCreateInBranch(actor, targetPartyBranchId);
    if (!allowed) {
      return NextResponse.json(
        { error: "No permission to create student in this branch" },
        { status: 403 }
      );
    }

    const person = await createStudent({
      name: body.name.trim(),
      partyBranchId: targetPartyBranchId,
      studentProfileId: body.studentProfileId ?? null,
      createdBy: actor.profileId,
    });

    return NextResponse.json({ person }, { status: 201 });
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
