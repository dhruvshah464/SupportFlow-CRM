import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Auto-start for new users on login
  useEffect(() => {
    if (user) {
      const hasCompleted = localStorage.getItem(`onboarding_completed_${user.id}`);
      if (!hasCompleted) {
        setIsActive(true);
        setCurrentStep(0);
      }
    } else {
      setIsActive(false);
    }
  }, [user]);

  function startTour() {
    setIsActive(true);
    setCurrentStep(0);
  }

  function nextStep() {
    setCurrentStep((s) => s + 1);
  }

  function prevStep() {
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  function skipTour() {
    setIsActive(false);
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, "true");
    }
  }

  return (
    <OnboardingContext.Provider
      value={{ isActive, currentStep, startTour, nextStep, prevStep, skipTour }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
