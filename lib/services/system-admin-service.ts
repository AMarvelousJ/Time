import { apiFetch } from "@/lib/services/api-client";

export interface BranchAdminOption {
  profileId: string;
  displayName: string;
  email: string;
}

export const listUnassignedBranchAdmins = async () => {
  return apiFetch<{ options: BranchAdminOption[] }>("/api/system/branch-admins");
};

export const createBranchAdminAccount = async (input: {
  displayName: string;
  email: string;
  password: string;
}) => {
  return apiFetch<{ admin: BranchAdminOption }>("/api/system/branch-admins", {
    method: "POST",
    body: JSON.stringify(input),
  });
};

export const createPartyBranch = async (input: {
  name: string;
  secretaryProfileId: string;
}) => {
  return apiFetch<{ branch: { id: string; name: string } }>("/api/system/party-branches", {
    method: "POST",
    body: JSON.stringify(input),
  });
};

