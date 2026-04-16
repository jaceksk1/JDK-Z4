"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  label: string;
  href: string;
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link
        href="/mapa"
        className="flex h-7 w-7 items-center justify-center rounded-sm hover:bg-accent hover:text-foreground transition-colors"
        aria-label="Mapa — start"
      >
        <Home className="h-4 w-4" strokeWidth={2} />
      </Link>
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            <ChevronRight
              className="h-4 w-4 text-muted-foreground/50"
              strokeWidth={2}
            />
            {isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="rounded-sm px-2 py-1 hover:bg-accent hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
