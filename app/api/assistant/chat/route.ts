import { NextRequest, NextResponse } from "next/server";
import { getActorContext } from "@/lib/server/actor-auth";
import { messageFromUnknown } from "@/lib/server/error-message";
import { getActorProfileIdFromRequest } from "@/lib/server/request-context";

interface DifyChatResponse {
  answer?: string;
  conversation_id?: string;
  message_id?: string;
}

const getDifyApiKey = () =>
  process.env.DIFY_API_KEY ||
  process.env.DIFY_APP_API_KEY ||
  process.env.DIFY_CHAT_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const actorProfileId = getActorProfileIdFromRequest(request);
    if (!actorProfileId) {
      return NextResponse.json(
        { error: "Missing actorProfileId" },
        { status: 400 }
      );
    }

    await getActorContext(actorProfileId);

    const apiKey = getDifyApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Dify API key" },
        { status: 500 }
      );
    }

    const body = (await request.json()) as {
      query?: unknown;
      conversationId?: unknown;
      studentId?: unknown;
      studentName?: unknown;
    };

    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (!query) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const baseUrl = process.env.DIFY_API_BASE_URL || "https://api.dify.ai/v1";
    const difyResponse = await fetch(`${baseUrl}/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          student_id: typeof body.studentId === "string" ? body.studentId : "",
          student_name:
            typeof body.studentName === "string" ? body.studentName : "",
        },
        query,
        response_mode: "blocking",
        conversation_id:
          typeof body.conversationId === "string" ? body.conversationId : "",
        user: actorProfileId,
      }),
    });

    const payload = (await difyResponse.json()) as DifyChatResponse & {
      message?: string;
      error?: string;
    };

    if (!difyResponse.ok) {
      return NextResponse.json(
        { error: payload.message || payload.error || "Dify request failed" },
        { status: difyResponse.status }
      );
    }

    return NextResponse.json({
      answer: payload.answer ?? "",
      conversationId: payload.conversation_id ?? null,
      messageId: payload.message_id ?? null,
    });
  } catch (error) {
    const message = messageFromUnknown(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
