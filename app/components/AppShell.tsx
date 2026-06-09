"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/", label: "Tableau de bord", icon: "📊" },
  { href: "/groups", label: "Groupes", icon: "👥" },
  { href: "/users", label: "Utilisateurs", icon: "🧑" },
  { href: "/moderation/reports", label: "Modération", icon: "🚩" },
  { href: "/logs", label: "Logs & activité", icon: "📜" },
];

type Admin = { name: string; email: string; image: string | null };

function Brand() {
  return (
    <div className="flex items-center gap-2 px-5 py-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/bo-logo.svg"
        alt="Rond Point Backoffice"
        className="h-9 w-9 rounded-xl"
      />
      <div className="leading-tight">
        <div className="text-sm font-extrabold text-fg">Rond Point</div>
        <div className="text-xs font-semibold text-muted">Backoffice</div>
      </div>
    </div>
  );
}

function SidebarContent({
  admin,
  onNavigate,
}: {
  admin: Admin;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col">
      <Brand />

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive(item.href)
                ? "bg-surface-raised text-primary"
                : "text-muted hover:bg-surface-raised hover:text-fg"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 flex items-center gap-3 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised text-xs font-bold text-primary">
            {admin.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-xs font-bold text-fg">{admin.name}</div>
            <div className="truncate text-[11px] text-muted">{admin.email}</div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-destructive transition hover:bg-destructive/10"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

export default function AppShell({
  admin,
  children,
}: {
  admin: Admin;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar persistante — desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-surface md:block">
        <SidebarContent admin={admin} />
      </aside>

      {/* Barre du haut — mobile */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
        <button
          aria-label="Ouvrir le menu"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-fg"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/bo-logo.svg" alt="" className="h-7 w-7 rounded-lg" />
          <span className="text-sm font-extrabold text-fg">Backoffice</span>
        </div>
      </header>

      {/* Drawer — mobile */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85%] border-r border-border bg-surface shadow-xl">
            <button
              aria-label="Fermer le menu"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-raised"
            >
              ✕
            </button>
            <SidebarContent admin={admin} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
