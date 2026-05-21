import { apiFetch } from "@/lib/services/api-client";

export type RequestedRole = "student" | "branch_admin";
export type RegistrationStatus = "pending" | "approved" | "rejected";

export interface RegistrationRequest {
  id: string;
  requested_role: RequestedRole;
  applicant_user_id: string | null;
  email: string;
  display_name: string;
  phone: string | null;
  class_name: string | null;
  cohort_year: string | null;
  party_branch_id: string | null;
  party_branch_name: string;
  college_name: string;
  status: RegistrationStatus;
  review_note: string | null;
  reviewer_profile_id: string | null;
  decision_source_role: "system_admin" | "branch_admin" | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface PartyBranchOption {
  id: string;
  name: string;
  collegeId: string;
  collegeName: string;
}

export const listPartyBranches = async (): Promise<PartyBranchOption[]> => {
  const payload = await apiFetch<{ branches: PartyBranchOption[] }>("/api/party-branches");
  return payload.branches;
};

export const createRegistrationRequest = async (input: {
  requestedRole: RequestedRole;
  email: string;
  password: string;
  displayName: string;
  phone: string;
  className?: string;
  cohortYear?: string;
  partyBranchId?: string;
  note?: string;
}) => {
  return apiFetch<{ request: RegistrationRequest }>("/api/registration-requests", {
    method: "POST",
    body: JSON.stringify(input),
  });
};

export const listRegistrationRequests = async (params?: {
  mine?: boolean;
  status?: "pending" | "approved" | "rejected" | "all";
  requestedRole?: RequestedRole;
}) => {
  const query = new URLSearchParams();
  if (params?.mine) query.set("mine", "1");
  if (params?.status) query.set("status", params.status);
  if (params?.requestedRole) query.set("requestedRole", params.requestedRole);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<{ requests: RegistrationRequest[] }>(`/api/registration-requests${suffix}`);
};

export const approveRegistrationRequest = async (
  id: string,
  options?: { partyBranchId?: string }
) => {
  return apiFetch<{ ok: boolean }>(`/api/registration-requests/${id}/approve`, {
    method: "POST",
    body: JSON.stringify(options ?? {}),
  });
};

export const rejectRegistrationRequest = async (id: string, note?: string) => {
  return apiFetch<{ ok: boolean }>(`/api/registration-requests/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
};

export const bootstrapAuthProfile = async (actorProfileId?: string) => {
  const suffix = actorProfileId ? `?actorProfileId=${encodeURIComponent(actorProfileId)}` : "";
  return apiFetch<{ ok: boolean }>(`/api/auth/bootstrap${suffix}`, { method: "POST" });
};
