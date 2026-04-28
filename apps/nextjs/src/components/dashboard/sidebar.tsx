"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  FileSearch,
  FolderOpen,
  FolderTree,
  Home,
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
import { useTRPC } from "~/trpc/react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Kierownik",
  worker: "Pracownik",
};

interface NavItem {
  href?: string;
  label: string;
  badge?: string;
  icon: LucideIcon;
  showUnread?: boolean;
  adminOnly?: boolean;
  children?: NavItem[];
  /** Aktywny tylko gdy searchParams[key] === value (null = brak parametru). */
  matchSearch?: { key: string; value: string | null };
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home, showUnread: true },
  {
    label: "Projekt",
    icon: FolderOpen,
    children: [
      {
        href: "/mapa",
        label: "Mapa",
        icon: LayoutGrid,
        matchSearch: { key: "tab", value: null },
      },
      {
        href: "/mapa?tab=files",
        label: "Pliki",
        icon: FolderTree,
        matchSearch: { key: "tab", value: "files" },
      },
    ],
  },
  { href: "/zadania", label: "Zadania", icon: ListChecks },
  { href: "/qa", label: "Q&A", icon: MessageSquare, showUnread: true },
  { href: "/admin/users", label: "Użytkownicy", icon: Users, adminOnly: true },
  { href: "/admin/drawings", label: "Indeks rysunków", icon: FileSearch, adminOnly: true },
] as const;

function isItemActive(
  item: NavItem,
  pathname: string,
  tab: string | null,
): boolean {
  if (item.children) {
    return item.children.some((c) => isItemActive(c, pathname, tab));
  }
  if (!item.href) return false;
  const itemPath = item.href.split("?")[0]!;
  const pathMatch =
    pathname === itemPath ||
    (itemPath !== "/dashboard" && pathname.startsWith(itemPath));
  if (!pathMatch) return false;
  if (item.matchSearch) {
    return tab === item.matchSearch.value;
  }
  return true;
}

interface NavLinksProps {
  pathname: string;
  tab: string | null;
  onNavigate?: () => void;
  unreadCount: number;
  userRole: string;
}

function NavLinks({
  pathname,
  tab,
  onNavigate,
  unreadCount,
  userRole,
}: NavLinksProps) {
  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {NAV_ITEMS.map((item) => {
        if (item.adminOnly && userRole !== "admin") return null;
        if (item.children) {
          return (
            <NavGroup
              key={item.label}
              item={item}
              pathname={pathname}
              tab={tab}
              onNavigate={onNavigate}
            />
          );
        }
        return (
          <NavLeaf
            key={item.href}
            item={item}
            pathname={pathname}
            tab={tab}
            onNavigate={onNavigate}
            unreadCount={unreadCount}
          />
        );
      })}
    </nav>
  );
}

function NavLeaf({
  item,
  pathname,
  tab,
  onNavigate,
  unreadCount,
  isChild = false,
}: {
  item: NavItem;
  pathname: string;
  tab: string | null;
  onNavigate?: () => void;
  unreadCount: number;
  isChild?: boolean;
}) {
  const isActive = isItemActive(item, pathname, tab);
  const Icon = item.icon;
  const showBadgeCount = item.showUnread && unreadCount > 0;

  return (
    <Link
      href={item.href!}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-sm py-2 text-sm font-medium transition-colors",
        isChild ? "pl-9 pr-3" : "px-3",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span className="flex-1">{item.label}</span>
      {showBadgeCount ? (
        <span
          className={cn(
            "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums",
            isActive
              ? "bg-primary-foreground text-primary"
              : "bg-primary text-primary-foreground",
          )}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : item.badge ? (
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
      ) : null}
    </Link>
  );
}

function NavGroup({
  item,
  pathname,
  tab,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  tab: string | null;
  onNavigate?: () => void;
}) {
  const groupActive = isItemActive(item, pathname, tab);
  const [expanded, setExpanded] = useState(groupActive);
  const Icon = item.icon;

  // Synchronizuj rozwinięcie ze stanem aktywności:
  // wejście do innego modułu → grupa się zwija; powrót do projektu → rozwija
  useEffect(() => {
    setExpanded(groupActive);
  }, [groupActive]);

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors",
          groupActive
            ? "text-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge && (
          <span className="rounded-sm bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground">
            {item.badge}
          </span>
        )}
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-300 ease-out",
            expanded && "rotate-90",
          )}
          strokeWidth={2}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          {item.children && (
            <div className="mt-0.5 flex flex-col gap-0.5">
              {item.children.map((child) => (
                <NavLeaf
                  key={child.href}
                  item={child}
                  pathname={pathname}
                  tab={tab}
                  onNavigate={onNavigate}
                  unreadCount={0}
                  isChild
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
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
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const { data: session } = useSession();
  const trpc = useTRPC();

  const { data: dashData } = useQuery({
    ...trpc.dashboard.stats.queryOptions(),
    enabled: !!session,
    refetchInterval: 60_000, // odświeżaj co minutę
  });

  const unreadCount = dashData?.unreadCount ?? 0;
  const userRole = session?.user?.role ?? "worker";

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <SidebarHeader />
        <div className="flex-1 overflow-y-auto py-3">
          <NavLinks pathname={pathname} tab={tab} unreadCount={unreadCount} userRole={userRole} />
        </div>
        <UserFooter />
      </aside>

      {/* ── Mobile: top bar ─────────────────────────────────────────── */}
      <div className="md:hidden fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="relative rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Otwórz menu"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
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
                tab={tab}
                onNavigate={() => setMobileOpen(false)}
                unreadCount={unreadCount}
                userRole={userRole}
              />
            </div>
            <UserFooter onSignOut={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}
