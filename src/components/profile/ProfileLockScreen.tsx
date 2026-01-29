/**
 * ProfileLockScreen Component
 *
 * Main lock screen that shows on first run or when no active profile.
 * - First run (no profiles): Shows create profile form
 * - Profiles exist: Shows profile picker with PIN entry
 */

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Sparkles } from "lucide-react";
import { ProfileCard } from "./ProfileCard";
import { PinInput } from "./PinInput";
import { CreateProfileForm } from "./CreateProfileForm";
import { useProfile } from "@/contexts/ProfileContext";
import type { ProfileSummary } from "@/profiles/profile_types";

// Rate limiting constants
const MAX_FAILED_ATTEMPTS = 3;
const COOLDOWN_SECONDS = 30;

export function ProfileLockScreen() {
  const {
    profiles,
    hasProfiles,
    login,
    createProfile,
    isLoading: contextLoading,
  } = useProfile();

  const [mode, setMode] = useState<"select" | "create" | "pin">("select");
  const [selectedProfile, setSelectedProfile] = useState<ProfileSummary | null>(
    null,
  );
  const [pinError, setPinError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  // Rate limiting state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (!cooldownEnd) return;

    const interval = setInterval(() => {
      const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000);
      if (remaining <= 0) {
        setCooldownSeconds(0);
        setCooldownEnd(null);
        setFailedAttempts(0);
      } else {
        setCooldownSeconds(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownEnd]);

  // Auto-switch to create mode if no profiles exist
  useEffect(() => {
    if (!contextLoading && !hasProfiles) {
      setMode("create");
    }
  }, [contextLoading, hasProfiles]);

  const handleProfileSelect = useCallback((profile: ProfileSummary) => {
    setSelectedProfile(profile);
    setPinError("");
    setMode("pin");
  }, []);

  const handlePinComplete = useCallback(
    async (pin: string) => {
      if (!selectedProfile) return;

      setIsSubmitting(true);
      setPinError("");

      try {
        const result = await login(selectedProfile.id, pin);

        if (!result.success) {
          const newFailedAttempts = failedAttempts + 1;
          setFailedAttempts(newFailedAttempts);

          if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
            // Start cooldown
            setCooldownEnd(Date.now() + COOLDOWN_SECONDS * 1000);
            setCooldownSeconds(COOLDOWN_SECONDS);
            setPinError("Too many attempts");
          } else {
            setPinError(result.error || "Incorrect PIN");
          }
        }
        // Success: ProfileContext will update activeProfile and hide lock screen
      } catch {
        setPinError("Something went wrong");
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedProfile, login, failedAttempts],
  );

  const handleCreateProfile = useCallback(
    async (data: { name: string; pin: string; avatarColor: string }) => {
      setIsSubmitting(true);
      setCreateError("");

      try {
        const result = await createProfile({
          name: data.name,
          pin: data.pin,
          avatarColor: data.avatarColor,
        });

        if (!result.success) {
          setCreateError(result.error || "Failed to create profile");
        }
        // Success: ProfileContext will auto-login and hide lock screen
      } catch (err) {
        setCreateError(
          err instanceof Error ? err.message : "Failed to create profile",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [createProfile],
  );

  const goBack = useCallback(() => {
    if (mode === "pin") {
      setSelectedProfile(null);
      setPinError("");
      setFailedAttempts(0);
      setCooldownEnd(null);
      setCooldownSeconds(0);
    }
    setMode("select");
  }, [mode]);

  // Loading state
  if (contextLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50 p-6">
      {/* ABBA Logo/Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">ABBA AI</h1>
        </div>
        <p className="text-muted-foreground">
          {!hasProfiles
            ? "Welcome! Let's create your profile."
            : mode === "select"
              ? "Who's building today?"
              : mode === "create"
                ? "Create a new profile"
                : `Welcome back, ${selectedProfile?.name}!`}
        </p>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-lg">
        {/* Profile Selection Mode */}
        {mode === "select" && hasProfiles && (
          <div className="flex flex-col items-center gap-6">
            {/* Profile Grid */}
            <div className="flex flex-wrap justify-center gap-4">
              {profiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onClick={() => handleProfileSelect(profile)}
                  size="lg"
                />
              ))}
            </div>

            {/* Add New Profile Button */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => setMode("create")}
              className="mt-4"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Profile
            </Button>
          </div>
        )}

        {/* PIN Entry Mode */}
        {mode === "pin" && selectedProfile && (
          <div className="flex flex-col items-center gap-6">
            {/* Back button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="self-start"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {/* Selected profile avatar */}
            <div
              className="h-24 w-24 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg"
              style={{
                backgroundColor: selectedProfile.avatarColor || "#8B5CF6",
              }}
            >
              {selectedProfile.name.charAt(0).toUpperCase()}
            </div>

            {/* PIN Input */}
            <PinInput
              pinLength={4}
              onComplete={handlePinComplete}
              disabled={isSubmitting}
              error={pinError}
              failedAttempts={failedAttempts}
              cooldownSeconds={cooldownSeconds}
              label="Enter your PIN"
            />
          </div>
        )}

        {/* Create Profile Mode */}
        {mode === "create" && (
          <CreateProfileForm
            onSubmit={handleCreateProfile}
            onBack={hasProfiles ? goBack : undefined}
            isLoading={isSubmitting}
            error={createError}
          />
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-8">
        <p className="text-xs text-muted-foreground text-center">
          ABBA AI • Building dreams together
        </p>
      </div>
    </div>
  );
}
