import { db } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { ObjectId } from "mongodb"; // ✅ REQUIRED

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY!)),
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = req.headers.get("Authorization")?.split(" ")[1];
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(auth);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { id } = params;

  try {
    const result = await db.collection("jobAds").deleteOne({
      _id: new ObjectId(id),
      userId: decoded.uid,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Job ad not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Error deleting job ad:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
