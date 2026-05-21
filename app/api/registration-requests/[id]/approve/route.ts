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
      return NextResponse.json({ error: "No permission to approve requests" }, { status: 403 });
    }
    if (role === "branch_admin" && !actor.branchAdminBranchId) {
      return NextResponse.json({ error: "当前普通管理员未绑定支部，无法审批" }, { status: 403 });
    }

    const { id } = await context.params;
    const supabase = getSupabaseAdmin();
    const { data: requestRow, error: requestError } = await supabase
      .from("registration_requests")
      .select("*")
      .eq("id", id)
      .single();
    if (requestError) throw requestError;

    if (requestRow.status !== "pending") {
      return NextResponse.json({ error: "Request is already processed" }, { status: 409 });
    }

    if (requestRow.requested_role === "branch_admin" && role !== "system_admin") {
      return NextResponse.json({ error: "Only system admin can approve branch admin requests" }, { status: 403 });
    }

    if (
      requestRow.requested_role === "student" &&
      role === "branch_admin" &&
      requestRow.party_branch_id !== actor.branchAdminBranchId
    ) {
      return NextResponse.json({ error: "No permission for this branch request" }, { status: 403 });
    }

    const applicantProfileId = requestRow.applicant_user_id as string | null;
    if (!applicantProfileId) {
      return NextResponse.json({ error: "Request missing applicant profile id" }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as { partyBranchId?: string };
    let assignedPartyBranchId: string | null = requestRow.party_branch_id as string | null;
    let assignedPartyBranchName = requestRow.party_branch_name as string | null;

    if (requestRow.requested_role === "branch_admin") {
      const partyBranchId = body.partyBranchId?.trim();
      if (!partyBranchId) {
        return NextResponse.json({ error: "审批普通管理员申请时必须选择党支部" }, { status: 400 });
      }

      const { data: branch, error: branchError } = await supabase
        .from("party_branches")
        .select("id,name,college_id")
        .eq("id", partyBranchId)
        .maybeSingle();
      if (branchError) throw branchError;
      if (!branch?.id) {
        return NextResponse.json({ error: "所选党支部不存在" }, { status: 400 });
      }
      if (branch.college_id !== actor.systemAdminCollegeId) {
        return NextResponse.json({ error: "无权分配其他学院的党支部" }, { status: 403 });
      }

      const { data: existingBranchAdmin, error: existingAdminError } = await supabase
        .from("role_assignments")
        .select("profile_id")
        .eq("role", "branch_admin")
        .eq("party_branch_id", partyBranchId)
        .neq("profile_id", applicantProfileId)
        .maybeSingle();
      if (existingAdminError) throw existingAdminError;
      if (existingBranchAdmin?.profile_id) {
        return NextResponse.json({ error: "该党支部已有普通管理员，请选择其他支部" }, { status: 409 });
      }

      assignedPartyBranchId = branch.id;
      assignedPartyBranchName = branch.name;
    }

    if (requestRow.requested_role === "student") {
      const { error: roleError } = await supabase
        .from("role_assignments")
        .insert({
          profile_id: applicantProfileId,
          role: "student",
        });
      if (roleError && !roleError.message.includes("duplicate")) throw roleError;

      const { data: existingStudent } = await supabase
        .from("students")
        .select("id")
        .eq("profile_id", applicantProfileId)
        .maybeSingle();

      let studentId = existingStudent?.id as string | undefined;
      if (!studentId) {
        const { data: createdStudent, error: studentError } = await supabase
          .from("students")
          .insert({
            full_name: requestRow.display_name,
            party_branch_id: requestRow.party_branch_id,
            profile_id: applicantProfileId,
            created_by: actor.profileId,
            status: "progress",
          })
          .select("id")
          .single();
        if (studentError) throw studentError;
        studentId = createdStudent.id;
      }

      const { data: snapshot } = await supabase
        .from("timeline_snapshots")
        .select("id")
        .eq("student_id", studentId!)
        .maybeSingle();

      if (!snapshot?.id) {
        const { error: snapshotError } = await supabase
          .from("timeline_snapshots")
          .insert({
            student_id: studentId,
            snapshot: {},
            updated_by: actor.profileId,
          });
        if (snapshotError) throw snapshotError;
      }
    } else {
      const { error: roleError } = await supabase
        .from("role_assignments")
        .insert({
          profile_id: applicantProfileId,
          role: "branch_admin",
          party_branch_id: assignedPartyBranchId,
        });
      if (roleError && !roleError.message.includes("duplicate")) throw roleError;

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({ college_id: actor.systemAdminCollegeId })
        .eq("id", applicantProfileId);
      if (profileUpdateError) throw profileUpdateError;
    }

    const { error: updateError } = await supabase
      .from("registration_requests")
      .update({
        status: "approved",
        party_branch_id: assignedPartyBranchId,
        party_branch_name: assignedPartyBranchName,
        reviewed_at: new Date().toISOString(),
        reviewer_profile_id: actor.profileId,
        decision_source_profile_id: actor.profileId,
        decision_source_role: role,
      })
      .eq("id", id);
    if (updateError) throw updateError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
