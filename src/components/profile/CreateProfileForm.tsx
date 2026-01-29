/**
 * CreateProfileForm Component
 *
 * Form for creating a new profile with name, PIN, and avatar color.
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, User, ArrowLeft } from "lucide-react";
import { PinInput } from "./PinInput";
import { PROFILE_AVATAR_COLORS } from "@/profiles/profile_types";

interface CreateProfileFormProps {
  onSubmit: (data: {
    name: string;
    pin: string;
    avatarColor: string;
  }) => Promise<void>;
  onBack?: () => void;
  isLoading?: boolean;
  error?: string;
}

type Step = "name" | "pin" | "confirm-pin" | "color";

export function CreateProfileForm({
  onSubmit,
  onBack,
  isLoading = false,
  error,
}: CreateProfileFormProps) {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [_confirmPin, setConfirmPin] = useState("");
  const [avatarColor, setAvatarColor] = useState<string>(PROFILE_AVATAR_COLORS[0]);
  const [pinError, setPinError] = useState("");

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length >= 1) {
      setStep("pin");
    }
  };

  const handlePinComplete = (enteredPin: string) => {
    setPin(enteredPin);
    setStep("confirm-pin");
  };

  const handleConfirmPinComplete = async (enteredPin: string) => {
    setConfirmPin(enteredPin);

    if (enteredPin !== pin) {
      setPinError("PINs don't match. Try again.");
      setTimeout(() => {
        setPinError("");
        setConfirmPin("");
        setStep("pin");
        setPin("");
      }, 1500);
      return;
    }

    setStep("color");
  };

  const handleColorSelect = async () => {
    await onSubmit({ name: name.trim(), pin, avatarColor });
  };

  const goBack = () => {
    switch (step) {
      case "pin":
        setStep("name");
        break;
      case "confirm-pin":
        setStep("pin");
        setPin("");
        break;
      case "color":
        setStep("confirm-pin");
        setConfirmPin("");
        break;
      default:
        onBack?.();
    }
  };

  // Get first letter of name for avatar preview
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      {/* Header with back button */}
      <div className="flex items-center w-full">
        {(step !== "name" || onBack) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            disabled={isLoading}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h2 className="flex-1 text-xl font-semibold text-center">
          {step === "name" && "What's your name?"}
          {step === "pin" && "Create your PIN"}
          {step === "confirm-pin" && "Confirm your PIN"}
          {step === "color" && "Pick your color!"}
        </h2>
        {/* Spacer for centering */}
        {(step !== "name" || onBack) && <div className="w-10" />}
      </div>

      {/* Avatar Preview (shown on color step) */}
      {step === "color" && (
        <div
          className="h-24 w-24 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg transition-colors"
          style={{ backgroundColor: avatarColor }}
        >
          {initial}
        </div>
      )}

      {/* Name Step */}
      {step === "name" && (
        <form onSubmit={handleNameSubmit} className="w-full space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name" className="sr-only">
              Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="profile-name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 h-14 text-lg"
                maxLength={50}
                autoFocus
                autoComplete="off"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={name.trim().length < 1}
          >
            Continue
          </Button>
        </form>
      )}

      {/* PIN Step */}
      {step === "pin" && (
        <PinInput
          pinLength={4}
          onComplete={handlePinComplete}
          label="Create a 4-digit PIN"
        />
      )}

      {/* Confirm PIN Step */}
      {step === "confirm-pin" && (
        <PinInput
          pinLength={4}
          onComplete={handleConfirmPinComplete}
          label="Enter PIN again"
          error={pinError}
        />
      )}

      {/* Color Step */}
      {step === "color" && (
        <div className="w-full space-y-6">
          <div className="grid grid-cols-4 gap-3">
            {PROFILE_AVATAR_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setAvatarColor(color)}
                className={cn(
                  "h-12 w-12 rounded-full transition-all mx-auto",
                  "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2",
                  avatarColor === color && "ring-2 ring-offset-2 ring-primary",
                )}
                style={{ backgroundColor: color }}
              >
                {avatarColor === color && (
                  <Check className="h-6 w-6 text-white mx-auto" />
                )}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            onClick={handleColorSelect}
            className="w-full h-12 text-lg"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Profile"}
          </Button>
        </div>
      )}
    </div>
  );
}
