"use client";

import { useQuery } from "@tanstack/react-query";

import { cn } from "@acme/ui";

import { useTRPC } from "~/trpc/react";

interface GroupMultiSelectProps {
  value: string[];
  onChange: (groupIds: string[]) => void;
  disabled?: boolean;
}

export function GroupMultiSelect({
  value,
  onChange,
  disabled = false,
}: GroupMultiSelectProps) {
  const trpc = useTRPC();
  const groupsQuery = useQuery(trpc.group.list.queryOptions());

  if (groupsQuery.isLoading) {
    return (
      <div className="rounded-sm border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        Ładowanie grup…
      </div>
    );
  }

  if (!groupsQuery.data?.length) {
    return (
      <div className="rounded-sm border border-dashed bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        Brak zdefiniowanych grup —{" "}
        <a href="/admin/groups" className="text-primary underline">
          utwórz pierwszą
        </a>
      </div>
    );
  }

  const toggle = (groupId: string) => {
    if (disabled) return;
    if (value.includes(groupId)) {
      onChange(value.filter((id) => id !== groupId));
    } else {
      onChange([...value, groupId]);
    }
  };

  return (
    <div className="flex flex-col gap-1 rounded-sm border bg-background p-1">
      {groupsQuery.data.map((g) => {
        const selected = value.includes(g.id);
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => toggle(g.id)}
            disabled={disabled}
            className={cn(
              "flex items-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
              selected
                ? "bg-primary/10 text-foreground"
                : "hover:bg-muted text-foreground",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={() => toggle(g.id)}
              disabled={disabled}
              className="mt-0.5"
              tabIndex={-1}
            />
            <div className="min-w-0 flex-1">
              <div className="font-medium">{g.name}</div>
              {g.description && (
                <div className="text-[11px] text-muted-foreground truncate">
                  {g.description}
                </div>
              )}
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground font-mono">
              {g.moduleKeys.length} {g.moduleKeys.length === 1 ? "moduł" : "moduły"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
