"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Fitness" },
  { href: "/training", label: "Training" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--color-paper-line)] bg-[var(--color-paper)]">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[var(--color-bib)] mr-2" />
          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "eyebrow text-xs px-3 py-1.5 rounded-md transition-colors",
                    active
                      ? "bg-[var(--color-void)] text-white"
                      : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <span className="font-mono-data text-[11px] text-[var(--color-ink-faint)]">GARMIN CONNECT</span>
      </div>
    </header>
  );
}
