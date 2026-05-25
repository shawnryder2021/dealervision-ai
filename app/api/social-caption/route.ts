/**
 * Social Caption generator.
 * POST /api/social-caption
 * Authenticated. Turns an existing vehicle description into a platform-specific social post (KIE gpt-5-2).
 */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cleanGeneratedText } from "@/lib/clean-generated-text";

const KIE_CHAT_URL = "https://api.kie.ai/gpt-5-2/v1/chat/completions";

type Platform = "facebook" | "instagram" | "x";

const PLATFORM_INSTRUCTIONS: Record<Platform, string> = {
  facebook:
    "Platform: Facebook. Conversational and inviting. 1–2 short paragraphs are fine. End with a clear call to action (message us, call, or visit). Use at most 1–3 hashtags.",
  instagram:
    "Platform: Instagram. Open with a strong one-line hook, then 2–4 short lines with line breaks for readability. Drive to 'DM us' or 'link in bio'. Put 5–10 relevant hashtags on the final line.",
  x:
    "Platform: X (Twitter). MUST be under 280 characters total including hashtags. One punchy sentence or two. 1–2 hashtags max.",
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const description: string = typeof body.description === "string" ? body.description.slice(0, 4000) : "";
    const dealership = body.dealership || {};
    const vehicle = body.vehicle || null;
    const platform: Platform = PLATFORM_INSTRUCTIONS[body.platform as Platform] ? body.platform : "instagram";
    const includeHashtags: boolean = body.includeHashtags !== false; // default on
    const includeEmoji: boolean = body.includeEmoji !== false; // default on

    if (!description.trim()) {
      return NextResponse.json({ error: "A source description is required" }, { status: 400 });
    }

    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

    const context: string[] = [];
    if (vehicle) {
      context.push(`Vehicle: ${[vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ")}`);
    }
    if (dealership?.name) context.push(`Dealership: ${dealership.name}`);
    if (dealership?.contact?.phone) context.push(`Phone: ${dealership.contact.phone}`);
    if (dealership?.local_context?.personality) context.push(`Brand voice: ${dealership.local_context.personality}`);

    const systemPrompt = `You are a social media manager for a car dealership. Rewrite the provided vehicle description into a ready-to-post social caption.

${PLATFORM_INSTRUCTIONS[platform]}
${includeHashtags ? "Include relevant hashtags as instructed for the platform." : "Do NOT include any hashtags."}
${includeEmoji ? "A few tasteful emoji are encouraged." : "Do NOT use any emoji."}

RULES
- Base the post ONLY on the facts in the provided description and dealership context. Never invent specs, pricing, or features.
- Keep the dealership's brand voice.
- Output PLAIN TEXT only. Do NOT use any Markdown — no **asterisks**, no _underscores_, no # headers, no backticks, and no "- " bullet markers.
- Do NOT wrap the caption in quotation marks and do NOT add any label, preamble, or commentary. Output ONLY the caption itself.`;

    const userPrompt = `SOURCE DESCRIPTION:
"""
${description.trim()}
"""

CONTEXT:
${context.join("\n") || "(none)"}

Write the ${platform} caption now.`;

    const res = await fetch(KIE_CHAT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        reasoning_effort: "low",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Caption generation failed: ${errText}` }, { status: 502 });
    }

    const data = await res.json();
    const caption: string = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ caption: cleanGeneratedText(caption), platform });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate caption";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
