import { NextRequest, NextResponse } from "next/server";
import { getActorContext, getPrimaryRole } from "@/lib/server/actor-auth";
import { getActorProfileIdFromRequest } from "@/lib/server/request-context";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const actorProfileId = getActorProfileIdFromRequest(request);
    if (!actorProfileId) {
      return NextResponse.json({ error: "Missing actorProfileId" }, { status: 400 });
    }

    const actor = await getActorContext(actorProfileId);
    const primaryRole = getPrimaryRole(actor.roles);
    if (!primaryRole) {
      return NextResponse.json({ error: "Actor has no role" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id,display_name,email")
      .eq("id", actor.profileId)
      .single();

    if (profileError) throw profileError;

    return NextResponse.json({
      actor: {
        profileId: actor.profileId,
        displayName: profile.display_name,
        email: profile.email,
        roles: actor.roles,
        primaryRole,
        studentId: actor.studentId ?? null,
        branchAdminBranchId: actor.branchAdminBranchId ?? null,
        systemAdminCollegeId: actor.systemAdminCollegeId ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
