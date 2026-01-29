/**
 * PinInput Component
 *
 * Kid-friendly PIN entry with large buttons, visual feedback,
 * and rate limiting after failed attempts.
 */

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Delete, Lock } from "lucide-react";

interface PinInputProps {
  /** Number of PIN digits (4-6) */
  pinLength?: number;
  /** Called when PIN is complete */
  onComplete: (pin: string) => void;
  /** Called when PIN changes */
  onChange?: (pin: string) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
  /** Number of failed attempts (for rate limiting) */
  failedAttempts?: number;
  /** Cooldown time remaining in seconds */
  cooldownSeconds?: number;
  /** Label to show above the PIN dots */
  label?: string;
}

const PIN_DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export function PinInput({
  pinLength = 4,
  onComplete,
  onChange,
  disabled = false,
  error,
  failedAttempts = 0,
  cooldownSeconds = 0,
  label = "Enter PIN",
}: PinInputProps) {
  const [pin, setPin] = useState("");

  // Reset PIN when error changes (new attempt)
  useEffect(() => {
    if (error) {
      // Clear PIN after a short delay to show the error state
      const timer = setTimeout(() => setPin(""), 300);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleDigitPress = useCallback(
    (digit: string) => {
      if (disabled || cooldownSeconds > 0) return;

      if (digit === "⌫") {
        // Backspace
        setPin((prev) => {
          const newPin = prev.slice(0, -1);
          onChange?.(newPin);
          return newPin;
        });
      } else if (digit && pin.length < pinLength) {
        // Add digit
        const newPin = pin + digit;
        setPin(newPin);
        onChange?.(newPin);

        // Check if PIN is complete
        if (newPin.length === pinLength) {
          onComplete(newPin);
        }
      }
    },
    [pin, pinLength, disabled, cooldownSeconds, onComplete, onChange],
  );

  const isInCooldown = cooldownSeconds > 0;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Label */}
      <div className="flex items-center gap-2 text-lg font-medium text-foreground">
        <Lock className="h-5 w-5" />
        <span>{label}</span>
      </div>

      {/* PIN Dots */}
      <div className="flex gap-3">
        {Array.from({ length: pinLength }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 w-4 rounded-full border-2 transition-all duration-200",
              i < pin.length
                ? error
                  ? "bg-destructive border-destructive scale-110"
                  : "bg-primary border-primary scale-110"
                : "bg-transparent border-muted-foreground/40",
            )}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive font-medium animate-shake">
          {error}
        </p>
      )}

      {/* Cooldown message */}
      {isInCooldown && (
        <p className="text-sm text-muted-foreground">
          Too many attempts. Try again in {cooldownSeconds}s
        </p>
      )}

      {/* Failed attempts indicator */}
      {failedAttempts > 0 && failedAttempts < 3 && !isInCooldown && (
        <p className="text-xs text-muted-foreground">
          {3 - failedAttempts} attempts remaining
        </p>
      )}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
        {PIN_DIGITS.map((digit, i) => {
          if (digit === "") {
            // Empty space
            return <div key={i} className="h-16" />;
          }

          const isBackspace = digit === "⌫";
          const isDisabled = disabled || isInCooldown;

          return (
            <Button
              key={i}
              variant="outline"
              size="lg"
              disabled={isDisabled}
              onClick={() => handleDigitPress(digit)}
              className={cn(
                "h-16 text-2xl font-semibold rounded-xl transition-all",
                "hover:bg-accent hover:scale-105 active:scale-95",
                isBackspace && "text-muted-foreground",
                isDisabled && "opacity-50 cursor-not-allowed",
              )}
            >
              {isBackspace ? <Delete className="h-6 w-6" /> : digit}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
