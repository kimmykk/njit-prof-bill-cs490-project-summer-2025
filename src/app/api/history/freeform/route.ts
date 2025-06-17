import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { initializeApp, cert, getApps, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

export const config = {
  api: {
    bodyParser: false, // we handle JSON manually
  },
};

// ── Firebase Admin init ───────────────────────────────────────────────────────
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY!) as ServiceAccount;
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

// ── Paths & scripts ───────────────────────────────────────────────────────────
const extractDir = path.join(process.cwd(), "public/extracted");
const parsedDir  = path.join(process.cwd(), "public/parsed");
const parserScript = path.join(process.cwd(), "scripts", "parse_resume_github_proxy.py");

// ensure directories exist
for (const d of [extractDir, parsedDir]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    // 1) Parse incoming JSON
    const payload = await req.json();
    const text = payload.text?.trim();
    if (!text) {
      return NextResponse.json({ status: "error", message: "No text provided" }, { status: 400 });
    }

    // 2) Write freeform text to disk
    const id = Date.now().toString();
    const txtPath = path.join(extractDir, `${id}.txt`);
    fs.writeFileSync(txtPath, text, "utf-8");

    // 3) Invoke Python parser
    const jsonPath = path.join(parsedDir, `${id}.json`);
    await new Promise<void>((resolve, reject) => {
      execFile("python3", [parserScript, txtPath, jsonPath], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 4) Read parsed JSON
    const raw = fs.readFileSync(jsonPath, "utf-8");
    const parsedData = JSON.parse(raw);

    // 5) Authenticate user
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/, "");
    if (!token) {
      return NextResponse.json({ status: "error", message: "Missing auth token" }, { status: 401 });
    }
    const decoded = await getAuth().verifyIdToken(token);
    const uid = decoded.uid;

    // 6) Store under history_upload/{id}
    await db
      .collection("users")
      .doc(uid)
      .collection("history_upload")
      .doc(id)
      .set({
        ...parsedData,
        source: "freeform",
        timestamp: new Date(),
      });

    // 7) Return so the UI can refresh its dropdown
    return NextResponse.json({ status: "processing", fileId: id });
  } catch (error) {
    console.error("Freeform route error:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
