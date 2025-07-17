// src/app/api/job-ads/parse/route.ts
import { NextResponse } from "next/server";
import { openai, MODEL } from "@/lib/openai";

interface ParseRequest {
  url?: string;
  rawText?: string;
}

interface ParsedJob {
  jobTitle: string;
  companyName: string;
  postedAt: string;
  location?: string;
  summary: string;
  requirements: string[];
  verbatimText: string;
  [key: string]: unknown;
}

const SYSTEM_PROMPT = `
You are an expert job post parser. Given the full text of a job posting, extract and return the following JSON structure:

{
  "jobTitle": string,
  "companyName": string,
  "postedAt": string,         // ISO format, e.g. "2023-09-30"
  "location": string,         // if available
  "summary": string,          // brief 1-paragraph summary of the job
  "requirements": string[],   // bullet list of key requirements
  "verbatimText": string      // full, unedited job post content (word-for-word)
}

⚠️ Return only the JSON. Do not include markdown, explanation, or commentary.
`.trim();

export async function POST(request: Request) {
  let body: ParseRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let rawText = body.rawText?.trim() || "";

  if (!rawText && body.url) {
    try {
      const html = await fetch(body.url).then((r) => r.text());
      rawText = html.replace(/\s+/g, " ").trim();
    } catch (err) {
      return NextResponse.json(
        { error: "Failed to fetch or parse URL", details: (err as Error).message },
        { status: 400 }
      );
    }
  }

  if (!rawText) {
    return NextResponse.json(
      { error: "Must provide rawText or a valid url" },
      { status: 400 }
    );
  }

  const MAX_INPUT_LENGTH = 20000;
  const inputText = rawText.slice(0, MAX_INPUT_LENGTH);

  let ai;
  try {
    ai = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: inputText },
      ],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "OpenAI request failed", details: err.message },
      { status: 500 }
    );
  }

  const content = ai.choices[0].message.content ?? "";
  const match = content.match(/\{[\s\S]*\}$/);

  if (!match) {
    return NextResponse.json(
      { error: "AI did not return valid JSON", raw: content },
      { status: 502 }
    );
  }

  try {
    const parsed = JSON.parse(match[0]) as ParsedJob;

    // Safeguard: ensure verbatimText is included even if the model misses it
    if (!parsed.verbatimText) {
      parsed.verbatimText = rawText;
    }

    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse JSON", raw: match[0] },
      { status: 502 }
    );
  }
}
