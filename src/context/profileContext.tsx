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
  updateCareerObjective: (obj: string) => void;
  updateSkills: (skills: string[]) => void;
  addJobEntry: (job: Omit<JobEntry, "id">) => void;
  updateJobEntry: (id: string, job: Partial<JobEntry>) => void;
  deleteJobEntry: (id: string) => void;
  addEducationEntry: (edu: Omit<EducationEntry, "id">) => void;
  updateEducationEntry: (id: string, edu: Partial<EducationEntry>) => void;
  deleteEducationEntry: (id: string) => void;
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
        saveChanges,
        hasUnsavedChanges,

        updateContactInfo: async (ci) => {
          const ref = getUserProfileRef(hasUserId(), activeProfileId);
          const docSnap = await getDoc(ref);

          if (!docSnap.exists()) {
            await setDoc(ref, {
              ...profileData,
              contactInfo: { ...profileData.contactInfo, ...ci },
            });
          } else {
            await updateDoc(ref, {
              contactInfo: { ...profileData.contactInfo, ...ci },
            });
          }

          updateField("contactInfo", { ...profileData.contactInfo, ...ci });
        },

        updateCareerObjective: async (co: string) => {
          const ref = getUserProfileRef(hasUserId(), activeProfileId);
          const docSnap = await getDoc(ref);

          if (!docSnap.exists()) {
            await setDoc(ref, {
              ...profileData,
              careerObjective: co,
            });
          } else {
            await updateDoc(ref, {
              careerObjective: co,
            });
          }

          updateField("careerObjective", co);
        },

        updateSkills: async (s) => {
          const ref = getUserProfileRef(hasUserId(), activeProfileId);
          const docSnap = await getDoc(ref);

          if (!docSnap.exists()) {
            await setDoc(ref, {
              ...profileData,
              skills: { ...profileData.skills, ...s },
            });
          } else {
            await updateDoc(ref, {
              skills: { ...profileData.skills, ...s },
            });
          }

          updateField("skills", { ...profileData.skills, ...s });
        },

        addJobEntry: async (job) => {
          const newJob = { ...job, id: Date.now().toString() }
          const ref = getUserProfileRef(hasUserId(), activeProfileId);
          const docSnap = await getDoc(ref);
          let existingJobs: JobEntry[] = [];

          if (docSnap.exists()) {
            existingJobs = docSnap.data()?.jobHistory || [];
          } else {
            await setDoc(ref, {
              ...profileData,
              jobHistory: [...profileData.jobHistory, newJob],
            });
            updateField("jobHistory", [...profileData.jobHistory, newJob]);
            return;
          }
          const updatedJobs = [...existingJobs, ...profileData.jobHistory.filter(
            (j) => !existingJobs.some((e) => e.id === j.id)), newJob,];

          await updateDoc(ref, { jobHistory: updatedJobs });
          updateField("jobHistory", updatedJobs);
        },

        updateJobEntry: async (id, job) => {
          const ref = getUserProfileRef(hasUserId(), activeProfileId);
          const docSnap = await getDoc(ref);
          if (!docSnap.exists()) await setDoc(ref, EMPTY_PROFILE, { merge: true });
          const snap = await getDoc(ref);
          const updated = (snap.data()?.jobHistory || []).map((j: JobEntry) =>
            j.id === id ? { ...j, ...job } : j);
          await updateDoc(ref, { jobHistory: updated });

          updateField("jobHistory", updated);
        },

        deleteJobEntry: async (id) => {
          const ref = getUserProfileRef(hasUserId(), activeProfileId);
          const docSnap = await getDoc(ref);
          if (!docSnap.exists()) return;
          const firestoreJobs: JobEntry[] = docSnap.data()?.jobHistory || [];
          const localJobs: JobEntry[] = profileData.jobHistory;
          const mergedJobs = [
            ...firestoreJobs,
            ...localJobs.filter(
              (localJob) => !firestoreJobs.some((f) => f.id === localJob.id)
            ),
          ];

          const filtered = mergedJobs.filter((j) => j.id !== id);

          await updateDoc(ref, { jobHistory: filtered });
          updateField("jobHistory", filtered);
        },

        addEducationEntry: async (ed) => {
          const newEd = { ...ed, id: Date.now().toString() }
          const ref = getUserProfileRef(hasUserId(), activeProfileId);
          const docSnap = await getDoc(ref);
          let existingEd: EducationEntry[] = [];

          if (docSnap.exists()) {
            existingEd = docSnap.data()?.education || [];
          } else {
            await setDoc(ref, {
              ...profileData,
              education: [...profileData.education, newEd],
            });
            updateField("education", [...profileData.education, newEd]);
            return;
          }
          const updatedEd = [...existingEd, ...profileData.education.filter(
            (j) => !existingEd.some((e) => e.id === j.id)), newEd,];

          await updateDoc(ref, { education: updatedEd });
          updateField("education", updatedEd);
        },

        updateEducationEntry: async (id, ed) => {
          const ref = getUserProfileRef(hasUserId(), activeProfileId);
          const docSnap = await getDoc(ref);
          if (!docSnap.exists()) await setDoc(ref, EMPTY_PROFILE, { merge: true });
          const snap = await getDoc(ref);
          const updated = (snap.data()?.education || []).map((e: EducationEntry) =>
            e.id === id ? { ...e, ...ed } : e);
          await updateDoc(ref, { education: updated });
          updateField("education", profileData.education.map((x) =>
            x.id === id ? { ...x, ...ed } : x
          )
          );
        },

        deleteEducationEntry: async (id) => {
          const ref = getUserProfileRef(hasUserId(), activeProfileId);
          const docSnap = await getDoc(ref);
          const existingEd = [...(docSnap.data()?.education || []), ...profileData.education.filter(j =>
            !(docSnap.data()?.education || []).some((e: EducationEntry) => e.id === j.id))
          ];
          const filtered = existingEd.filter((j: EducationEntry) => j.id !== id);
          await updateDoc(ref, { education: filtered });

          updateField("education", filtered);
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
