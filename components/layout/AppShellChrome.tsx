import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { TabBar } from "@/components/layout/TabBar";
import { PageContainer } from "@/components/layout/PageContainer";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { VoiceAssistantWindow } from "@/components/vitru/VoiceAssistantWindow";

interface AppShellChromeProps {
  activeUserId: string;
  fullName: string;
  courseName: string;
  subscriptionCode: string;
  fullBleed: boolean;
  children: ReactNode;
}

export function AppShellChrome({
  activeUserId,
  fullName,
  courseName,
  subscriptionCode,
  fullBleed,
  children,
}: AppShellChromeProps) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header fullName={fullName} courseName={courseName} subscriptionCode={subscriptionCode} />
      {!fullBleed && <TabBar />}
      <div className="flex min-h-0 flex-1">
        <PageContainer fullBleed={fullBleed}>{children}</PageContainer>
      </div>
      <VoiceAssistantWindow activeUserId={activeUserId} />
      {!fullBleed && <BottomNavBar />}
    </div>
  );
}
