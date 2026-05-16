import { NextRequest, NextResponse } from "next/server";
import { messageFromUnknown } from "@/lib/server/error-message";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(_request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("party_branches")
      .select("id,name,college_id,colleges(name)")
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      branches: (data ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        collegeId: item.college_id,
        collegeName: Array.isArray(item.colleges)
          ? item.colleges[0]?.name ?? ""
          : (item.colleges as { name?: string } | null)?.name ?? "",
      })),
    });
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
