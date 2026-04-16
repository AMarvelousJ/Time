import { NextRequest, NextResponse } from "next/server";
import { canCreateInBranch, getActorContext, getPrimaryRole } from "@/lib/server/actor-auth";
import { getActorProfileIdFromRequest } from "@/lib/server/request-context";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const toPersonResponse = (row: {
  id: string;
  full_name: string;
  created_at: string;
  status: string;
}) => ({
  id: row.id,
  name: row.full_name,
  createdAt: row.created_at.slice(0, 10),
  status: row.status,
  materials: [],
});

export async function GET(request: NextRequest) {
  try {
    const actorProfileId = getActorProfileIdFromRequest(request);
    if (!actorProfileId) {
      return NextResponse.json(
        { error: "Missing actorProfileId" },
        { status: 400 }
      );
    }

    const actor = await getActorContext(actorProfileId);
    const role = getPrimaryRole(actor.roles);
    if (!role) {
      return NextResponse.json({ error: "Actor has no role" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    if (role === "student") {
      if (!actor.studentId) return NextResponse.json({ persons: [] });
      const { data, error } = await supabase
        .from("students")
        .select("id,full_name,created_at,status")
        .eq("id", actor.studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return NextResponse.json({ persons: (data ?? []).map(toPersonResponse) });
    }

    if (role === "branch_admin") {
      const { data, error } = await supabase
        .from("students")
        .select("id,full_name,created_at,status")
        .eq("party_branch_id", actor.branchAdminBranchId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return NextResponse.json({ persons: (data ?? []).map(toPersonResponse) });
    }

    const { data: branches, error: branchError } = await supabase
      .from("party_branches")
      .select("id")
      .eq("college_id", actor.systemAdminCollegeId!);
    if (branchError) throw branchError;

    const branchIds = (branches ?? []).map((branch) => branch.id);
    if (branchIds.length === 0) {
      return NextResponse.json({ persons: [] });
    }

    const { data, error } = await supabase
      .from("students")
      .select("id,full_name,created_at,status")
      .in("party_branch_id", branchIds)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return NextResponse.json({ persons: (data ?? []).map(toPersonResponse) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actorProfileId = getActorProfileIdFromRequest(request);
    if (!actorProfileId) {
      return NextResponse.json(
        { error: "Missing actorProfileId" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as {
      name?: string;
      partyBranchId?: string;
      studentProfileId?: string;
    };
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const actor = await getActorContext(actorProfileId);
    const role = getPrimaryRole(actor.roles);
    if (!role) return NextResponse.json({ error: "Actor has no role" }, { status: 403 });

    let targetPartyBranchId = body.partyBranchId;
    if (!targetPartyBranchId && role === "branch_admin") {
      targetPartyBranchId = actor.branchAdminBranchId;
    }
    if (!targetPartyBranchId && role === "student") {
      const supabase = getSupabaseAdmin();
      const { data: me } = await supabase
        .from("students")
        .select("party_branch_id")
        .eq("profile_id", actor.profileId)
        .maybeSingle();
      targetPartyBranchId = me?.party_branch_id;
    }

    if (!targetPartyBranchId) {
      return NextResponse.json(
        { error: "partyBranchId is required for this actor" },
        { status: 400 }
      );
    }

    const allowed = await canCreateInBranch(actor, targetPartyBranchId);
    if (!allowed) {
      return NextResponse.json(
        { error: "No permission to create student in this branch" },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: created, error: createError } = await supabase
      .from("students")
      .insert({
        full_name: body.name.trim(),
        party_branch_id: targetPartyBranchId,
        profile_id: body.studentProfileId ?? null,
        created_by: actor.profileId,
        status: "progress",
      })
      .select("id,full_name,created_at,status")
      .single();

    if (createError) throw createError;

    const { error: snapshotError } = await supabase.from("timeline_snapshots").insert({
      student_id: created.id,
      snapshot: {},
      updated_by: actor.profileId,
    });
    if (snapshotError) throw snapshotError;

    return NextResponse.json({ person: toPersonResponse(created) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
