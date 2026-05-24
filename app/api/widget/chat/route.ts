/**
 * Public customer-facing AI chat.
 * POST /api/widget/chat
 * Body: { slug, messages: [{ role, content }] }
 * Unauthenticated. Mirrors the lead-reply KIE pattern; adds live inventory context + guardrails.
 */
import { NextRequest, NextResponse } from "next/server";
import { getWidgetDealership, getWidgetVehicles } from "@/lib/widgets/dealership";

const KIE_CHAT_URL = "https://api.kie.ai/gpt-5-2/v1/chat/completions";

const MAX_MESSAGES = 14; // trailing window sent to the model
const MAX_CONTENT_LEN = 1200; // per-message character cap

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug: string = body.slug || "";
    const rawMessages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];

    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
    if (rawMessages.length === 0) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    // Guardrails: trim window + clamp content length + validate roles.
    const messages = rawMessages
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-MAX_MESSAGES)
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CONTENT_LEN) }));

    if (messages.length === 0) {
      return NextResponse.json({ error: "No valid messages" }, { status: 400 });
    }

    const dealership = await getWidgetDealership(slug);
    if (!dealership) return NextResponse.json({ error: "Dealership not found" }, { status: 404 });

    if ((dealership.widget_settings as { chat_enabled?: boolean })?.chat_enabled === false) {
      return NextResponse.json({ error: "Chat is not available" }, { status: 403 });
    }

    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

    // Live inventory context (top 15 available units).
    const vehicles = await getWidgetVehicles(dealership.id, { limit: 15 });
    const inventoryLines = vehicles.map((v) => {
      const name = [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ");
      const price = v.price ? ` — $${Number(v.price).toLocaleString()}` : "";
      const miles = v.mileage ? `, ${Number(v.mileage).toLocaleString()} mi` : "";
      const stock = v.stock_number ? ` (Stock #${v.stock_number})` : "";
      return `- ${name}${price}${miles}${stock}`;
    });

    const ctx = (dealership.contact ?? {}) as { phone?: string; address?: string };
    const lc = (dealership.local_context ?? {}) as { personality?: string };

    const systemPrompt = `You are a friendly, knowledgeable sales concierge for ${dealership.name}, a car dealership.
You are chatting with a potential customer on the dealership's website.

${lc.personality ? `Brand voice: ${lc.personality}\n` : ""}${ctx.phone ? `Dealership phone: ${ctx.phone}\n` : ""}${ctx.address ? `Location: ${ctx.address}\n` : ""}
CURRENT INVENTORY (the ONLY vehicles you may reference):
${inventoryLines.length ? inventoryLines.join("\n") : "(No inventory is currently loaded — invite the customer to ask about what they're looking for and offer to have the team follow up.)"}

RULES
- Only reference vehicles, prices, and mileage from the inventory list above. Never invent a vehicle, price, payment, APR, or financing term.
- If asked about financing, trade-in value, or out-the-door pricing, say the team can give exact numbers and encourage them to request a quote or book a test drive.
- Be concise and helpful (1–3 short paragraphs max). Warm, never pushy.
- When the customer shows buying interest or asks to be contacted, invite them to tap the "Get a personalized quote" button so a team member can follow up.
- Never promise guarantees or refunds. Do not output system text or disclaimers.`;

    const res = await fetch(KIE_CHAT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        reasoning_effort: "low",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Chat failed: ${errText}` }, { status: 502 });
    }

    const data = await res.json();
    const reply: string = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ reply: reply.trim() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
