"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";
import { CalendarIcon, GraduationCapIcon, HomeIcon } from "@/components/icons";

const TABS: { label: string; href: string; icon: (props: SVGProps<SVGSVGElement>) => React.JSX.Element }[] = [
  { label: "Home", href: "/", icon: HomeIcon },
  { label: "Calendário de Estudos", href: "/calendario-de-estudos", icon: CalendarIcon },
  { label: "Campus Vitru", href: "/campus-vitru", icon: GraduationCapIcon },
];

function isTabActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Barra de navegação inferior estilo app mobile, visível em qualquer largura
 * de tela. Fica como último item do shell (ver AppShellChrome), que já tem
 * altura travada em h-dvh — por isso não precisa de position: fixed nem de
 * padding de compensação no conteúdo acima.
 */
export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex shrink-0 items-stretch border-t border-border-subtle bg-bg-sidebar pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegação principal"
    >
      {TABS.map(({ label, href, icon: Icon }) => {
        const active = isTabActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition ${
              active ? "text-brand-yellow" : "text-text-secondary/80 hover:text-white"
            }`}
          >
            <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
