import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const KIE_CHAT_URL = "https://api.kie.ai/gpt-5-2/v1/chat/completions";

const SYSTEM_PROMPT = `You are an experienced dealership reputation manager. You write replies to public Google / DealerRater / Yelp / Facebook reviews on behalf of the dealership.

HARD RULES — never violate:
- Never promise a refund, money back, or "we will fix this for free" in writing.
- Never admit fault for a specific defect, lawsuit, or warranty claim.
- Never share private customer details (account numbers, VINs, addresses, phone numbers) in a public reply.
- Never accuse the customer of lying.
- Never use sarcasm or defensive language, even on negative reviews.

STYLE
- Match the dealership brand voice provided.
- 60-100 words.
- For positive reviews: thank them genuinely, mention something specific from their review, invite them back.
- For negative reviews: thank them for feedback, acknowledge their experience without admitting specific fault, offer to take it offline (provide a contact name and phone), keep dignity.
- For neutral/3-star: thank them, ask what would have made it 5 stars (offline), offer to follow up.
- Always sign off with the dealership name (and a real-sounding manager first name if provided).

OUTPUT
Plain text, single paragraph or two short paragraphs. No subject line. No markdown.`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const review: string = body.review || "";
    const stars: number = Number(body.stars) || 0;
    const platform: string = body.platform || "Google";
    const reviewerName: string = body.reviewerName || "Customer";
    const dealership = body.dealership || {};
    const managerName: string | undefined = body.managerName;

    if (!review.trim()) return NextResponse.json({ error: "review required" }, { status: 400 });

    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

    const ctxLines: string[] = [];
    if (dealership?.name) ctxLines.push(`Dealership: ${dealership.name}`);
    if (dealership?.contact?.phone) ctxLines.push(`Public phone for offline follow-up: ${dealership.contact.phone}`);
    if (dealership?.local_context?.personality) ctxLines.push(`Brand voice: ${dealership.local_context.personality}`);
    if (managerName) ctxLines.push(`Sign as: ${managerName}, GM`);

    const userPrompt = `REVIEW (${stars}-star, ${platform}) by ${reviewerName}:
"""
${review}
"""

CONTEXT:
${ctxLines.join("\n") || "(none)"}

Write the public reply now.`;

    const res = await fetch(KIE_CHAT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        reasoning_effort: "low",
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Reply generation failed: ${errText}` }, { status: 502 });
    }
    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ reply: content.trim() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
