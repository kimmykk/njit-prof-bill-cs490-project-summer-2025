"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/context/toastContext";
import { Button } from "@/components/ui/button";

interface JobAd {
  id: string;
  url?: string;
  rawText?: string;
  companyName: string;
  jobTitle: string;
  postedAt: string;
  previewHtml: string;
}

interface ParsedJob {
  jobTitle: string;
  companyName: string;
  postedAt: string;
  location?: string;
  description: string;
  requirements: string[];
}

export default function JobAdsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [url, setUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [jobAds, setJobAds] = useState<JobAd[]>([]);
  const [selectedAd, setSelectedAd] = useState<JobAd | null>(null);
  const [parsed, setParsed] = useState<ParsedJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) => {
      fetch("/api/job-ads", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((ads: JobAd[]) => {
          setJobAds(ads);
          if (ads.length > 0) setSelectedAd(ads[0]);
        })
        .catch(console.error);

      fetch("/api/profiles", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((plist: { id: string; name: string }[]) => {
          setProfiles(plist);
          if (plist.length > 0) setSelectedProfileId(plist[0].id);
        })
        .catch(console.error);
    });
  }, [user]);

  useEffect(() => {
    if (!selectedAd) {
      setParsed(null);
      return;
    }
    setParsing(true);
    fetch("/api/job-ads/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: selectedAd.url,
        rawText: selectedAd.rawText,
      }),
    })
      .then((r) => r.json())
      .then((pj: ParsedJob) => setParsed(pj))
      .catch((err) => toast.error("Failed to parse job ad"))
      .finally(() => setParsing(false));
  }, [selectedAd, toast]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/job-ads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url || undefined,
          rawText: rawText || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      const newAd: JobAd = {
        id: data.id,
        url: data.url,
        rawText: data.rawText,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        postedAt: data.postedAt,
        previewHtml: data.previewHtml,
      };

      setJobAds((prev) => [newAd, ...prev]);
      setSelectedAd(newAd);
      setUrl("");
      setRawText("");
      toast.success("Job ad saved!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/job-ads/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete job ad");
      }

      setJobAds((prev) => prev.filter((ad) => ad.id !== id));
      if (selectedAd?.id === id) setSelectedAd(null);

      toast.success("Job ad deleted!");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleGenerate = async () => {
    if (!user || !selectedAd || !selectedProfileId) return;
    setGenerating(true);
    setGeneratedResume("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/generate-resume", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId: selectedProfileId,
          jobAdId: selectedAd.id,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Generation failed");
      setGeneratedResume(result.resume);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 py-8">
      {/* Main Content */}
      <div className="lg:col-span-3 space-y-8">
        {/* Form */}
        <section className="p-6 bg-neutral-800 rounded-lg space-y-4">
          <h1 className="text-2xl font-bold">Add Job Ad</h1>
          <div className="space-y-2">
            <label className="block">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2 bg-neutral-700 rounded"
              placeholder="https://example.com/job-posting"
            />
          </div>
          <div className="space-y-2">
            <label className="block">Or Paste Text</label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-2 bg-neutral-700 rounded"
              rows={4}
            />
          </div>
          <Button onClick={handleSave} disabled={loading || (!url && !rawText)}>
            {loading ? "Saving…" : "Save Job Ad"}
          </Button>
        </section>

        {/* Parsed Info */}
        {selectedAd && (
          <section className="p-6 bg-neutral-800 rounded-lg space-y-4">
            <h2 className="text-xl font-semibold">
              {parsing ? "Extracting…" : parsed?.jobTitle || "Loading…"}
            </h2>
            {parsed && (
              <>
                <p className="text-sm text-neutral-400">
                  <strong>Company:</strong> {parsed.companyName}
                </p>
                <p className="text-sm text-neutral-400">
                  <strong>Posted at:</strong> {parsed.postedAt}
                </p>
                {parsed.location && (
                  <p className="text-sm text-neutral-400">
                    <strong>Location:</strong> {parsed.location}
                  </p>
                )}
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p className="text-sm">{parsed.description}</p>
                </div>
                <div>
                  <h3 className="font-medium">Requirements</h3>
                  <ul className="list-disc list-inside text-sm">
                    {parsed.requirements.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </section>
        )}

        {/* Resume Generation */}
        {selectedAd && profiles.length > 0 && (
          <section className="p-6 bg-neutral-800 rounded-lg space-y-4">
            <h2 className="text-xl font-semibold">Generate Resume</h2>
            <div className="flex items-center space-x-4">
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="bg-neutral-700 p-2 rounded"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? "Processing…" : "Generate Resume"}
              </Button>
            </div>
            {generatedResume && (
              <pre className="whitespace-pre-wrap bg-neutral-700 p-4 rounded text-sm">
                {generatedResume}
              </pre>
            )}
          </section>
        )}
      </div>

      {/* Sidebar */}
      <aside className="bg-neutral-900 p-4 rounded-lg space-y-4 border border-neutral-700 h-fit">
        <h2 className="text-xl font-semibold text-white">Saved Job Ads</h2>

        {jobAds.length === 0 ? (
          <div className="text-center py-16 text-neutral-400 space-y-2">
            <div className="text-5xl">=(</div>
            <p className="text-sm">No job ads saved yet.</p>
            <p className="text-xs">Paste a link or job description above to get started!</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {jobAds.map((ad) => (
              <li key={ad.id} className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedAd(ad)}
                  className={`flex-1 text-left p-3 rounded-lg transition text-sm ${selectedAd?.id === ad.id
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                    }`}
                >
                  <div className="font-medium">{ad.jobTitle}</div>
                  <div className="text-xs text-neutral-400">
                    {ad.companyName} • {new Date(ad.postedAt).toLocaleDateString()}
                  </div>
                </button>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this job ad?")) {
                      handleDeleteAd(ad.id);
                    }
                  }}
                  className="text-red-400 hover:text-red-500 text-sm"
                  title="Delete"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
