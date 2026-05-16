import { NextRequest, NextResponse } from "next/server";
import { canAccessStudent, getActorContext } from "@/lib/server/actor-auth";
import { messageFromUnknown } from "@/lib/server/error-message";
import { getActorProfileIdFromRequest } from "@/lib/server/request-context";
import { getSupabaseAdmin } from "@/lib/supabase/server";

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

    const supabase = getSupabaseAdmin();
    const { data: snapshotRow, error: snapshotError } = await supabase
      .from("timeline_snapshots")
      .select("snapshot,updated_at")
      .eq("student_id", studentId)
      .maybeSingle();

    if (snapshotError) throw snapshotError;

    const { data: logs, error: logError } = await supabase
      .from("timeline_change_logs")
      .select("created_at,actor_profile_id,field_key,old_value,new_value")
      .eq("student_id", studentId)
      .order("created_at", { ascending: true });

    if (logError) throw logError;

    return NextResponse.json({
      studentId,
      snapshot: (snapshotRow?.snapshot as Record<string, unknown> | null) ?? {},
      updatedAt: snapshotRow?.updated_at ?? null,
      logs: logs ?? [],
    });
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
