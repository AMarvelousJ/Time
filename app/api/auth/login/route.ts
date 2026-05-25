import { NextRequest, NextResponse } from "next/server";
import { messageFromUnknown } from "@/lib/server/error-message";
import { getSupabaseRegular } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "请输入邮箱和密码" }, { status: 400 });
    }

    const supabase = getSupabaseRegular();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const userId = data.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "登录成功但未获取到用户 ID" }, { status: 500 });
    }

    return NextResponse.json(
      {
        userId,
        accessToken: data.session?.access_token ?? null,
        refreshToken: data.session?.refresh_token ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
