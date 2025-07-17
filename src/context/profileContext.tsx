// src/context/profileContext.tsx
"use client";
import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "@/context/authContext";
import { UserRoundIcon } from "lucide-react";

export interface ContactInfo {
  email: string;
  phone: string;
  additionalEmails?: string[];
  additionalPhones?: string[];
}

export interface JobEntry {
  id: string;
  company: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  accomplishments: string[];
}

export interface EducationEntry {
  id: string;
  school: string;
  degree: string;
  dates: string;
  gpa?: string;
}

export interface ProfileData {
  contactInfo: ContactInfo;
  careerObjective: string;
  skills: string[];
  jobHistory: JobEntry[];
  education: EducationEntry[];
}

export type ProfileDoc = {
  id: string;
  name: string;
  data: ProfileData;
};

export interface ProfileContextType {
  profiles: ProfileDoc[];
  activeProfileId: string;
  activeProfile: ProfileData & { name: string };
  setActiveProfileId: (id: string) => void;
  createProfile: () => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  renameProfile: (newName: string) => Promise<void>;
  parseFile: (fileId: string) => Promise<Partial<ProfileData>>;
  saveChanges: () => Promise<void>;
  hasUnsavedChanges: boolean;
  updateContactInfo: (ci: Partial<ContactInfo>) => void;
  updateContactInfoToDB: () => Promise<void>;
  updateCareerObjective: (obj: string) => void;
  updateCareerObjectiveToDB: () => Promise<void>;
  updateSkills: (skills: string[]) => void;
  addJobEntry: (job: Omit<JobEntry, "id">) => void;
  updateJobEntry: (id: string, job: Partial<JobEntry>) => void;
  updateFullJobHistory: (jobHistory: JobEntry[]) => Promise<void>;
  deleteJobEntry: (id: string) => void;
  addEducationEntry: (edu: Omit<EducationEntry, "id">) => void;
  updateEducationEntry: (id: string, edu: Partial<EducationEntry>) => void;
  updateFullEducation: (education: EducationEntry[]) => Promise<void>;
  deleteEducationEntry: (id: string) => void;
  markDirty: (section: "contactInfo" | "careerObjective" | "skills" | "jobHistory" | "education") => void;
  clearDirty: (section: "contactInfo" | "careerObjective" | "skills" | "jobHistory" | "education") => void;
  dirty: {
    contactInfo: boolean;
    careerObjective: boolean;
    skills: boolean;
    jobHistory: boolean;
    education: boolean;
  };
}

const EMPTY_PROFILE: ProfileData = {
  contactInfo: { email: "", phone: "" },
  careerObjective: "",
  skills: [],
  jobHistory: [],
  education: [],
};

const ProfileContext = createContext<ProfileContextType | undefined>(
  undefined
);

const getUserProfileRef = (userId: string, profileId: string) =>
  doc(db, "users", userId, "profiles", profileId);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [profiles, setProfiles] = useState<ProfileDoc[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>("");
  const [profileData, setProfileData] = useState<ProfileData>(
    EMPTY_PROFILE
  );
  const [profileName, setProfileName] = useState<string>(""); // keep name too
  const [hasUnsavedChanges, setHasUnsavedChanges] =
    useState<boolean>(false);
  const [dirty, setDirty] = useState({
    contactInfo: false,
    careerObjective: false,
    skills: false,
    jobHistory: false,
    education: false,
  });


  // Fetch list of profiles
  const loadProfiles = useCallback(async () => {
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch("/api/profiles", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load profiles");
    const list = (await res.json()) as ProfileDoc[];
    setProfiles(list);
    if (!activeProfileId && list.length > 0) {
      setActiveProfileId(list[0].id);
      setProfileName(list[0].name);
      setProfileData(list[0].data);
    }
  }, [user, activeProfileId]);

  // Whenever activeProfileId changes, fetch its data
  useEffect(() => {
    if (!activeProfileId || !user) return;
    (async () => {
      const token = await user.getIdToken();
      const res = await fetch(`/api/profiles/${activeProfileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load profile");
      const doc = (await res.json()) as ProfileDoc;
      setProfileName(doc.name);
      setProfileData(doc.data);
      setHasUnsavedChanges(false);
    })();
  }, [activeProfileId, user]);

  // Initial load
  useEffect(() => {
    if (!loading) {
      loadProfiles().catch(console.error);
    }
  }, [loading, loadProfiles]);

  const markUnsaved = () => setHasUnsavedChanges(true);

  const updateField = <K extends keyof ProfileData>(
    key: K,
    value: ProfileData[K]
  ) => {
    setProfileData((prev) => ({ ...prev, [key]: value }));
    markUnsaved();
  };

  const createProfile = useCallback(async () => {
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch("/api/profiles", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Create failed");
    const doc = (await res.json()) as { id: string; name: string };
    setActiveProfileId(doc.id);
    await loadProfiles();
  }, [user, loadProfiles]);

  const deleteProfile = useCallback(
    async (id: string) => {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`/api/profiles/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      if (id === activeProfileId) {
        setActiveProfileId("");
      }
      await loadProfiles();
    },
    [user, activeProfileId, loadProfiles]
  );

  const renameProfile = useCallback(
    async (newName: string) => {
      if (!user || !activeProfileId) return;
      const token = await user.getIdToken();
      const res = await fetch(`/api/profiles/${activeProfileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) throw new Error("Rename failed");
      await loadProfiles();
    },
    [user, activeProfileId, loadProfiles]
  );

  const saveChanges = useCallback(async () => {
    if (!user || !activeProfileId) return;
    const token = await user.getIdToken();
    const res = await fetch(`/api/profiles/${activeProfileId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data: profileData }),
    });
    if (!res.ok) throw new Error("Save failed");
    setHasUnsavedChanges(false);
    setDirty({
      contactInfo: false,
      careerObjective: false,
      skills: false,
      jobHistory: false,
      education: false,
    });
    await loadProfiles();
  }, [user, activeProfileId, profileData, loadProfiles]);

  const parseFile = useCallback(
    async (fileId: string): Promise<Partial<ProfileData>> => {
      if (!user || !activeProfileId) return {};
      const token = await user.getIdToken();

      // send JSON; parse-route expects jSON { fileId }
      const res = await fetch(`/api/profiles/${activeProfileId}/parse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileId }),
      });
      if (!res.ok) throw new Error("Parse failed");
      const parsed = (await res.json()) as Partial<ProfileData>;

      setProfileData((prev) => {

        const merged: Partial<ProfileData> = { ...prev };
        if (parsed.jobHistory) {
          const allJobs = [...(prev.jobHistory || []), ...parsed.jobHistory];
          const dedupedJobs = Array.from(
            new Map(allJobs.map((job) => [job.id, job])).values()
          );
          merged.jobHistory = dedupedJobs;
        }

        if (parsed.education) {
          const allEd = [...(prev.education || []), ...parsed.education];
          const dedupedEd = Array.from(
            new Map(allEd.map((e) => [e.id, e])).values()
          );
          merged.education = dedupedEd;
        }

        if (parsed.skills) merged.skills = [...new Set([...(prev.skills || []), ...parsed.skills])];
        if (parsed.careerObjective) merged.careerObjective = parsed.careerObjective;
        if (parsed.contactInfo) {
          merged.contactInfo = {
            ...(prev.contactInfo || {}),
            ...parsed.contactInfo,
          };
        }

        return merged as ProfileData;
      });

      markUnsaved();
      return parsed;
    },
    [user, activeProfileId]
  );

  function hasUserId(): string {
    if (!user?.uid) throw new Error("User ID is missing.");
    return user.uid;
  }

  const markDirty = (section: keyof typeof dirty) => {
    setHasUnsavedChanges(true);
    setDirty((prev) => ({ ...prev, [section]: true }));
  };

  const clearDirty = (section: keyof typeof dirty) => {
    setDirty((prev) => {
      const updated = { ...prev, [section]: false };

      const stillDirty = Object.values(updated).some((v) => v);
      setHasUnsavedChanges(stillDirty);

      return updated;
    });
  };

  const updateFullJobHistory = async (jobHistory: JobEntry[]) => {
    if (!user || !activeProfileId) return;

    const token = await user.getIdToken();
    const res = await fetch(`/api/profiles/${activeProfileId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data: { jobHistory } }),
    });

    if (!res.ok) throw new Error("Failed to update job history");

    setProfileData(prev => ({
      ...prev,
      jobHistory
    }));
    setDirty(prev => ({ ...prev, jobHistory: false }));
    setHasUnsavedChanges(false);
  };

  const updateFullEducation = async (education: EducationEntry[]) => {
    if (!user || !activeProfileId) return;

    const token = await user.getIdToken();
    const res = await fetch(`/api/profiles/${activeProfileId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data: { education } }),
    });

    if (!res.ok) throw new Error("Failed to update job history");

    setProfileData(prev => ({
      ...prev,
      education
    }));
    setDirty(prev => ({ ...prev, education: false }));
    setHasUnsavedChanges(false);
  };

  const updateCareerObjectiveToDB = async () => {
    if (!user || !activeProfileId) return;
    const token = await user.getIdToken();
    await fetch(`/api/profiles/${activeProfileId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: { careerObjective: profileData.careerObjective },
      }),
    });
    setDirty((prev) => ({ ...prev, careerObjective: false }));
    setHasUnsavedChanges(false);
  };

  const updateContactInfoToDB = async () => {
    if (!user || !activeProfileId) return;
    const token = await user.getIdToken();
    await fetch(`/api/profiles/${activeProfileId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: { contactInfo: profileData.contactInfo },
      }),
    });
    setDirty((prev) => ({ ...prev, contactInfo: false }));
    setHasUnsavedChanges(false);
  };

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfileId,
        activeProfile: { ...profileData, name: profileName },
        setActiveProfileId,
        createProfile,
        deleteProfile,
        renameProfile,
        parseFile,
        updateFullJobHistory,
        updateFullEducation,
        updateCareerObjectiveToDB,
        updateContactInfoToDB,
        dirty,
        clearDirty,
        markDirty,
        saveChanges,
        hasUnsavedChanges,

        updateContactInfo: (ci: Partial<ContactInfo>) => {
          updateField("contactInfo", {
            ...profileData.contactInfo,
            ...ci,
          });
          markDirty("contactInfo");
        },

        updateCareerObjective: (co: string) => {
          updateField("careerObjective", co);
          markDirty("careerObjective");
        },

        updateSkills: (skills) => {
          updateField("skills", skills);
          markDirty("skills");
        },

        addJobEntry: (job) => {
          const newJob = { ...job, id: Date.now().toString() };
          const updated = [...profileData.jobHistory, newJob];
          updateField("jobHistory", updated);
          markDirty("jobHistory");
        },

        updateJobEntry: (id, job) => {
          const updated = profileData.jobHistory.map((j) =>
            j.id === id ? { ...j, ...job } : j
          );
          updateField("jobHistory", updated);
          markDirty("jobHistory");
        },

        deleteJobEntry: (id) => {
          const updated = profileData.jobHistory.filter((job) => job.id !== id);
          updateField("jobHistory", updated);
          markDirty("jobHistory");
        },

        addEducationEntry: (ed) => {
          const newEdu = { ...ed, id: Date.now().toString() };
          const updated = [...profileData.education, newEdu];
          updateField("education", updated);
          markDirty("education");
        },

        updateEducationEntry: (id, ed) => {
          const updated = profileData.education.map((e) =>
            e.id === id ? { ...e, ...ed } : e
          );
          updateField("education", updated);
          markDirty("education");
        },

        deleteEducationEntry: (id) => {
          const updated = profileData.education.filter((edu) => edu.id !== id);
          updateField("education", updated);
          markDirty("education");
        },

      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextType {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be inside ProfileProvider");
  }
  return ctx;
}
