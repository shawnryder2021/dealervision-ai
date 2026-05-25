/**
 * Vehicle Description generator.
 * POST /api/vehicle-description
 * Authenticated. Generates listing/marketplace/social-ready copy for a vehicle using KIE gpt-5-2.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const KIE_CHAT_URL = "https://api.kie.ai/gpt-5-2/v1/chat/completions";

type DescFormat = "website" | "marketplace" | "social";
type DescLength = "short" | "standard" | "detailed";
type DescTone = "professional" | "friendly" | "luxury" | "energetic";

const FORMAT_INSTRUCTIONS: Record<DescFormat, string> = {
  website:
    "Write a polished vehicle-detail-page (VDP) description for the dealership's website. Lead with what makes this vehicle desirable, then flow through key features and benefits in clean prose. End with a soft call to action to contact the dealership or schedule a visit.",
  marketplace:
    "Write a description optimized for marketplace listings (Cars.com, AutoTrader, Facebook Marketplace). Be direct and value-forward, front-load the most searchable details (year/make/model/trim, condition, standout features), and keep it skimmable.",
  social:
    "Write a short, scroll-stopping blurb suited for a social caption or feed. Conversational and punchy, focused on the single most exciting thing about this vehicle, ending with a light call to action.",
};

const LENGTH_INSTRUCTIONS: Record<DescLength, string> = {
  short: "Length: about 50–80 words.",
  standard: "Length: about 120–170 words.",
  detailed: "Length: about 220–300 words, organized into 2–3 short paragraphs.",
};

const TONE_INSTRUCTIONS: Record<DescTone, string> = {
  professional: "Tone: professional, confident, trustworthy.",
  friendly: "Tone: warm, approachable, conversational.",
  luxury: "Tone: refined, premium, aspirational.",
  energetic: "Tone: high-energy, enthusiastic, exciting.",
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const vehicle = body.vehicle;
    const dealership = body.dealership || {};
    const format: DescFormat = FORMAT_INSTRUCTIONS[body.format as DescFormat] ? body.format : "website";
    const length: DescLength = LENGTH_INSTRUCTIONS[body.length as DescLength] ? body.length : "standard";
    const tone: DescTone = TONE_INSTRUCTIONS[body.tone as DescTone] ? body.tone : "professional";
    const highlights: string = typeof body.highlights === "string" ? body.highlights.slice(0, 1000) : "";
    const includePrice: boolean = body.includePrice === true;

    if (!vehicle || !(vehicle.make || vehicle.model)) {
      return NextResponse.json({ error: "A vehicle (at least make/model) is required" }, { status: 400 });
    }

    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

    const facts: string[] = [];
    facts.push(`Vehicle: ${[vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ")}`);
    if (includePrice && vehicle.price) facts.push(`Price: $${Number(vehicle.price).toLocaleString()}`);
    if (vehicle.mileage) facts.push(`Mileage: ${Number(vehicle.mileage).toLocaleString()} miles`);
    if (vehicle.stock_number) facts.push(`Stock #: ${vehicle.stock_number}`);
    if (Array.isArray(vehicle.tags) && vehicle.tags.length) facts.push(`Tags: ${vehicle.tags.join(", ")}`);
    if (highlights.trim()) facts.push(`Seller highlights to emphasize: ${highlights.trim()}`);
    if (dealership?.name) facts.push(`Dealership: ${dealership.name}`);
    if (dealership?.contact?.phone) facts.push(`Phone: ${dealership.contact.phone}`);
    if (dealership?.local_context?.personality) facts.push(`Brand voice: ${dealership.local_context.personality}`);

    const systemPrompt = `You are an expert automotive copywriter writing for a car dealership.

${FORMAT_INSTRUCTIONS[format]}
${LENGTH_INSTRUCTIONS[length]}
${TONE_INSTRUCTIONS[tone]}

RULES
- Use ONLY the facts provided. Never invent specifications, mileage, pricing, MPG, awards, warranty terms, or features that are not given.
${includePrice ? "- You may reference the price naturally if it helps the pitch." : "- Do NOT mention any specific price or payment."}
- Write natural, ready-to-publish prose. No markdown headings, no bullet lists unless it reads naturally, no placeholder text.
- Do not include a subject line or any meta commentary — output only the description text.`;

    const userPrompt = `VEHICLE & DEALERSHIP FACTS:
${facts.join("\n")}

Write the ${format} description now.`;

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
      return NextResponse.json({ error: `Description generation failed: ${errText}` }, { status: 502 });
    }

    const data = await res.json();
    const description: string = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ description: description.trim(), format });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate description";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
