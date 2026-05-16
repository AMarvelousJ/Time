import { NextRequest, NextResponse } from "next/server";
import { canAccessStudent, getActorContext } from "@/lib/server/actor-auth";
import { messageFromUnknown } from "@/lib/server/error-message";
import { getActorProfileIdFromRequest } from "@/lib/server/request-context";
import { getSupabaseAdmin } from "@/lib/supabase/server";

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

    const supabase = getSupabaseAdmin();
    const { data: existing, error: existingError } = await supabase
      .from("timeline_snapshots")
      .select("snapshot")
      .eq("student_id", studentId)
      .maybeSingle();
    if (existingError) throw existingError;

    const snapshot = ((existing?.snapshot as Record<string, string | null>) ?? {}) as Record<
      string,
      string | null
    >;
    const oldValue = Object.prototype.hasOwnProperty.call(snapshot, body.fieldKey)
      ? snapshot[body.fieldKey]
      : null;

    const nextSnapshot = { ...snapshot };
    if (body.value == null || body.value === "") {
      delete nextSnapshot[body.fieldKey];
    } else {
      nextSnapshot[body.fieldKey] = body.value;
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from("timeline_snapshots")
        .update({
          snapshot: nextSnapshot,
          updated_by: actor.profileId,
        })
        .eq("student_id", studentId);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase.from("timeline_snapshots").insert({
        student_id: studentId,
        snapshot: nextSnapshot,
        updated_by: actor.profileId,
      });
      if (insertError) throw insertError;
    }

    const { error: logError } = await supabase.from("timeline_change_logs").insert({
      student_id: studentId,
      field_key: body.fieldKey,
      old_value: oldValue,
      new_value: body.value ?? null,
      actor_profile_id: actor.profileId,
    });
    if (logError) throw logError;

    return NextResponse.json({
      ok: true,
      fieldKey: body.fieldKey,
      oldValue,
      newValue: body.value ?? null,
      snapshot: nextSnapshot,
    });
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
