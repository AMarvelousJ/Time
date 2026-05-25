import { NextRequest, NextResponse } from "next/server";
import { getActorContext, getPrimaryRole } from "@/lib/server/actor-auth";
import { messageFromUnknown } from "@/lib/server/error-message";
import { ensureProfileExists } from "@/lib/server/profile-bootstrap";
import { getActorProfileIdFromRequest } from "@/lib/server/request-context";
import { getSupabaseAdmin } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const actorProfileId = getActorProfileIdFromRequest(request);
    if (!actorProfileId) {
      return NextResponse.json({ error: "Missing actorProfileId" }, { status: 400 });
    }

    await ensureProfileExists(actorProfileId);
    const actor = await getActorContext(actorProfileId);
    const role = getPrimaryRole(actor.roles);
    if (!role || role === "student") {
      return NextResponse.json({ error: "No permission to reject requests" }, { status: 403 });
    }
    if (role === "branch_admin" && !actor.branchAdminBranchId) {
      return NextResponse.json({ error: "当前普通管理员未绑定支部，无法审批" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { note?: string };
    const supabase = getSupabaseAdmin();

    const { data: requestRow, error: requestError } = await supabase
      .from("registration_requests")
      .select("*")
      .eq("id", id)
      .single();
    if (requestError) throw requestError;

    if (requestRow.status !== "pending") {
      return NextResponse.json({ error: "该申请已处理，无需重复操作" }, { status: 409 });
    }

    if (requestRow.requested_role === "branch_admin" && role !== "system_admin") {
      return NextResponse.json({ error: "Only system admin can reject branch admin requests" }, { status: 403 });
    }

    if (
      requestRow.requested_role === "student" &&
      role === "branch_admin" &&
      requestRow.party_branch_id !== actor.branchAdminBranchId
    ) {
      return NextResponse.json({ error: "No permission for this branch request" }, { status: 403 });
    }

    const { data: updatedRequests, error: updateError } = await supabase
      .from("registration_requests")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewer_profile_id: actor.profileId,
        decision_source_profile_id: actor.profileId,
        decision_source_role: role,
        review_note: body.note?.trim() || requestRow.review_note,
      })
      .eq("applicant_user_id", requestRow.applicant_user_id)
      .eq("requested_role", requestRow.requested_role)
      .eq("status", "pending")
      .select("id")
      .returns<Array<{ id: string }>>();
    if (updateError) throw updateError;

    return NextResponse.json({
      ok: true,
      affectedRequestIds: updatedRequests.map((item) => item.id),
    });
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
