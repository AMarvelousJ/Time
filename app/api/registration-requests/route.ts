import { NextRequest, NextResponse } from "next/server";
import { getActorContext, getPrimaryRole } from "@/lib/server/actor-auth";
import { messageFromUnknown } from "@/lib/server/error-message";
import { ensureProfileExists } from "@/lib/server/profile-bootstrap";
import { withNoStoreHeaders } from "@/lib/server/no-store-response";
import { getActorProfileIdFromRequest } from "@/lib/server/request-context";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type RequestedRole = "student" | "branch_admin";
type RegistrationRequestRow = {
  id: string;
  applicant_user_id: string | null;
  email: string;
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
  const requestEmails = Array.from(
    new Set(
      requests
        .map((item) => item.email?.trim().toLowerCase())
        .filter((email): email is string => Boolean(email))
    )
  );
  if (applicantIds.length === 0 && requestEmails.length === 0) return requests;

  const supabase = getSupabaseAdmin();
  const profileIdsFromEmail = new Set<string>();
  const emailsByProfileId = new Map<string, string>();
  if (requestEmails.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id,email")
      .in("email", requestEmails);
    if (profilesError) throw profilesError;

    (profiles ?? []).forEach((profile) => {
      profileIdsFromEmail.add(profile.id);
      if (profile.email) {
        emailsByProfileId.set(profile.id, profile.email.trim().toLowerCase());
      }
    });
  }

  const candidateProfileIds = Array.from(
    new Set([...applicantIds, ...profileIdsFromEmail])
  );
  if (candidateProfileIds.length === 0) return requests;

  const { data: assignedRoles, error: assignedRolesError } = await supabase
    .from("role_assignments")
    .select("profile_id,role")
    .in("profile_id", candidateProfileIds)
    .in("role", ["student", "branch_admin"]);
  if (assignedRolesError) throw assignedRolesError;

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("profile_id")
    .in("profile_id", candidateProfileIds);
  if (studentsError) throw studentsError;

  const assignedRoleKeys = new Set(
    (assignedRoles ?? []).map((item) => `${item.profile_id}:${item.role}`)
  );
  const assignedRoleEmailKeys = new Set(
    (assignedRoles ?? [])
      .map((item) => {
        const email = emailsByProfileId.get(item.profile_id);
        return email ? `${email}:${item.role}` : null;
      })
      .filter((key): key is string => Boolean(key))
  );
  const studentProfileIds = new Set((students ?? []).map((item) => item.profile_id));
  const studentEmails = new Set(
    (students ?? [])
      .map((item) => item.profile_id ? emailsByProfileId.get(item.profile_id) : null)
      .filter((email): email is string => Boolean(email))
  );

  return requests.filter((item) => {
    const requestEmail = item.email?.trim().toLowerCase();
    if (item.requested_role === "student" && requestEmail && studentEmails.has(requestEmail)) {
      return false;
    }
    if (requestEmail && assignedRoleEmailKeys.has(`${requestEmail}:${item.requested_role}`)) {
      return false;
    }
    if (!item.applicant_user_id) return true;
    if (item.requested_role === "student" && studentProfileIds.has(item.applicant_user_id)) {
      return false;
    }
    return !assignedRoleKeys.has(`${item.applicant_user_id}:${item.requested_role}`);
  });
};

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const actorProfileId = getActorProfileIdFromRequest(request);
    if (!actorProfileId) {
      return NextResponse.json(
        { error: "Missing actorProfileId" },
        withNoStoreHeaders({ status: 400 })
      );
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
        return NextResponse.json({ requests: [] }, withNoStoreHeaders());
      }
      query = query.eq("requested_role", "student").eq("party_branch_id", actor.branchAdminBranchId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const requests = await filterAlreadyAssignedPendingRequests(
      ((data ?? []) as RegistrationRequestRow[]) as typeof data,
      status
    );

    return NextResponse.json({ requests }, withNoStoreHeaders());
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, withNoStoreHeaders({ status: 500 }));
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
          withNoStoreHeaders({ status: 403 })
        );
      }
      return NextResponse.json({ error: "Invalid requestedRole" }, withNoStoreHeaders({ status: 400 }));
    }

    if (!body.displayName?.trim()) {
      return NextResponse.json({ error: "displayName is required" }, withNoStoreHeaders({ status: 400 }));
    }
    if (!body.phone?.trim()) {
      return NextResponse.json({ error: "phone is required" }, withNoStoreHeaders({ status: 400 }));
    }
    if (!body.email?.trim() || !body.email.includes("@")) {
      return NextResponse.json({ error: "email is required" }, withNoStoreHeaders({ status: 400 }));
    }
    if (!body.password || body.password.length < 6) {
      return NextResponse.json({ error: "password is required and must be at least 6 chars" }, withNoStoreHeaders({ status: 400 }));
    }
    if (body.requestedRole === "student" && (!body.className?.trim() || !body.cohortYear?.trim())) {
      return NextResponse.json({ error: "className and cohortYear are required for student" }, withNoStoreHeaders({ status: 400 }));
    }
    if (body.requestedRole === "student" && !body.partyBranchId) {
      return NextResponse.json({ error: "partyBranchId is required for student" }, withNoStoreHeaders({ status: 400 }));
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
          withNoStoreHeaders({ status: 400 })
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
          withNoStoreHeaders({ status: 400 })
        );
      }

      applicantProfileId = createdUser.user?.id as string;
      if (!applicantProfileId) {
        return NextResponse.json({ error: "账号创建失败" }, withNoStoreHeaders({ status: 500 }));
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
      return NextResponse.json({ error: "You already have a pending request" }, withNoStoreHeaders({ status: 409 }));
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
        withNoStoreHeaders({ status: 409 })
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

    return NextResponse.json({ request: created }, withNoStoreHeaders({ status: 201 }));
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, withNoStoreHeaders({ status: 500 }));
  }
}
