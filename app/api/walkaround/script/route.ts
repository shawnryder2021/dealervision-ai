import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const KIE_CHAT_URL = "https://api.kie.ai/gpt-5-2/v1/chat/completions";

const SYSTEM_PROMPT = `You are a video script writer for short-form vertical car walkaround videos (TikTok, Reels, Shorts).
Output ONLY valid JSON, no prose. Schema:

{
  "title": "string — 6 words max, punchy",
  "hook": "string — first 2 seconds, opens with curiosity or excitement, 8-12 words",
  "beats": [
    { "label": "Exterior", "voiceover": "string — 12-18 words", "duration_sec": 4 },
    { "label": "Interior", "voiceover": "string — 12-18 words", "duration_sec": 4 },
    { "label": "Tech", "voiceover": "string — 12-18 words", "duration_sec": 4 },
    { "label": "Power", "voiceover": "string — 10-14 words", "duration_sec": 3 },
    { "label": "CTA", "voiceover": "string — 10-14 words ending with dealership name", "duration_sec": 4 }
  ],
  "cta_overlay": "string — 4 words, action verb"
}

RULES
- Total runtime: 20-25 seconds.
- Spoken English only. Conversational. No emoji.
- Use only facts provided. Do not invent specs, prices, MPG, or features.
- End with the dealership's name.
- Tone: excited but not cheesy. Imagine a real salesperson who loves cars.`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const vehicle = body.vehicle;
    const dealership = body.dealership;
    if (!vehicle) return NextResponse.json({ error: "vehicle required" }, { status: 400 });

    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

    const lines: string[] = [];
    lines.push(
      `Vehicle: ${[vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ")}`
    );
    if (vehicle.price) lines.push(`Price: $${Number(vehicle.price).toLocaleString()}`);
    if (vehicle.mileage) lines.push(`Mileage: ${Number(vehicle.mileage).toLocaleString()} mi`);
    if (vehicle.stock_number) lines.push(`Stock: #${vehicle.stock_number}`);
    if (vehicle.tags?.length) lines.push(`Highlights: ${vehicle.tags.join(", ")}`);
    if (dealership?.name) lines.push(`Dealership: ${dealership.name}`);
    if (dealership?.contact?.phone) lines.push(`Phone: ${dealership.contact.phone}`);
    if (dealership?.local_context?.personality) lines.push(`Brand voice: ${dealership.local_context.personality}`);

    const userPrompt = `VEHICLE & DEALERSHIP CONTEXT:\n${lines.join("\n")}\n\nWrite the walkaround script as JSON now.`;

    const res = await fetch(KIE_CHAT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        reasoning_effort: "low",
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Script generation failed: ${errText}` }, { status: 502 });
    }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try to extract JSON block
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }
    if (!parsed) return NextResponse.json({ error: "Could not parse script JSON" }, { status: 502 });
    return NextResponse.json({ script: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
