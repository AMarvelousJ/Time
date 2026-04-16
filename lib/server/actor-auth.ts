import { getSupabaseAdmin } from "@/lib/supabase/server";

export type AppRole = "system_admin" | "branch_admin" | "student";

export interface ActorContext {
  profileId: string;
  roles: AppRole[];
  branchAdminBranchId?: string;
  systemAdminCollegeId?: string;
  studentId?: string;
}

const rolePriority: AppRole[] = ["system_admin", "branch_admin", "student"];

export const getPrimaryRole = (roles: AppRole[]): AppRole | null => {
  for (const role of rolePriority) {
    if (roles.includes(role)) return role;
  }
  return null;
};

export const getActorContext = async (
  actorProfileId: string
): Promise<ActorContext> => {
  const supabase = getSupabaseAdmin();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", actorProfileId)
    .single();

  if (profileError || !profile) {
    throw new Error("Actor profile not found");
  }

  const { data: assignments, error: assignmentError } = await supabase
    .from("role_assignments")
    .select("role,college_id,party_branch_id")
    .eq("profile_id", actorProfileId);

  if (assignmentError) {
    throw new Error(`Failed to load role assignments: ${assignmentError.message}`);
  }

  const roles = (assignments ?? []).map((row) => row.role as AppRole);
  const branchAdminAssignment = (assignments ?? []).find(
    (row) => row.role === "branch_admin"
  );
  const systemAdminAssignment = (assignments ?? []).find(
    (row) => row.role === "system_admin"
  );

  let studentId: string | undefined;
  if (roles.includes("student")) {
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("profile_id", actorProfileId)
      .maybeSingle();
    studentId = student?.id;
  }

  return {
    profileId: actorProfileId,
    roles,
    branchAdminBranchId: branchAdminAssignment?.party_branch_id ?? undefined,
    systemAdminCollegeId: systemAdminAssignment?.college_id ?? undefined,
    studentId,
  };
};

export const canAccessStudent = async (
  actor: ActorContext,
  targetStudentId: string
): Promise<boolean> => {
  const supabase = getSupabaseAdmin();

  const primaryRole = getPrimaryRole(actor.roles);
  if (!primaryRole) return false;

  if (primaryRole === "student") {
    return actor.studentId === targetStudentId;
  }

  const { data: targetStudent, error } = await supabase
    .from("students")
    .select("id,party_branch_id,party_branches(college_id)")
    .eq("id", targetStudentId)
    .single();

  if (error || !targetStudent) {
    return false;
  }

  if (primaryRole === "branch_admin") {
    return actor.branchAdminBranchId === targetStudent.party_branch_id;
  }

  const collegeId = Array.isArray(targetStudent.party_branches)
    ? targetStudent.party_branches[0]?.college_id
    : (targetStudent.party_branches as { college_id?: string } | null)?.college_id;
  return actor.systemAdminCollegeId === collegeId;
};

export const canCreateInBranch = async (
  actor: ActorContext,
  partyBranchId: string
): Promise<boolean> => {
  const supabase = getSupabaseAdmin();
  const primaryRole = getPrimaryRole(actor.roles);
  if (!primaryRole) return false;

  if (primaryRole === "student") {
    return false;
  }

  if (primaryRole === "branch_admin") {
    return actor.branchAdminBranchId === partyBranchId;
  }

  const { data: branch, error } = await supabase
    .from("party_branches")
    .select("college_id")
    .eq("id", partyBranchId)
    .single();

  if (error || !branch) return false;
  return actor.systemAdminCollegeId === branch.college_id;
};
