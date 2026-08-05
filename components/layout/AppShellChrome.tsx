"use client";

import { useState, type ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageContainer } from "@/components/layout/PageContainer";

interface AppShellChromeProps {
  fullName: string;
  courseName: string;
  subscriptionCode: string;
  fullBleed: boolean;
  children: ReactNode;
}

export function AppShellChrome({
  fullName,
  courseName,
  subscriptionCode,
  fullBleed,
  children,
}: AppShellChromeProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className={`flex flex-col ${fullBleed ? "h-screen overflow-hidden" : "min-h-screen"}`}>
      <Header
        fullName={fullName}
        courseName={courseName}
        subscriptionCode={subscriptionCode}
        onToggleSidebar={fullBleed ? undefined : () => setIsSidebarOpen((open) => !open)}
      />
      <div className={`flex flex-1 ${fullBleed ? "min-h-0" : ""}`}>
        {!fullBleed && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapsed={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
          />
        )}
        <PageContainer fullBleed={fullBleed}>{children}</PageContainer>
      </div>
    </div>
  );
}
