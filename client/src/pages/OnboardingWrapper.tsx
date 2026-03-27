/* ── Onboarding Wrapper ──────────────────────────────────────
   Now only renders the Chat (Quick Start) version.
   Wizard version removed per user request.
   ──────────────────────────────────────────────────────────── */

import OnboardingChat from "./OnboardingChat";

export default function OnboardingWrapper() {
  return <OnboardingChat />;
}
