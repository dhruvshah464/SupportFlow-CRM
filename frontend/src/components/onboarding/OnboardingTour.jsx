import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "../../context/OnboardingContext";
import { useNavigate } from "react-router-dom";
import {
  XIcon, ArrowRightIcon, ArrowLeftIcon, HeadphonesIcon,
  SearchIcon, CheckCircleIcon, PlayIcon
} from "lucide-react";
import { StatusBadge } from "../StatusBadge";

// --- STEPS DEFINITION ---
const TOUR_STEPS = [
  {
    type: "modal",
    title: "Welcome to SupportFlow CRM",
    description: "The modern platform built to help support teams organize, track, and resolve customer issues efficiently.",
    icon: <HeadphonesIcon className="w-8 h-8 text-blue-600" />,
    btnText: "Start Tour",
  },
  {
    type: "highlight",
    selector: "[data-tour='dashboard-stats']",
    title: "Dashboard Overview",
    description: "This is your support operations command center. Monitor total ticket volume, track how many issues are currently open or in progress, and gauge team performance at a glance.",
  },
  {
    type: "highlight",
    selector: "[data-tour='new-ticket']",
    title: "Create Tickets",
    description: "Log new customer requests here. Recording customer details, a clear subject, and issue description helps your team prioritize and resolve problems systematically.",
  },
  {
    type: "modal",
    title: "The Ticket Lifecycle",
    description: "Tickets move through a simple workflow to keep your team aligned:",
    customContent: (
      <div className="flex flex-col gap-4 mt-6 mb-2">
        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
          <StatusBadge status="Open" />
          <p className="text-sm text-gray-600 flex-1">A newly submitted customer issue awaiting triage.</p>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
          <StatusBadge status="In Progress" />
          <p className="text-sm text-gray-600 flex-1">A support agent is actively investigating the resolution.</p>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
          <StatusBadge status="Closed" />
          <p className="text-sm text-gray-600 flex-1">The issue is fully resolved and the customer is happy.</p>
        </div>
      </div>
    ),
  },
  {
    type: "highlight",
    selector: "[data-tour='filters']",
    title: "Search & Filters",
    description: "Quickly find specific tickets. You can search by customer email or issue description, and use the filter chips to isolate high-priority or open tasks.",
  },
  {
    type: "modal",
    title: "Ticket Details & Collaboration",
    description: "When you click into a ticket, you'll see a detailed view where agents can collaborate internally using notes while tracking the customer issue in one unified place.",
    customContent: (
      <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
          <span className="font-mono text-xs font-bold text-blue-600">TKT-0012</span>
          <StatusBadge status="Open" />
        </div>
        <div className="p-4 bg-white">
          <p className="text-sm font-semibold text-gray-900 mb-3">Internal Notes</p>
          <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-200 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-gray-900">Jane Agent</p>
              <p className="text-sm text-gray-700 mt-1">I'm looking into this bug right now. Should be an easy fix.</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    type: "modal",
    title: "Your Private Workspace",
    description: "Every account is isolated securely. Your ticket data is completely private to your workspace and cannot be accessed by other organizations on the platform.",
    icon: <SearchIcon className="w-8 h-8 text-emerald-600" />
  },
  {
    type: "modal",
    title: "You're Ready to Go!",
    description: "You now know the basics of how SupportFlow CRM helps teams manage customer support efficiently.",
    icon: <CheckCircleIcon className="w-10 h-10 text-blue-600" />,
    isCompletion: true,
  }
];

export function OnboardingTour() {
  const { isActive, currentStep, nextStep, prevStep, skipTour } = useOnboarding();
  const [targetRect, setTargetRect] = useState(null);
  const navigate = useNavigate();

  const step = TOUR_STEPS[currentStep];

  // Measure DOM element for highlight steps
  useEffect(() => {
    if (!isActive || !step) return;

    if (step.type === "highlight" && step.selector) {
      const updateRect = () => {
        const el = document.querySelector(step.selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          setTargetRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });
        }
      };
      
      // Delay measurement slightly to ensure DOM is ready
      const timer = setTimeout(updateRect, 100);
      window.addEventListener("resize", updateRect);
      window.addEventListener("scroll", updateRect);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", updateRect);
        window.removeEventListener("scroll", updateRect);
      };
    } else {
      setTargetRect(null);
    }
  }, [isActive, step, currentStep]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") skipTour();
      if (e.key === "ArrowRight") nextStep();
      if (e.key === "ArrowLeft" && currentStep > 0) prevStep();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, currentStep, skipTour, nextStep, prevStep]);

  if (!isActive || !step) return null;

  const isModal = step.type === "modal";

  return createPortal(
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
          />

          {/* Spotlight Cutout (SVG) */}
          {!isModal && targetRect && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <defs>
                <mask id="spotlight">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  <motion.rect
                    animate={{
                      x: targetRect.left - 8,
                      y: targetRect.top - 8,
                      width: targetRect.width + 16,
                      height: targetRect.height + 16,
                    }}
                    transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
                    rx="12"
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="black"
                fillOpacity="0.3"
                mask="url(#spotlight)"
              />
            </svg>
          )}

          {/* Content Container */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {isModal ? (
              // Modal Rendering
              <div className="h-full w-full flex items-center justify-center p-4">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                  className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full pointer-events-auto border border-gray-100"
                >
                  {step.icon && (
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                      {step.icon}
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h2>
                  <p className="text-gray-600 text-base leading-relaxed">{step.description}</p>
                  
                  {step.customContent}

                  <div className="mt-8 flex items-center justify-between">
                    <button onClick={skipTour} className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
                      Skip for now
                    </button>
                    {step.isCompletion ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { skipTour(); navigate("/dashboard/new"); }}
                          className="btn-primary"
                        >
                          Create First Ticket
                        </button>
                      </div>
                    ) : (
                      <button onClick={nextStep} className="btn-primary">
                        {step.btnText || "Next"} <ArrowRightIcon className="w-4 h-4 ml-1" />
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            ) : (
              // Tooltip Rendering
              targetRect && (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    top: targetRect.top + targetRect.height + 24,
                    left: Math.max(16, targetRect.left) // Keep on screen
                  }}
                  transition={{ type: "spring", duration: 0.6, bounce: 0.1 }}
                  className="absolute bg-white rounded-xl shadow-2xl p-5 w-80 pointer-events-auto border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded-md">
                      Step {currentStep + 1} of {TOUR_STEPS.length}
                    </span>
                    <button onClick={skipTour} className="text-gray-400 hover:text-gray-600">
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-5">{step.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={prevStep}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                      disabled={currentStep === 0}
                    >
                      <ArrowLeftIcon className="w-4 h-4" />
                    </button>
                    <button onClick={nextStep} className="btn-primary text-sm px-4 py-1.5">
                      Next
                    </button>
                  </div>
                </motion.div>
              )
            )}
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
