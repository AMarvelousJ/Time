import { NextRequest, NextResponse } from "next/server";
import { getActorContext, getPrimaryRole } from "@/lib/server/actor-auth";
import { messageFromUnknown } from "@/lib/server/error-message";
import {
  computeTimelineProgress,
  renderStudentStatusLabel,
} from "@/lib/server/timeline-progress";
import { getActorProfileIdFromRequest } from "@/lib/server/request-context";
import { getSupabaseAdmin } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ branchId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const actorProfileId = getActorProfileIdFromRequest(request);
    if (!actorProfileId) {
      return NextResponse.json({ error: "Missing actorProfileId" }, { status: 400 });
    }

    const actor = await getActorContext(actorProfileId);
    const role = getPrimaryRole(actor.roles);
    if (role !== "system_admin") {
      return NextResponse.json({ error: "No permission" }, { status: 403 });
    }

    const { branchId } = await context.params;
    const supabase = getSupabaseAdmin();

    const { data: branch, error: branchError } = await supabase
      .from("party_branches")
      .select("id,name,college_id")
      .eq("id", branchId)
      .maybeSingle();
    if (branchError) throw branchError;
    if (!branch?.id) {
      return NextResponse.json({ error: "党支部不存在" }, { status: 404 });
    }
    if (branch.college_id !== actor.systemAdminCollegeId) {
      return NextResponse.json({ error: "无权查看其他学院的党支部" }, { status: 403 });
    }

    const { data: adminRole, error: adminError } = await supabase
      .from("role_assignments")
      .select("profile_id,profiles(display_name,email)")
      .eq("role", "branch_admin")
      .eq("party_branch_id", branchId)
      .maybeSingle();
    if (adminError) throw adminError;

    const adminProfileRaw = adminRole?.profiles;
    const adminProfile = Array.isArray(adminProfileRaw)
      ? adminProfileRaw[0]
      : adminProfileRaw ?? null;

    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select("id,full_name,status,updated_at")
      .eq("party_branch_id", branchId)
      .order("updated_at", { ascending: false });
    if (studentsError) throw studentsError;

    const students = studentsData ?? [];
    const studentIds = students.map((student) => student.id);

    const snapshotsByStudent = new Map<string, Record<string, string | null>>();
    if (studentIds.length > 0) {
      const { data: snapshots, error: snapshotsError } = await supabase
        .from("timeline_snapshots")
        .select("student_id,snapshot")
        .in("student_id", studentIds);
      if (snapshotsError) throw snapshotsError;

      (snapshots ?? []).forEach((row) => {
        snapshotsByStudent.set(
          row.student_id as string,
          (row.snapshot as Record<string, string | null> | null) ?? {}
        );
      });
    }

    return NextResponse.json({
      branch: {
        id: branch.id,
        name: branch.name,
      },
      branchAdmin: adminRole?.profile_id
        ? {
            profileId: adminRole.profile_id as string,
            displayName: adminProfile?.display_name ?? "未命名管理员",
            email: adminProfile?.email ?? "",
          }
        : null,
      students: students.map((student) => {
        const snapshot = snapshotsByStudent.get(student.id) ?? {};
        const progress = computeTimelineProgress(snapshot);
        return {
          id: student.id,
          name: student.full_name,
          status: student.status,
          statusLabel: renderStudentStatusLabel(student.status),
          filledCount: progress.filledCount,
          totalFields: progress.totalFields,
          progressPercent: progress.progressPercent,
          currentStageId: progress.currentStageId,
          currentStageName: progress.currentStageName,
          updatedAt: student.updated_at,
        };
      }),
    });
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
