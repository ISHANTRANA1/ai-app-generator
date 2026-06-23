import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateAndSanitizeConfig } from "@/lib/configValidator";

const SYSTEM_PROMPT = `You are an app configuration generator. Given a description of an app, return ONLY a valid JSON config object — no explanation, no markdown, no backticks. Use this exact schema:
{
  "appId": "slug-id",
  "name": "App Name",
  "description": "brief description",
  "entities": [
    {
      "name": "EntityName",
      "icon": "emoji",
      "fields": [
        { "name": "fieldName", "type": "string|number|boolean|date|email|url|enum|textarea", "required": true, "label": "Display Label", "options": ["opt1","opt2"] }
      ]
    }
  ],
  "pages": [
    { "name": "Page Name", "type": "table|form|dashboard", "entity": "EntityName", "actions": ["create","edit","delete"] }
  ]
}
Field types: string, number, boolean, date, email, url, enum (requires options array), textarea.
Page types: table (list view), form (single record), dashboard (stats overview).
Always generate at least 1 entity with 3+ fields and at least 1 page.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: `Generate a JSON app config for: ${prompt}` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let rawConfig: unknown;
    try {
      rawConfig = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      rawConfig = match ? JSON.parse(match[0]) : {};
    }

    const { config, warnings } = validateAndSanitizeConfig(rawConfig);
    return NextResponse.json({ config, warnings });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: "Failed to generate config" }, { status: 500 });
  }
}
