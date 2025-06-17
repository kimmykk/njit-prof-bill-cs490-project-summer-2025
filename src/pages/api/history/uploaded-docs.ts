import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { ServiceAccount } from "firebase-admin";

// Load service account from environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY!) as ServiceAccount;

// Initialize Firebase Admin SDK only once
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ status: "unauthorized" });

    const decoded = await getAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("history_upload")
      .get();

    const ids = snapshot.docs.map((doc) => doc.id);

    res.status(200).json({ ids });
  } catch (err) {
    console.error("Error fetching uploaded resume IDs:", err);
    res.status(500).json({ status: "error" });
  }
}
