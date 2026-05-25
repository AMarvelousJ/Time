import { NextRequest, NextResponse } from "next/server";
import { getActorContext, getPrimaryRole } from "@/lib/server/actor-auth";
import { messageFromUnknown } from "@/lib/server/error-message";
import { ensureProfileExists } from "@/lib/server/profile-bootstrap";
import { getActorProfileIdFromRequest } from "@/lib/server/request-context";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type RequestedRole = "student" | "branch_admin";
type RegistrationRequestRow = {
  id: string;
  applicant_user_id: string | null;
  requested_role: RequestedRole;
};

const filterAlreadyAssignedPendingRequests = async <T extends RegistrationRequestRow>(
  requests: T[],
  status: string
) => {
  if (status !== "pending" || requests.length === 0) return requests;

  const applicantIds = Array.from(
    new Set(
      requests
        .map((item) => item.applicant_user_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  if (applicantIds.length === 0) return requests;

  const supabase = getSupabaseAdmin();
  const { data: assignedRoles, error } = await supabase
    .from("role_assignments")
    .select("profile_id,role")
    .in("profile_id", applicantIds)
    .in("role", ["student", "branch_admin"]);
  if (error) throw error;

  const assignedRoleKeys = new Set(
    (assignedRoles ?? []).map((item) => `${item.profile_id}:${item.role}`)
  );

  return requests.filter((item) => {
    if (!item.applicant_user_id) return true;
    return !assignedRoleKeys.has(`${item.applicant_user_id}:${item.requested_role}`);
  });
};

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const actorProfileId = getActorProfileIdFromRequest(request);
    if (!actorProfileId) {
      return NextResponse.json({ error: "Missing actorProfileId" }, { status: 400 });
    }

    await ensureProfileExists(actorProfileId);
    const actor = await getActorContext(actorProfileId);
    const role = getPrimaryRole(actor.roles);
    const mine = request.nextUrl.searchParams.get("mine") === "1";
    const status = request.nextUrl.searchParams.get("status") ?? "pending";
    const requestedRole = request.nextUrl.searchParams.get("requestedRole");

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("registration_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (requestedRole) {
      query = query.eq("requested_role", requestedRole);
    }

    if (mine || !role) {
      query = query.eq("applicant_user_id", actor.profileId);
    } else if (role === "branch_admin") {
      if (!actor.branchAdminBranchId) {
        return NextResponse.json({ requests: [] });
      }
      query = query.eq("requested_role", "student").eq("party_branch_id", actor.branchAdminBranchId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const requests = await filterAlreadyAssignedPendingRequests(
      ((data ?? []) as RegistrationRequestRow[]) as typeof data,
      status
    );

    return NextResponse.json({ requests });
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actorProfileId = getActorProfileIdFromRequest(request);
    const body = (await request.json()) as {
      requestedRole?: RequestedRole;
      email?: string;
      password?: string;
      displayName?: string;
      phone?: string;
      className?: string;
      cohortYear?: string;
      partyBranchId?: string;
      note?: string;
    };

    if (!body.requestedRole || body.requestedRole !== "student") {
      if (body.requestedRole === "branch_admin") {
        return NextResponse.json(
          { error: "普通管理员账号仅可由系统管理员创建，不支持自助申请" },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: "Invalid requestedRole" }, { status: 400 });
    }

    if (!body.displayName?.trim()) {
      return NextResponse.json({ error: "displayName is required" }, { status: 400 });
    }
    if (!body.phone?.trim()) {
      return NextResponse.json({ error: "phone is required" }, { status: 400 });
    }
    if (!body.email?.trim() || !body.email.includes("@")) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    if (!body.password || body.password.length < 6) {
      return NextResponse.json({ error: "password is required and must be at least 6 chars" }, { status: 400 });
    }
    if (body.requestedRole === "student" && (!body.className?.trim() || !body.cohortYear?.trim())) {
      return NextResponse.json({ error: "className and cohortYear are required for student" }, { status: 400 });
    }
    if (body.requestedRole === "student" && !body.partyBranchId) {
      return NextResponse.json({ error: "partyBranchId is required for student" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const normalizedEmail = body.email.trim().toLowerCase();

    let applicantProfileId: string;
    if (actorProfileId) {
      await ensureProfileExists(actorProfileId);
      const actor = await getActorContext(actorProfileId);
      const role = getPrimaryRole(actor.roles);
      if (role) {
        return NextResponse.json(
          { error: "Role already assigned, no need to register again" },
          { status: 400 }
        );
      }
      applicantProfileId = actor.profileId;

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          email: normalizedEmail,
          display_name: body.displayName.trim(),
        })
        .eq("id", applicantProfileId);
      if (profileUpdateError) throw profileUpdateError;
    } else {
      const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: body.password,
        email_confirm: true,
        user_metadata: { display_name: body.displayName.trim() },
      });
      if (createUserError) {
        return NextResponse.json(
          { error: `创建账号失败：${createUserError.message}` },
          { status: 400 }
        );
      }

      applicantProfileId = createdUser.user?.id as string;
      if (!applicantProfileId) {
        return NextResponse.json({ error: "账号创建失败" }, { status: 500 });
      }

      const { error: profileInsertError } = await supabase.from("profiles").insert({
        id: applicantProfileId,
        display_name: body.displayName.trim(),
        email: normalizedEmail,
      });
      if (profileInsertError) throw profileInsertError;
    }

    const { data: existingPending } = await supabase
      .from("registration_requests")
      .select("id")
      .eq("applicant_user_id", applicantProfileId)
      .eq("requested_role", body.requestedRole)
      .eq("status", "pending")
      .maybeSingle();

    if (existingPending?.id) {
      return NextResponse.json({ error: "You already have a pending request" }, { status: 409 });
    }

    const { data: differentRoleRequest } = await supabase
      .from("registration_requests")
      .select("id")
      .eq("applicant_user_id", applicantProfileId)
      .neq("requested_role", body.requestedRole)
      .limit(1)
      .maybeSingle();
    if (differentRoleRequest?.id) {
      return NextResponse.json(
        { error: "一个账号只能申请一个角色，请保持与历史申请角色一致" },
        { status: 409 }
      );
    }

    let partyBranchId: string | null = null;
    let partyBranchName = "待系统管理员分配";
    let collegeName = "待系统管理员分配";
    if (body.requestedRole === "student") {
      const { data: branch, error: branchError } = await supabase
        .from("party_branches")
        .select("id,name,college_id,colleges(name)")
        .eq("id", body.partyBranchId!)
        .single();
      if (branchError) throw branchError;

      partyBranchId = branch.id;
      partyBranchName = branch.name;
      collegeName = Array.isArray(branch.colleges)
        ? branch.colleges[0]?.name ?? ""
        : (branch.colleges as { name?: string } | null)?.name ?? "";
    }

    const { data: created, error: createError } = await supabase
      .from("registration_requests")
      .insert({
        requested_role: body.requestedRole,
        applicant_user_id: applicantProfileId,
        email: normalizedEmail,
        display_name: body.displayName.trim(),
        phone: body.phone.trim(),
        class_name: body.className?.trim() ?? null,
        cohort_year: body.cohortYear?.trim() ?? null,
        party_branch_id: partyBranchId,
        party_branch_name: partyBranchName,
        college_name: collegeName,
        review_note: body.note?.trim() ?? null,
        status: "pending",
      })
      .select("*")
      .single();

    if (createError) throw createError;

    return NextResponse.json({ request: created }, { status: 201 });
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
