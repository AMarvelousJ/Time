import { NextRequest, NextResponse } from "next/server";
import { getActorContext, getPrimaryRole } from "@/lib/server/actor-auth";
import { messageFromUnknown } from "@/lib/server/error-message";
import { getActorProfileIdFromRequest } from "@/lib/server/request-context";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("role_assignments")
      .select("profile_id,party_branch_id,profiles(id,display_name,email,college_id)")
      .eq("role", "branch_admin")
      .is("party_branch_id", null);

    if (error) throw error;

    const options = (data ?? [])
      .filter((item) => {
        const profile = Array.isArray(item.profiles)
          ? item.profiles[0]
          : (item.profiles as { college_id?: string | null } | null);
        return (
          profile?.college_id === actor.systemAdminCollegeId ||
          profile?.college_id == null
        );
      })
      .map((item) => {
        const profile = Array.isArray(item.profiles)
          ? item.profiles[0]
          : (item.profiles as { id: string; display_name: string | null; email: string | null } | null);
        return {
          profileId: item.profile_id,
          displayName: profile?.display_name ?? "未命名管理员",
          email: profile?.email ?? "",
        };
      });

    return NextResponse.json({ options });
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
      displayName?: string;
      email?: string;
      password?: string;
    };
    const displayName = body.displayName?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!displayName) {
      return NextResponse.json({ error: "displayName is required" }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "password must be at least 6 chars" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (createUserError) {
      return NextResponse.json({ error: createUserError.message }, { status: 400 });
    }

    const profileId = createdUser.user?.id;
    if (!profileId) {
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: profileId,
      display_name: displayName,
      email,
      college_id: actor.systemAdminCollegeId,
    });
    if (profileError) throw profileError;

    const { error: roleError } = await supabase.from("role_assignments").insert({
      profile_id: profileId,
      role: "branch_admin",
      party_branch_id: null,
    });
    if (roleError) throw roleError;

    return NextResponse.json(
      {
        admin: {
          profileId,
          displayName,
          email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
