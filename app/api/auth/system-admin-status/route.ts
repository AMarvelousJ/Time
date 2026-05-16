import { NextResponse } from "next/server";
import { messageFromUnknown } from "@/lib/server/error-message";
import { hasSystemAdmin } from "@/lib/server/system-admin";

export async function GET() {
  try {
    const exists = await hasSystemAdmin();
    return NextResponse.json({ exists });
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

