import { apiFetch } from "@/lib/services/api-client";

export const getSystemAdminStatus = async () => {
  return apiFetch<{ exists: boolean }>("/api/auth/system-admin-status");
};

export const loginUser = async (email: string, password: string) => {
  return apiFetch<{ userId: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const setupSystemAdmin = async (input: {
  displayName: string;
  collegeName: string;
  email: string;
  password: string;
}) => {
  return apiFetch<{ actorProfileId: string }>("/api/auth/setup-system-admin", {
    method: "POST",
    body: JSON.stringify(input),
  });
};
