import { NextRequest, NextResponse } from "next/server";
import { getActorContext, getPrimaryRole } from "@/lib/server/actor-auth";
import { messageFromUnknown } from "@/lib/server/error-message";
import { withNoStoreHeaders } from "@/lib/server/no-store-response";
import { getActorProfileIdFromRequest } from "@/lib/server/request-context";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type StudentRow = {
  id: string;
  full_name: string;
  status: string;
  updated_at: string;
  party_branch_id: string;
};

type BranchRow = {
  id: string;
  name: string;
  college_id: string;
};

const countStatuses = (students: StudentRow[]) => {
  const result = { progress: 0, completed: 0, "needs-fix": 0 };
  students.forEach((student) => {
    if (student.status === "completed") result.completed += 1;
    else if (student.status === "needs-fix") result["needs-fix"] += 1;
    else result.progress += 1;
  });
  return result;
};

export async function GET(request: NextRequest) {
  try {
    const actorProfileId = getActorProfileIdFromRequest(request);
    if (!actorProfileId) {
      return NextResponse.json(
        { error: "Missing actorProfileId" },
        withNoStoreHeaders({ status: 400 })
      );
    }

    const actor = await getActorContext(actorProfileId);
    const role = getPrimaryRole(actor.roles);
    if (!role) {
      return NextResponse.json({ error: "Actor has no role" }, withNoStoreHeaders({ status: 403 }));
    }

    const supabase = getSupabaseAdmin();

    if (role === "student") {
      if (!actor.studentId) {
        return NextResponse.json(
          { error: "Student role is not bound to any student profile" },
          withNoStoreHeaders({ status: 409 })
        );
      }

      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id,full_name,status,updated_at")
        .eq("id", actor.studentId)
        .single();
      if (studentError) throw studentError;

      const { data: snapshotRow, error: snapshotError } = await supabase
        .from("timeline_snapshots")
        .select("snapshot,updated_at")
        .eq("student_id", actor.studentId)
        .maybeSingle();
      if (snapshotError) throw snapshotError;

      const snapshot = (snapshotRow?.snapshot as Record<string, string | null> | null) ?? {};
      const filledFields = Object.values(snapshot).filter(Boolean).length;

      const { count: conflictCount, error: conflictError } = await supabase
        .from("timeline_change_logs")
        .select("id", { count: "exact", head: true })
        .eq("student_id", actor.studentId)
        .eq("field_key", "__conflict__");
      if (conflictError) throw conflictError;

      return NextResponse.json(
        {
          role,
          summary: {
            studentId: student.id,
            studentName: student.full_name,
            status: student.status,
            filledFields,
            conflictCount: conflictCount ?? 0,
            updatedAt: snapshotRow?.updated_at ?? student.updated_at,
          },
        },
        withNoStoreHeaders()
      );
    }

    if (role === "branch_admin") {
      if (!actor.branchAdminBranchId) {
        return NextResponse.json(
          {
            role,
            summary: {
              branchId: null,
              branchName: null,
              totalStudents: 0,
              progress: 0,
              completed: 0,
              "needs-fix": 0,
              recentStudents: [],
              assignmentPending: true,
            },
          },
          withNoStoreHeaders()
        );
      }

      const { data: branchInfo, error: branchError } = await supabase
        .from("party_branches")
        .select("id,name")
        .eq("id", actor.branchAdminBranchId!)
        .single();
      if (branchError) throw branchError;

      const { data: branchStudents, error } = await supabase
        .from("students")
        .select("id,full_name,status,updated_at,party_branch_id")
        .eq("party_branch_id", actor.branchAdminBranchId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;

      const students = (branchStudents ?? []) as StudentRow[];
      const statusCounts = countStatuses(students);

      return NextResponse.json(
        {
          role,
          summary: {
            branchId: branchInfo.id,
            branchName: branchInfo.name,
            totalStudents: students.length,
            ...statusCounts,
            recentStudents: students.slice(0, 8).map((student) => ({
              id: student.id,
              name: student.full_name,
              status: student.status,
              updatedAt: student.updated_at,
            })),
          },
        },
        withNoStoreHeaders()
      );
    }

    const { data: college, error: collegeError } = await supabase
      .from("colleges")
      .select("name")
      .eq("id", actor.systemAdminCollegeId!)
      .maybeSingle();
    if (collegeError) throw collegeError;

    const { data: branchesData, error: branchesError } = await supabase
      .from("party_branches")
      .select("id,name,college_id")
      .eq("college_id", actor.systemAdminCollegeId!);
    if (branchesError) throw branchesError;

    const branches = (branchesData ?? []) as BranchRow[];
    const branchIds = (branches ?? []).map((branch) => branch.id);
    if (branchIds.length === 0) {
      return NextResponse.json(
        {
          role,
          summary: {
            collegeName: college?.name ?? null,
            totalBranches: 0,
            totalStudents: 0,
            progress: 0,
            completed: 0,
            "needs-fix": 0,
            branches: [],
          },
        },
        withNoStoreHeaders()
      );
    }

    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select("id,full_name,status,updated_at,party_branch_id")
      .in("party_branch_id", branchIds)
      .order("updated_at", { ascending: false });
    if (studentsError) throw studentsError;

    const students = (studentsData ?? []) as StudentRow[];
    const statusCounts = countStatuses(students);

    const studentsByBranch = new Map<string, StudentRow[]>();
    students.forEach((student) => {
      const bucket = studentsByBranch.get(student.party_branch_id) ?? [];
      bucket.push(student);
      studentsByBranch.set(student.party_branch_id, bucket);
    });

    const branchesWithStudents = branches.map((branch) => {
      const branchStudents = studentsByBranch.get(branch.id) ?? [];
      return {
        branchId: branch.id,
        branchName: branch.name,
        studentCount: branchStudents.length,
        students: branchStudents.map((student) => ({
          id: student.id,
          name: student.full_name,
          status: student.status,
          updatedAt: student.updated_at,
        })),
      };
    });

    return NextResponse.json(
      {
        role,
        summary: {
          collegeName: college?.name ?? null,
          totalBranches: branches?.length ?? 0,
          totalStudents: students.length,
          ...statusCounts,
          branches: branchesWithStudents,
        },
      },
      withNoStoreHeaders()
    );
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, withNoStoreHeaders({ status: 500 }));
  }
}
