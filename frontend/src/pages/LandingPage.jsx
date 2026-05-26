import { LandingNavbar } from "../components/landing/LandingNavbar";
import { Hero } from "../components/landing/Hero";
import { Features } from "../components/landing/Features";
import { HowItWorks } from "../components/landing/HowItWorks";
import { LandingFooter } from "../components/landing/LandingFooter";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 overflow-x-hidden">
      <LandingNavbar />
      <Hero />
      <Features />
      <HowItWorks />
      <LandingFooter />
    </div>
  );
}
