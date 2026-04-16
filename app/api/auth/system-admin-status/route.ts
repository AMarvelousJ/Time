import { NextResponse } from "next/server";
import { hasSystemAdmin } from "@/lib/server/system-admin";

export async function GET() {
  try {
    const exists = await hasSystemAdmin();
    return NextResponse.json({ exists });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

