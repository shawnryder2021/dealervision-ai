import { NextResponse } from "next/server";

const KIE_CHAT_URL = "https://api.kie.ai/gpt-5-2/v1/chat/completions";

const SYSTEM_PROMPT = `You are an expert automotive marketing assistant for car dealerships. Your role is to help dealership staff create compelling marketing visuals using AI image generation.

You help with:
- Crafting detailed, effective prompts for vehicle spotlights, sales events, promotions, and social media posts
- Suggesting the best visual styles (photorealistic, cinematic, lifestyle, etc.) for different marketing goals
- Recommending optimal channels (Instagram, Facebook, billboards, etc.) for campaigns
- Refining and improving image generation prompts based on dealership branding

When a dealer describes what they want, help them build a great image generation prompt. When the prompt is ready, present it clearly and tell them they can click "Generate Image" to create it.

Keep responses concise and practical. Always focus on creating visuals that drive car sales.`;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const response = await fetch(KIE_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        reasoning_effort: "low",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GPT 5.2 API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
