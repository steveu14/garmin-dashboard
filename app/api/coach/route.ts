import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

// Runs on the server only -- ANTHROPIC_API_KEY never reaches the browser.
export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not set on the server." },
      { status: 500 }
    );
  }

  // Constructed here (not at module scope) so `next build` doesn't crash
  // trying to load this route before env vars are configured -- the
  // Anthropic client throws immediately on a missing key at construction time.
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const { message, history, context } = (await req.json()) as {
      message: string;
      history: ChatMessage[];
      context: string;
    };

    if (!message || typeof message !== "string") {
      return Response.json({ error: "Missing message." }, { status: 400 });
    }

    const systemPrompt = `You are a running coach assistant embedded in Steven's personal marathon training dashboard. He's training for a marathon on October 18, 2026 with a sub-3:50 goal (~5:20-5:27/km race pace), following an 18-week Novice 2/Intermediate hybrid plan.

Answer questions about his training using the data below. Be direct and specific -- cite actual numbers, dates, and weeks from the data rather than generic training advice. If something isn't in the data, say so plainly rather than guessing. Keep answers concise unless he asks for depth.

Runs are matched to planned workouts by distance/pace rank within each week (not exact day), since his actual training days don't always match the plan's assigned days.

TRAINING DATA:
${context}`;

    const anthropicHistory = (history ?? []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [...anthropicHistory, { role: "user" as const, content: message }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const reply = textBlock && textBlock.type === "text" ? textBlock.text : "";

    return Response.json({ reply });
  } catch (err: any) {
    console.error("Coach API error:", err);
    return Response.json(
      { error: err?.message ?? "Something went wrong calling Claude." },
      { status: 500 }
    );
  }
}