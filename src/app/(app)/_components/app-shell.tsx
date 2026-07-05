"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@gate/web-sdk";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type GateUser = { email: string };

const nav = [
  { href: "/dashboard", label: "Requests", icon: IconInbox },
  { href: "/clients", label: "Clients", icon: IconUsers },
  { href: "/templates", label: "Templates", icon: IconTemplate },
  { href: "/files", label: "Files", icon: IconFile },
  { href: "/settings", label: "Settings", icon: IconGear },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth<GateUser>();

  return (
    <div className="flex min-h-full flex-1">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-line bg-surface/60 px-3 py-5">
        <div className="px-2">
          <span className="font-display text-xl tracking-tight text-brand">Handoff</span>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-brand-tint text-brand-ink" : "text-muted hover:bg-surface-2 hover:text-ink",
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", active ? "text-brand" : "text-faint")} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line pt-3">
          <div className="truncate px-3 text-xs text-faint">{user?.email}</div>
          <button
            onClick={() => logout()}
            className="mt-1 w-full rounded-[var(--radius)] px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}

/* ---------- Page header helper used by app pages ---------- */

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-line px-8 py-6">
      <div>
        <h1 className="font-display text-2xl tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}

/* ---------- tiny inline line icons (no dependency) ---------- */

type IconProps = { className?: string };
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconInbox({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M3 12h5l2 3h4l2-3h5" />
      <path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
function IconUsers({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 6a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.7" />
    </svg>
  );
}
function IconTemplate({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 9h16M9 9v11" />
    </svg>
  );
}
function IconFile({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}
function IconGear({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </svg>
  );
}
