import { apiFetch } from "@/lib/services/api-client";
import { AppRole } from "@/lib/services/actor-service";

export interface RecentStudent {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
}

export interface SystemSummary {
  collegeName: string | null;
  totalBranches: number;
  totalStudents: number;
  progress: number;
  completed: number;
  "needs-fix": number;
  branches: Array<{
    branchId: string;
    branchName: string;
    studentCount: number;
    students: RecentStudent[];
  }>;
}

export interface BranchSummary {
  branchId: string | null;
  branchName: string | null;
  totalStudents: number;
  progress: number;
  completed: number;
  "needs-fix": number;
  recentStudents: RecentStudent[];
  assignmentPending?: boolean;
}

export interface StudentSummary {
  studentId: string;
  studentName: string;
  status: string;
  filledFields: number;
  conflictCount: number;
  updatedAt: string;
}

export const getDashboardSummary = async () => {
  return apiFetch<{
    role: AppRole;
    summary: SystemSummary | BranchSummary | StudentSummary;
  }>("/api/dashboard/summary");
};
