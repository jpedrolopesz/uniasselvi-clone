import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { TabBar } from "@/components/layout/TabBar";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SemanticSnapshotProvider } from "@/components/vitru/SemanticSnapshotProvider";
import { GuidedOnboardingLayer } from "@/components/onboarding/GuidedOnboardingLayer";
import type { VitruSemanticSnapshot } from "@/lib/vitru/semantic-snapshot";

interface AppShellChromeProps {
  activeUserId: string;
  fullName: string;
  courseName: string;
  subscriptionCode: string;
  fullBleed: boolean;
  withSidebar: boolean;
  children: ReactNode;
  vitruSnapshot?: VitruSemanticSnapshot | null;
}

export function AppShellChrome({
  activeUserId,
  fullName,
  courseName,
  subscriptionCode,
  fullBleed,
  withSidebar,
  children,
  vitruSnapshot,
}: AppShellChromeProps) {
  return (
    <SemanticSnapshotProvider snapshot={vitruSnapshot}>
      <div className="flex h-dvh flex-col overflow-hidden">
        <Header fullName={fullName} courseName={courseName} subscriptionCode={subscriptionCode} />
        {!fullBleed && <TabBar />}
        <div className="relative flex min-h-0 flex-1">
          {withSidebar && <AppSidebar activeUserId={activeUserId} />}
          <PageContainer fullBleed={fullBleed}>{children}</PageContainer>
        </div>
        <GuidedOnboardingLayer activeUserId={activeUserId} userName={fullName} />
      </div>
    </SemanticSnapshotProvider>
  );
}
