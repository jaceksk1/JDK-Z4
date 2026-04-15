"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutGrid,
  ListChecks,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Sun,
  Users,
  X,
} from "lucide-react";

import { cn } from "@acme/ui";
import { useTheme } from "@acme/ui/theme";

import { signOutAction } from "~/auth/actions";
import { useSession } from "~/auth/client";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Kierownik",
  worker: "Pracownik",
};

interface NavItem {
  href: string;
  label: string;
  badge: string;
  icon: LucideIcon;
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/mapa", label: "Mapa Budynku", badge: "M01", icon: LayoutGrid },
  { href: "/zadania", label: "Zadania", badge: "M03", icon: ListChecks },
  { href: "/qa", label: "Q&A", badge: "M08", icon: MessageSquare },
  { href: "/admin/users", label: "Użytkownicy", badge: "ADM", icon: Users },
] as const;

interface NavLinksProps {
  pathname: string;
  onNavigate?: () => void;
}

function NavLinks({ pathname, onNavigate }: NavLinksProps) {
  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="flex-1">{item.label}</span>
            <span
              className={cn(
                "rounded-sm px-1.5 py-0.5 text-[10px] font-mono font-semibold",
                isActive
                  ? "bg-primary-foreground/15 text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground",
              )}
            >
              {item.badge}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarHeader() {
  return (
    <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold tracking-tight">
        Z4
      </div>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="text-sm font-semibold">JDK Z4</span>
        <span className="text-xs text-muted-foreground">Zaspa IV Gdańsk</span>
      </div>
    </div>
  );
}

function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label={isDark ? "Przełącz na jasny" : "Przełącz na ciemny"}
      title={isDark ? "Tryb jasny" : "Tryb ciemny"}
    >
      {isDark ? (
        <Sun className="h-4 w-4" strokeWidth={2} />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={2} />
      )}
    </button>
  );
}

function UserFooter({ onSignOut }: { onSignOut?: () => void }) {
  const { data: session, isPending } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleSignOut() {
    setLoggingOut(true);
    onSignOut?.();
    await signOutAction();
  }

  if (isPending || !session) {
    return (
      <div className="border-t border-sidebar-border px-4 py-3 text-xs text-muted-foreground">
        Ładowanie…
      </div>
    );
  }

  const user = session.user;
  const roleLabel = ROLE_LABELS[user.role ?? "worker"] ?? user.role;
  const initials = user.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="border-t border-sidebar-border p-3">
      <div className="mb-2 flex items-center gap-2 px-2 py-1.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
          {initials}
        </div>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-sm font-medium">{user.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {roleLabel}
          </span>
        </div>
        <ThemeToggleButton />
      </div>
      <button
        onClick={handleSignOut}
        disabled={loggingOut}
        className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" strokeWidth={2} />
        {loggingOut ? "Wylogowywanie…" : "Wyloguj"}
      </button>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <SidebarHeader />
        <div className="flex-1 overflow-y-auto py-3">
          <NavLinks pathname={pathname} />
        </div>
        <UserFooter />
      </aside>

      {/* ── Mobile: top bar ─────────────────────────────────────────── */}
      <div className="md:hidden fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Otwórz menu"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            Z4
          </div>
          <span className="text-sm font-semibold">JDK Z4</span>
        </div>
      </div>

      {/* ── Mobile: drawer overlay ───────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar shadow-xl">
            <div className="flex items-center justify-between border-b border-sidebar-border">
              <SidebarHeader />
              <button
                onClick={() => setMobileOpen(false)}
                className="mr-3 rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Zamknij menu"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3">
              <NavLinks
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
            <UserFooter onSignOut={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}
