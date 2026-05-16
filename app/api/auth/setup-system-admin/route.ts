import { NextRequest, NextResponse } from "next/server";
import { messageFromUnknown } from "@/lib/server/error-message";
import { hasSystemAdmin } from "@/lib/server/system-admin";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const exists = await hasSystemAdmin();
    if (exists) {
      return NextResponse.json({ error: "系统管理员已存在" }, { status: 409 });
    }

    const body = (await request.json()) as {
      displayName?: string;
      collegeName?: string;
      email?: string;
      password?: string;
    };

    const displayName = body.displayName?.trim();
    const collegeName = body.collegeName?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!displayName) {
      return NextResponse.json({ error: "姓名不能为空" }, { status: 400 });
    }
    if (!collegeName) {
      return NextResponse.json({ error: "学院不能为空" }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "请输入有效邮箱" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: existingCollege, error: collegeQueryError } = await supabase
      .from("colleges")
      .select("id")
      .eq("name", collegeName)
      .maybeSingle();
    if (collegeQueryError) throw collegeQueryError;

    let collegeId = existingCollege?.id as string | undefined;
    if (!collegeId) {
      const { data: createdCollege, error: collegeCreateError } = await supabase
        .from("colleges")
        .insert({ name: collegeName })
        .select("id")
        .single();
      if (collegeCreateError) throw collegeCreateError;
      collegeId = createdCollege.id;
    }

    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (createUserError) throw createUserError;

    const userId = createdUser.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "创建管理员账号失败" }, { status: 500 });
    }

    const { error: profileInsertError } = await supabase.from("profiles").insert({
      id: userId,
      display_name: displayName,
      college_id: collegeId,
      email,
    });
    if (profileInsertError) throw profileInsertError;

    const { error: roleError } = await supabase.from("role_assignments").insert({
      profile_id: userId,
      role: "system_admin",
      college_id: collegeId,
    });
    if (roleError) throw roleError;

    return NextResponse.json({ actorProfileId: userId }, { status: 201 });
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

