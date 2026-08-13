"use client";

import { useRouter } from "next/navigation";
import type { UserIndexEntry } from "@/lib/types/raw/local";

interface UserSwitcherProps {
  users: UserIndexEntry[];
  activeUserId: string;
}

/** Seletor de usuário ativo, renderizado apenas em desenvolvimento (ver AppShell). */
export function UserSwitcher({ users, activeUserId }: UserSwitcherProps) {
  const router = useRouter();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextUserId = event.target.value;
    const url = new URL(window.location.href);
    url.searchParams.set("u", nextUserId);
    router.push(`${url.pathname}${url.search}`);
    router.refresh();
  }

  return (
    <div className="fixed bottom-20 right-3 z-50 flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-card px-3 py-2 text-xs shadow-lg">
      <span className="text-text-secondary">DEV · usuário ativo</span>
      <select
        value={activeUserId}
        onChange={handleChange}
        className="rounded border border-border-subtle bg-bg-app px-2 py-1 text-white"
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.label}
          </option>
        ))}
      </select>
    </div>
  );
}
