import { NextRequest, NextResponse } from "next/server";
import { getActorContext, getPrimaryRole } from "@/lib/server/actor-auth";
import { getActorProfileIdFromRequest } from "@/lib/server/request-context";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
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

    const body = (await request.json()) as {
      name?: string;
      secretaryProfileId?: string;
    };

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!body.secretaryProfileId) {
      return NextResponse.json({ error: "secretaryProfileId is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: secretaryRole, error: roleError } = await supabase
      .from("role_assignments")
      .select("id,party_branch_id")
      .eq("profile_id", body.secretaryProfileId)
      .eq("role", "branch_admin")
      .maybeSingle();
    if (roleError) throw roleError;

    if (!secretaryRole?.id) {
      return NextResponse.json({ error: "选择的普通管理员无效" }, { status: 400 });
    }
    if (secretaryRole.party_branch_id) {
      return NextResponse.json({ error: "该普通管理员已绑定党支部，无法重复分配" }, { status: 409 });
    }

    const { data: createdBranch, error: createBranchError } = await supabase
      .from("party_branches")
      .insert({
        name,
        college_id: actor.systemAdminCollegeId,
      })
      .select("id,name")
      .single();
    if (createBranchError) throw createBranchError;

    const { error: bindRoleError } = await supabase
      .from("role_assignments")
      .update({ party_branch_id: createdBranch.id })
      .eq("id", secretaryRole.id);
    if (bindRoleError) throw bindRoleError;

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ college_id: actor.systemAdminCollegeId })
      .eq("id", body.secretaryProfileId);
    if (profileUpdateError) throw profileUpdateError;

    return NextResponse.json({
      branch: {
        id: createdBranch.id,
        name: createdBranch.name,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

