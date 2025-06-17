// src/app/api/history/structured/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, cert, getApps, ServiceAccount } from "firebase-admin/app";

// Initialize Firebase Admin if not already initialized
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY!) as ServiceAccount;

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.split("Bearer ")[1];
  const id = req.nextUrl.searchParams.get("id");

  if (!token || !id) {
    return NextResponse.json({ error: "Unauthorized or missing ID" }, { status: 400 });
  }

  try {
    const decoded = await getAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const docRef = db.collection("users").doc(uid).collection("history_upload").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json(docSnap.data(), { status: 200 });
  } catch (error) {
    console.error("Error fetching structured data:", error);
    return NextResponse.json({ error: "Failed to fetch structured data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.split("Bearer ")[1];
  const id = req.nextUrl.searchParams.get("id");

  if (!token || !id) {
    return NextResponse.json({ error: "Unauthorized or missing ID" }, { status: 400 });
  }

  try {
    const decoded = await getAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const data = await req.json();

    const docRef = db.collection("users").doc(uid).collection("history_upload").doc(id);
    await docRef.set(data, { merge: true });

    return NextResponse.json({ message: "Structured data saved successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error saving structured data:", error);
    return NextResponse.json({ error: "Failed to save structured data" }, { status: 500 });
  }
}
