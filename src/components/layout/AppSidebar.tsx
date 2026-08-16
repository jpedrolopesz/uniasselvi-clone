"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type SVGProps } from "react";
import {
  CalendarIcon,
  GraduationCapIcon,
  HomeIcon,
  MonitorIcon,
  UsersIcon,
} from "@/components/icons";
import { VitruLogo } from "@/components/vitru/VitruLogo";
import { openVitruAssistant } from "@/components/vitru/assistant-events";

const NAVIGATION_ITEMS: Array<{
  label: string;
  href: string;
  icon: (props: SVGProps<SVGSVGElement>) => React.JSX.Element;
}> = [
  { label: "Início", href: "/", icon: HomeIcon },
  { label: "Calendário", href: "/calendario-de-estudos", icon: CalendarIcon },
  { label: "Campus Vitru", href: "/campus-vitru", icon: GraduationCapIcon },
  { label: "Comunidade", href: "/comunidade", icon: UsersIcon },
  { label: "Apresentação", href: "/introducao-comunitaria", icon: MonitorIcon },
];

function isItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d={open ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AppSidebar({ activeUserId }: { activeUserId: string }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className={`relative z-30 flex shrink-0 flex-col border-r border-border-subtle bg-bg-sidebar text-text-primary transition-[width] duration-200 ${
        expanded ? "w-56 max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:shadow-2xl" : "w-16 md:w-[72px]"
      }`}
      aria-label="Navegação lateral do AVA"
      data-vitru-id="app-sidebar"
    >
      <div className={`flex h-16 shrink-0 items-center border-b border-border-subtle ${expanded ? "justify-between px-4" : "justify-center"}`}>
        {expanded && (
          <span className="truncate text-xs font-black tracking-[0.16em] text-brand-yellow uppercase">
            Meu AVA
          </span>
        )}
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border-subtle bg-bg-card text-text-secondary transition hover:border-brand-yellow/50 hover:bg-bg-card-hover hover:text-brand-yellow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
          aria-label={expanded ? "Recolher menu lateral" : "Expandir menu lateral"}
          aria-expanded={expanded}
        >
          <MenuIcon open={expanded} />
        </button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 py-4" aria-label="Páginas do AVA">
        {NAVIGATION_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isItemActive(pathname, href);

          return (
            <Link
              key={href}
              href={{ pathname: href, query: { u: activeUserId } }}
              title={expanded ? undefined : label}
              aria-current={active ? "page" : undefined}
              className={`group flex h-12 shrink-0 items-center rounded-xl transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow ${
                expanded ? "gap-3 px-3" : "justify-center"
              } ${
                active
                  ? "bg-brand-yellow text-black shadow-[0_8px_24px_rgba(255,204,0,.12)]"
                  : "text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
              }`}
            >
              <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
              {expanded && <span className="truncate text-sm font-semibold">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle p-2">
        <button
          type="button"
          onClick={openVitruAssistant}
          title={expanded ? undefined : "Abrir assistente Vitru"}
          aria-label="Abrir assistente Vitru"
          className={`flex h-14 w-full items-center rounded-xl border border-brand-yellow/20 bg-brand-yellow/5 text-left transition hover:border-brand-yellow/50 hover:bg-brand-yellow/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow ${
            expanded ? "gap-2 px-2" : "justify-center"
          }`}
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden">
            <span className="scale-75"><VitruLogo size="small" state="idle" /></span>
          </span>
          {expanded && (
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-xs text-brand-yellow">Vitru</strong>
              <small className="block truncate text-[9px] text-accent-green">Assistente disponível</small>
            </span>
          )}
        </button>
      </div>

      <div className={`border-t border-border-subtle p-3 ${expanded ? "text-left" : "text-center"}`}>
        <span className="text-[10px] font-bold tracking-[.12em] text-text-secondary uppercase">
          {expanded ? "Navegação Uniasselvi" : "AVA"}
        </span>
      </div>
    </aside>
  );
}
