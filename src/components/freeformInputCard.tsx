// src/components/freeformInputCard.tsx
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";

interface FreeformInputCardProps {
  onUploadComplete?: () => void;
}

export default function FreeformInputCard({ onUploadComplete }: FreeformInputCardProps) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle"|"submitting"|"processing"|"error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setStatus("submitting");
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/history/freeform", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });
      const result = await res.json();
      if (res.ok && result.fileId) {
        setStatus("processing");
        onUploadComplete?.();
      } else {
        throw new Error(result.message || "Parsing failed");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg mb-6">
      <CardHeader><CardTitle>Submit Freeform Biography</CardTitle></CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <Textarea
            rows={6}
            placeholder="Type or paste your biography here..."
            value={text}
            onChange={e => setText(e.target.value)}
            required
          />
          {status === "submitting" && <p className="text-blue-600">Submitting…</p>}
          {status === "processing" && <p className="text-indigo-600">✔️ Parsing started</p>}
          {status === "error" && <p className="text-red-600">❌ Submission failed</p>}
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={status !== "idle"}>
            {status === "submitting" ? "Submitting…" : "Submit"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
