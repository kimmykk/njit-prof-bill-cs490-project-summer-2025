// src/app/api/job-ads/route.ts
import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { db } from "@/lib/mongodb";
import OpenAI from "openai";

// ✅ Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_ADMIN_KEY!)
    ),
  });
}

// ✅ Setup OpenAI via GitHub proxy
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error("Missing GITHUB_TOKEN");
}
const openai = GITHUB_TOKEN
  ? new OpenAI({
    baseURL: "https://models.github.ai/inference",
    apiKey: GITHUB_TOKEN,
  })
  : null;

// ✅ MongoDB job ad schema
interface JobAdRecord {
  userId: string;
  url?: string;
  rawText?: string;
  companyName: string;
  jobTitle: string;
  postedAt: Date;
  location?: string;
  summary: string;
  requirements: string[];
  verbatimText: string;
  previewHtml: string;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ GET /api/job-ads
export async function GET(request: Request) {
  const auth = request.headers.get("Authorization")?.split(" ")[1];
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let decoded: admin.auth.DecodedIdToken;
  try {
    decoded = await admin.auth().verifyIdToken(auth);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const records = await db
    .collection<JobAdRecord>("jobAds")
    .find({ userId: decoded.uid })
    .sort({ createdAt: -1 })
    .toArray();

  const payload = records.map((r) => ({
    id: r._id.toString(),
    url: r.url,
    rawText: r.rawText,
    companyName: r.companyName,
    jobTitle: r.jobTitle,
    postedAt: r.postedAt.toISOString(),
    location: r.location,
    summary: r.summary,
    requirements: r.requirements,
    verbatimText: r.verbatimText,
    previewHtml: r.previewHtml,
  }));

  return NextResponse.json(payload);
}

// ✅ POST /api/job-ads
export async function POST(request: Request) {
  if (!openai) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing GITHUB_TOKEN" },
      { status: 500 }
    );
  }

  const auth = request.headers.get("Authorization")?.split(" ")[1];
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let decoded: admin.auth.DecodedIdToken;
  try {
    decoded = await admin.auth().verifyIdToken(auth);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const body = (await request.json()) as { url?: string; rawText?: string };
  if (!body.url && !body.rawText) {
    return NextResponse.json(
      { error: "Provide a URL or rawText" },
      { status: 400 }
    );
  }

  const source = body.url
    ? `Fetch and parse this job ad: ${body.url}`
    : `Parse this job ad text:\n\n${body.rawText}`;

  const systemPrompt = `
You are a job post parser. Return ONLY valid JSON like this:

{
  "companyName": string,
  "jobTitle": string,
  "postedAt": string,       // ISO date
  "location": string,       // optional
  "summary": string,        // 1-paragraph summary
  "requirements": string[], // bullet list
  "verbatimText": string,   // full original job post
  "previewHtml": string     // short HTML snippet
}

Return only JSON. No markdown, no commentary.
`.trim();

  let ai;
  try {
    ai = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: source },
      ],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "OpenAI request failed", details: err.message },
      { status: 500 }
    );
  }

  let raw = ai.choices[0].message.content ?? "";
  raw = raw
    .trim()
    .replace(/^```(?:json)?\s*/, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: {
    companyName: string;
    jobTitle: string;
    postedAt: string;
    location?: string;
    summary: string;
    requirements: string[];
    verbatimText: string;
    previewHtml: string;
  };

  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON from AI", raw }, { status: 502 });
  }

  const now = new Date();
  const record: JobAdRecord = {
    userId: decoded.uid,
    url: body.url,
    rawText: body.rawText,
    companyName: parsed.companyName,
    jobTitle: parsed.jobTitle,
    postedAt: new Date(parsed.postedAt),
    location: parsed.location,
    summary: parsed.summary,
    requirements: parsed.requirements,
    verbatimText: parsed.verbatimText,
    previewHtml: parsed.previewHtml,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("jobAds").insertOne(record);

  return NextResponse.json({
    id: result.insertedId.toString(),
    ...parsed,
    url: body.url,
    rawText: body.rawText,
  });
}
