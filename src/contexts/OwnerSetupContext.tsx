/**
 * OwnerSetupContext
 *
 * Provides global access to owner setup wizard state.
 * Allows any component to trigger the owner setup wizard.
 */

import React, { createContext, useContext, useState, useCallback } from "react";

interface OwnerSetupContextValue {
  /** Whether the owner setup wizard is open */
  isOpen: boolean;
  /** Open the owner setup wizard */
  openSetup: (initialStep?: number) => void;
  /** Close the owner setup wizard */
  closeSetup: () => void;
  /** Initial step to show (0 = publishing, 1 = vault, 2 = done) */
  initialStep: number;
}

const OwnerSetupContext = createContext<OwnerSetupContextValue | null>(null);

export function OwnerSetupProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialStep, setInitialStep] = useState(0);

  const openSetup = useCallback((step: number = 0) => {
    setInitialStep(step);
    setIsOpen(true);
  }, []);

  const closeSetup = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <OwnerSetupContext.Provider
      value={{ isOpen, openSetup, closeSetup, initialStep }}
    >
      {children}
    </OwnerSetupContext.Provider>
  );
}

export function useOwnerSetup() {
  const context = useContext(OwnerSetupContext);
  if (!context) {
    throw new Error("useOwnerSetup must be used within OwnerSetupProvider");
  }
  return context;
}
