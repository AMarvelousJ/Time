import { apiFetch } from "@/lib/services/api-client";

export type AppRole = "system_admin" | "branch_admin" | "student";

export interface ActorInfo {
  profileId: string;
  displayName: string | null;
  email: string | null;
  roles: AppRole[];
  primaryRole: AppRole;
  studentId: string | null;
  branchAdminBranchId: string | null;
  systemAdminCollegeId: string | null;
}

export const getCurrentActor = async (): Promise<ActorInfo> => {
  const payload = await apiFetch<{ actor: ActorInfo }>("/api/me");
  return payload.actor;
};
