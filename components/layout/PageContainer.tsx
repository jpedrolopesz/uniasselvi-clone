import type { ReactNode } from "react";

export function PageContainer({ children }: { children: ReactNode }) {
  return <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>;
}
