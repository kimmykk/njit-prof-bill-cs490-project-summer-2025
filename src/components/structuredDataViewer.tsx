// src/components/structuredDataViewer.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { auth } from "@/lib/firebase";

interface ContactInfo {
  fullName: string;
  primaryEmail: string;
  emails?: string[];
  primaryPhone: string;
  phones?: string[];
}

interface Job {
  title: string;
  company: string;
  description: string;
  startDate: string;
  endDate: string;
  accomplishments?: string[];
}

interface Education {
  institution: string;
  degree: string;
  dates: string;
  gpa?: string;
}

interface StructuredData {
  contact: ContactInfo;
  objectives: string;
  skills: string[];
  jobs: Job[];
  education: Education[];
}

export default function StructuredDataViewer() {
  const [uploadDocs, setUploadDocs] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [data, setData] = useState<StructuredData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch resume IDs for dropdown
  useEffect(() => {
    const fetchUploads = async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/history/uploaded-docs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      setUploadDocs(result.ids || []);
    };
    fetchUploads();
  }, []);

  const fetchData = async () => {
    if (!selectedId) return;
    setLoading(true);
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`/api/history/structured?id=${selectedId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result: StructuredData = await res.json();
    setData(result);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!data || !selectedId) return;
    const token = await auth.currentUser?.getIdToken();
    await fetch(`/api/history/structured?id=${selectedId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    alert("Saved successfully");
  };

  // Generic updater for top-level sections
  const updateField = <T extends keyof StructuredData>(
    section: T,
    value: StructuredData[T]
  ) => {
    setData((prev) => (prev ? { ...prev, [section]: value } : prev));
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Structured Resume Editor</CardTitle>
      </CardHeader>

      <CardContent className="space-y-10">
        {/* Dropdown + Fetch */}
        <div className="flex items-center gap-2">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a resume upload" />
            </SelectTrigger>
            <SelectContent>
              {uploadDocs.map((id) => (
                <SelectItem key={id} value={id}>
                  {id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={fetchData} disabled={!selectedId || loading}>
            {loading ? "Loading..." : "Fetch Structured Data"}
          </Button>
        </div>

        {data && (
          <form className="space-y-10">
            {/* Contact Information */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>

              {/* Full Name */}
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  value={data.contact.fullName}
                  onChange={(e) =>
                    updateField("contact", {
                      ...data.contact,
                      fullName: e.target.value,
                    })
                  }
                  placeholder="Full Name"
                />
              </div>

              {/* Primary Email */}
              <div>
                <label className="text-sm font-medium">Primary Email</label>
                <Input
                  value={data.contact.primaryEmail}
                  onChange={(e) =>
                    updateField("contact", {
                      ...data.contact,
                      primaryEmail: e.target.value,
                      emails: [
                        e.target.value,
                        ...(data.contact.emails?.filter(
                          (em) => em !== data.contact.primaryEmail
                        ) || []),
                      ],
                    })
                  }
                  placeholder="Primary Email"
                  className="border-blue-500"
                />
              </div>

              {/* Additional Emails */}
              <div className="mt-2">
                <h4 className="font-semibold mb-2">Additional Emails</h4>
                {(data.contact.emails || [])
                  .filter((em) => em !== data.contact.primaryEmail)
                  .map((em, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <Input
                        value={em}
                        onChange={(e) => {
                          const others = (data.contact.emails || []).filter(
                            (x) => x !== data.contact.primaryEmail
                          );
                          others[idx] = e.target.value;
                          updateField("contact", {
                            ...data.contact,
                            emails: [data.contact.primaryEmail, ...others],
                          });
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          const others = (data.contact.emails || []).filter(
                            (x) => x !== data.contact.primaryEmail
                          );
                          others.splice(idx, 1);
                          updateField("contact", {
                            ...data.contact,
                            emails: [data.contact.primaryEmail, ...others],
                          });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                <Button
                  type="button"
                  onClick={() =>
                    updateField("contact", {
                      ...data.contact,
                      emails: [
                        ...(data.contact.emails || [
                          data.contact.primaryEmail,
                        ]),
                        "",
                      ],
                    })
                  }
                >
                  Add Email
                </Button>
              </div>

              {/* Primary Phone */}
              <div>
                <label className="text-sm font-medium">Primary Phone</label>
                <Input
                  value={data.contact.primaryPhone}
                  onChange={(e) =>
                    updateField("contact", {
                      ...data.contact,
                      primaryPhone: e.target.value,
                      phones: [
                        e.target.value,
                        ...(data.contact.phones?.filter(
                          (ph) => ph !== data.contact.primaryPhone
                        ) || []),
                      ],
                    })
                  }
                  placeholder="Primary Phone"
                  className="border-blue-500"
                />
              </div>

              {/* Additional Phones */}
              <div className="mt-2">
                <h4 className="font-semibold mb-2">Additional Phones</h4>
                {(data.contact.phones || [])
                  .filter((ph) => ph !== data.contact.primaryPhone)
                  .map((ph, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <Input
                        value={ph}
                        onChange={(e) => {
                          const others = (data.contact.phones || []).filter(
                            (x) => x !== data.contact.primaryPhone
                          );
                          others[idx] = e.target.value;
                          updateField("contact", {
                            ...data.contact,
                            phones: [data.contact.primaryPhone, ...others],
                          });
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          const others = (data.contact.phones || []).filter(
                            (x) => x !== data.contact.primaryPhone
                          );
                          others.splice(idx, 1);
                          updateField("contact", {
                            ...data.contact,
                            phones: [data.contact.primaryPhone, ...others],
                          });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                <Button
                  type="button"
                  onClick={() =>
                    updateField("contact", {
                      ...data.contact,
                      phones: [
                        ...(data.contact.phones || [
                          data.contact.primaryPhone,
                        ]),
                        "",
                      ],
                    })
                  }
                >
                  Add Phone
                </Button>
              </div>
            </section>

            {/* Career Objectives */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Career Objectives</h3>
              <Textarea
                value={data.objectives}
                onChange={(e) => updateField("objectives", e.target.value)}
                placeholder="Your career goals"
              />
            </section>

            {/* Skills */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Skills</h3>
              {data.skills.map((skill, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <Input
                    value={skill}
                    onChange={(e) => {
                      const updated = [...data.skills];
                      updated[idx] = e.target.value;
                      updateField("skills", updated);
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      const updated = data.skills.filter((_, i) => i !== idx);
                      updateField("skills", updated);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                onClick={() => updateField("skills", [...data.skills, ""])}
              >
                Add Skill
              </Button>
            </section>

            {/* Job History */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Job History</h3>
              {data.jobs.map((job, i) => (
                <div
                  key={i}
                  className="border rounded p-3 space-y-2 text-white"
                >
                  <Input
                    value={job.title}
                    onChange={(e) => {
                      const updated = [...data.jobs];
                      updated[i].title = e.target.value;
                      updateField("jobs", updated);
                    }}
                    placeholder="Job Title"
                  />
                  <Input
                    value={job.company}
                    onChange={(e) => {
                      const updated = [...data.jobs];
                      updated[i].company = e.target.value;
                      updateField("jobs", updated);
                    }}
                    placeholder="Company"
                  />
                  <Textarea
                    value={job.description}
                    onChange={(e) => {
                      const updated = [...data.jobs];
                      updated[i].description = e.target.value;
                      updateField("jobs", updated);
                    }}
                    placeholder="Role Description"
                  />
                  <Input
                    value={job.startDate}
                    onChange={(e) => {
                      const updated = [...data.jobs];
                      updated[i].startDate = e.target.value;
                      updateField("jobs", updated);
                    }}
                    placeholder="Start Date"
                  />
                  <Input
                    value={job.endDate}
                    onChange={(e) => {
                      const updated = [...data.jobs];
                      updated[i].endDate = e.target.value;
                      updateField("jobs", updated);
                    }}
                    placeholder="End Date"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      const updated = data.jobs.filter((_, j) => j !== i);
                      updateField("jobs", updated);
                    }}
                  >
                    Remove Job
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                onClick={() =>
                  updateField("jobs", [
                    ...data.jobs,
                    {
                      title: "",
                      company: "",
                      description: "",
                      startDate: "",
                      endDate: "",
                      accomplishments: [],
                    },
                  ])
                }
              >
                Add Job
              </Button>
            </section>

            {/* Education */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Education</h3>
              {data.education.map((edu, i) => (
                <div
                  key={i}
                  className="border rounded p-3 space-y-2 text-white"
                >
                  <Input
                    value={edu.institution}
                    onChange={(e) => {
                      const updated = [...data.education];
                      updated[i].institution = e.target.value;
                      updateField("education", updated);
                    }}
                    placeholder="Institution"
                  />
                  <Input
                    value={edu.degree}
                    onChange={(e) => {
                      const updated = [...data.education];
                      updated[i].degree = e.target.value;
                      updateField("education", updated);
                    }}
                    placeholder="Degree"
                  />
                  <Input
                    value={edu.dates}
                    onChange={(e) => {
                      const updated = [...data.education];
                      updated[i].dates = e.target.value;
                      updateField("education", updated);
                    }}
                    placeholder="Dates Attended"
                  />
                  <Input
                    value={edu.gpa || ""}
                    onChange={(e) => {
                      const updated = [...data.education];
                      updated[i].gpa = e.target.value;
                      updateField("education", updated);
                    }}
                    placeholder="GPA"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      const updated = data.education.filter((_, j) => j !== i);
                      updateField("education", updated);
                    }}
                  >
                    Remove Education
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                onClick={() =>
                  updateField("education", [
                    ...data.education,
                    { institution: "", degree: "", dates: "", gpa: "" },
                  ])
                }
              >
                Add Education
              </Button>
            </section>
          </form>
        )}
      </CardContent>

      <CardFooter className="justify-end">
        {data && <Button onClick={handleSave}>Save</Button>}
      </CardFooter>
    </Card>
  );
}
