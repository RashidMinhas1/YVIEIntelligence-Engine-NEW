"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wand2, History, LayoutDashboard, Library, Settings, Cpu, Clock, Clapperboard, Lightbulb, SquareTerminal } from "lucide-react";
import { ActiveProviderBadge } from "./ActiveProviderBadge";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/builder", label: "Builder", icon: Cpu },
  { href: "/studio", label: "Creator Studio", icon: Clapperboard },
  { href: "/script-prompt-generator", label: "Script Prompt Generator", icon: SquareTerminal },
  { href: "/wizard", label: "Wizard", icon: Wand2 },
  { href: "/library", label: "Library", icon: Library },
  { href: "/intelligence", label: "Intelligence", icon: Lightbulb },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/history", label: "History", icon: History },
];

export function GlobalHeader() {
  const pathname = usePathname();

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-6 gap-6 shrink-0 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-1">
        <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
          <span className="text-xs font-black text-primary-foreground">Y</span>
        </div>
        <span className="font-black text-base tracking-tight ml-0.5">YVIE</span>
        <span className="text-[11px] text-muted-foreground font-mono ml-0.5 leading-none">Intelligence Engine</span>
      </div>
      <nav className="flex items-center gap-1 ml-auto overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center ml-2 border-l border-border pl-4">
        <ActiveProviderBadge />
      </div>
    </header>
  );
}
