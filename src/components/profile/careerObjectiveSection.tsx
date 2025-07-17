// src/components/profile/CareerObjectiveSection.tsx
"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Target } from "lucide-react";
import { useProfile } from "@/context/profileContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/authContext";

interface ObjectiveForm {
  careerObjective: string;
}

const CareerObjectiveSection: React.FC = () => {
  const { activeProfile: profile, activeProfile, updateCareerObjective, markDirty, updateCareerObjectiveToDB, clearDirty, activeProfileId } = useProfile();
  const {
    register,
    handleSubmit, watch,
    trigger, setValue,
    reset,
    formState: { errors },
  } = useForm<ObjectiveForm>();

  useEffect(() => {
    if (profile?.careerObjective) {
      reset({ careerObjective: profile.careerObjective });
    }
  }, [profile?.contactInfo, reset]);
  const { user } = useAuth();

  useEffect(() => {
    const subscription = watch((value) => {
      if (value.careerObjective !== activeProfile.careerObjective) {
        markDirty("careerObjective");
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, activeProfile.careerObjective]);

  const onSubmit = async (data: ObjectiveForm) => {
    if (!user || !activeProfileId) return;
    try {
      const token = await user.getIdToken();

      const res = await fetch(`/api/profiles/${activeProfileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: { careerObjective: data.careerObjective },
        }),
      });

      if (!res.ok) throw new Error("Failed to update career objective");

      updateCareerObjective(data.careerObjective);
      clearDirty("careerObjective");
      toast.success("Career Objective updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Career Objective
        </h2>
        <p className="text-muted-foreground">
          Define your professional goals and career aspirations
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="careerObjective">
            Career Objective Statement
          </Label>
          <div className="relative">
            <Target className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
            <Textarea
              {...register("careerObjective", {
                required: "Career objective is required",
                minLength: {
                  value: 50,
                  message:
                    "Career objective should be at least 50 characters",
                },
              })}
              onChange={(e) => {
                const value = e.target.value;
                setValue("careerObjective", value);
                updateCareerObjective(value);
                markDirty("careerObjective");
                trigger("careerObjective");
              }}
              rows={6}
              className="pl-10 resize-none"
              placeholder="Describe your career goals, what you're looking for in your next role, and how you want to contribute to an organization..."
            />
          </div>
          {errors.careerObjective && (
            <p className="text-sm text-destructive">
              {errors.careerObjective.message}
            </p>
          )}
        </div>
        <Button type="submit" className="mt-4 w-full">Update Career Objective</Button>

      </form>

      {/* Writing Tips */}
      <Card className="border-blue-500">
        <CardHeader>
          <CardTitle className="font-semibold text-blue-400">
            💡 Writing Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1">
            <li>• Keep it concise but impactful (2–3 sentences)</li>
            <li>• Focus on what you can offer, not just what you want</li>
            <li>• Include your key strengths and experience level</li>
            <li>• Mention the type of role or industry you’re targeting</li>
            <li>• Use action words and specific achievements when possible</li>
          </ul>
        </CardContent>
      </Card>

      {/* Example Objectives */}
      <Card className="border-blue-500">
        <CardHeader>
          <CardTitle className="font-semibold text-blue-400">
            📝 Example Objectives
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="border-l-4 border-blue-500 pl-3">
            <strong>Software Engineer:</strong> “Experienced full‐stack
            developer with 5+ years building scalable web applications.
            Seeking a senior engineering role where I can leverage my
            expertise in React, Node.js, and cloud technologies to drive
            innovation and mentor junior developers.”
          </div>
          <div className="border-l-4 border-green-500 pl-3">
            <strong>Marketing Professional:</strong> “Results‐driven digital
            marketing specialist with a proven track record of increasing
            brand awareness by 40% and ROI by 35%. Looking to apply
            data‐driven strategies and creative campaign development in a
            growth‐focused marketing manager position.”
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CareerObjectiveSection;
