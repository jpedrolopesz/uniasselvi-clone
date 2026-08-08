import Image from "next/image";
import uniasselviLogo from "@/public/assets/logo/logo-uniasselvi.png";

function initialsFromName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

interface HeaderProps {
  fullName: string;
  courseName: string;
  subscriptionCode: string;
}

export function Header({ fullName, courseName, subscriptionCode }: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-yellow px-6 text-black">
      <div className="flex items-center gap-3">
        <Image src={uniasselviLogo} alt="UNIASSELVI" className="h-7 w-auto" priority />
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right leading-tight">
          <p className="text-sm font-semibold">{fullName}</p>
          <p className="text-xs text-black/70">
            {courseName} ({subscriptionCode})
          </p>
        </div>

        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/80 text-xs font-semibold text-white"
          aria-hidden="true"
        >
          {initialsFromName(fullName)}
        </div>

        <button
          type="button"
          aria-label="Menu do perfil"
          className="text-black/70 transition hover:text-black"
        >
          ▾
        </button>

        <button
          type="button"
          aria-label="Notificações"
          className="relative text-black/70 transition hover:text-black"
        >
          🔔
        </button>
      </div>
    </header>
  );
}
