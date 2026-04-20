"use client";

import type { UnitStatus } from "@acme/validators";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Construction, FileImage, LayoutGrid } from "lucide-react";

import { cn } from "@acme/ui";

import { Breadcrumbs } from "~/components/mapa/breadcrumbs";
import type { OverviewStats } from "~/components/mapa/overview-tile";
import { OverviewTile } from "~/components/mapa/overview-tile";
import { StatusFilter } from "~/components/mapa/status-filter";
import { UnitCard } from "~/components/mapa/unit-card";
import { UnitDetailSheet } from "~/components/mapa/unit-detail-sheet";
import { useTRPC } from "~/trpc/react";

type Level = "root" | "building" | "section" | "floor" | "garage";

export default function MapaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const building = searchParams.get("building");
  const section = searchParams.get("section");
  const floorId = searchParams.get("floorId");
  const floorLabel = searchParams.get("floorLabel");
  const unitId = searchParams.get("unit");
  const statusFilter = searchParams.get("status") as UnitStatus | null;
  const viewMode = searchParams.get("view") ?? "list"; // list | plan

  const level: Level =
    building === "garage"
      ? "garage"
      : floorId
        ? "floor"
        : section
          ? "section"
          : building
            ? "building"
            : "root";

  // Breadcrumbs
  const crumbs = useMemo(() => {
    const c: { label: string; href: string }[] = [];
    if (building === "garage") {
      c.push({ label: "Garaż", href: "/mapa?building=garage" });
    } else if (building) {
      c.push({ label: `Budynek ${building}`, href: `/mapa?building=${building}` });
      if (section) {
        c.push({
          label: `Klatka ${section}`,
          href: `/mapa?building=${building}&section=${section}`,
        });
        if (floorId && floorLabel) {
          c.push({
            label: floorLabel,
            href: `/mapa?building=${building}&section=${section}&floorId=${floorId}&floorLabel=${encodeURIComponent(floorLabel)}`,
          });
        }
      }
    }
    return c;
  }, [building, section, floorId, floorLabel]);

  const setStatusFilter = (status: UnitStatus | null) => {
    const params = new URLSearchParams(searchParams);
    if (status) params.set("status", status);
    else params.delete("status");
    router.push(`/mapa?${params.toString()}`);
  };

  const openUnit = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("unit", id);
    router.push(`/mapa?${params.toString()}`);
  };

  const closeUnit = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("unit");
    router.push(`/mapa?${params.toString()}`);
  };

  const setViewMode = (mode: "list" | "plan") => {
    const params = new URLSearchParams(searchParams);
    params.set("view", mode);
    router.push(`/mapa?${params.toString()}`);
  };

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
            M01
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Mapa Budynku</h1>
        </div>
      </div>

      {/* Breadcrumbs */}
      {crumbs.length > 0 && (
        <div className="mb-5">
          <Breadcrumbs crumbs={crumbs} />
        </div>
      )}

      {/* Content per level */}
      {level === "root" && <RootLevel />}
      {level === "building" && building !== "garage" && (
        <BuildingLevel building={building!} />
      )}
      {level === "section" && (
        <SectionLevel building={building!} section={section!} />
      )}
      {level === "floor" && (
        <FloorLevel
          building={building!}
          section={section!}
          floorId={floorId!}
          floorLabel={floorLabel ?? ""}
          viewMode={viewMode as "list" | "plan"}
          onViewModeChange={setViewMode}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onUnitClick={openUnit}
          activeUnitId={unitId}
        />
      )}
      {level === "garage" && (
        <GarageLevel
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onUnitClick={openUnit}
          activeUnitId={unitId}
        />
      )}

      {/* Detail sheet */}
      <UnitDetailSheet unitId={unitId} onClose={closeUnit} />
    </div>
  );
}

// ─── Level: Root ────────────────────────────────────────────────────────────

function RootLevel() {
  const trpc = useTRPC();
  const { data: buildings, isLoading } = useQuery(
    trpc.unit.stats.queryOptions({ projectCode: "Z4", level: "building" }),
  );

  if (isLoading) return <TileGridSkeleton count={3} />;

  // Rozdziel: budynki A, B osobno, garaż jako wirtualny trzeci
  const realBuildings = buildings?.filter((b) => b.name !== "Garaż") ?? [];
  const garage = buildings?.find((b) => b.name === "Garaż");

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {realBuildings.map((b) => (
        <OverviewTile
          key={b.name}
          label={`Budynek ${b.name}`}
          stats={b}
          href={`/mapa?building=${b.name}`}
        />
      ))}
      {garage && (
        <OverviewTile
          label="Garaż G01"
          stats={garage}
          href="/mapa?building=garage"
        />
      )}
    </div>
  );
}

// ─── Level: Building (A | B) ────────────────────────────────────────────────

function BuildingLevel({ building }: { building: string }) {
  const trpc = useTRPC();
  const { data: sections, isLoading } = useQuery(
    trpc.unit.stats.queryOptions({
      projectCode: "Z4",
      level: "section",
      buildingName: building,
    }),
  );

  if (isLoading) return <TileGridSkeleton count={2} />;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sections?.map((s) => (
        <OverviewTile
          key={s.name}
          label={`Klatka ${s.name}`}
          stats={s}
          href={`/mapa?building=${building}&section=${s.name}`}
        />
      ))}
    </div>
  );
}

// ─── Level: Section (A1, A2, B1, B2) ────────────────────────────────────────

function SectionLevel({
  building,
  section,
}: {
  building: string;
  section: string;
}) {
  const trpc = useTRPC();
  const { data: floorStats, isLoading } = useQuery(
    trpc.unit.stats.queryOptions({
      projectCode: "Z4",
      level: "floor",
      buildingName: building,
      sectionName: section,
    }),
  );

  if (isLoading) return <TileGridSkeleton count={8} />;

  // Stats already sorted by sortOrder from backend (reversed for top-down display)
  const sortedFloors = floorStats?.slice().reverse() ?? [];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {sortedFloors.map((f) => (
        <OverviewTile
          key={f.id ?? f.name}
          label={f.name}
          stats={f}
          href={`/mapa?building=${building}&section=${section}&floorId=${f.id}&floorLabel=${encodeURIComponent(f.name)}`}
        />
      ))}
    </div>
  );
}

// ─── Level: Floor (lista jednostek + zakładki) ──────────────────────────────

interface FloorLevelProps {
  building: string;
  section: string;
  floorId: string;
  floorLabel: string;
  viewMode: "list" | "plan";
  onViewModeChange: (mode: "list" | "plan") => void;
  statusFilter: UnitStatus | null;
  onStatusFilterChange: (status: UnitStatus | null) => void;
  onUnitClick: (id: string) => void;
  activeUnitId: string | null;
}

function FloorLevel({
  building,
  section,
  floorId,
  floorLabel,
  viewMode,
  onViewModeChange,
  statusFilter,
  onStatusFilterChange,
  onUnitClick,
  activeUnitId,
}: FloorLevelProps) {
  const trpc = useTRPC();
  const { data: units, isLoading } = useQuery(
    trpc.unit.list.queryOptions({
      projectCode: "Z4",
      buildingName: building,
      sectionName: section,
      floorId,
    }),
  );

  const filtered =
    statusFilter && units
      ? units.filter((u) => u.status === statusFilter)
      : units;

  const counts = useMemo(() => {
    const c: Partial<Record<UnitStatus, number>> = {};
    for (const u of units ?? []) {
      c[u.status] = (c[u.status] ?? 0) + 1;
    }
    return c;
  }, [units]);

  // Rozdziel mieszkania i LU dla parteru
  const apartments = filtered?.filter((u) => u.type === "apartment") ?? [];
  const commercial = filtered?.filter((u) => u.type === "commercial") ?? [];

  return (
    <div className="space-y-5">
      {/* Tabs Lista / Plan */}
      <div className="flex items-center gap-1 rounded-sm border bg-muted/30 p-1 w-fit">
        <TabButton
          active={viewMode === "list"}
          onClick={() => onViewModeChange("list")}
          icon={<LayoutGrid className="h-3.5 w-3.5" strokeWidth={2} />}
        >
          Lista
        </TabButton>
        <TabButton
          active={viewMode === "plan"}
          onClick={() => onViewModeChange("plan")}
          icon={<FileImage className="h-3.5 w-3.5" strokeWidth={2} />}
        >
          Plan
        </TabButton>
      </div>

      {viewMode === "list" ? (
        <>
          <StatusFilter
            selected={statusFilter}
            onChange={onStatusFilterChange}
            counts={counts}
          />

          {isLoading ? (
            <UnitGridSkeleton />
          ) : !filtered?.length ? (
            <EmptyState label="Brak jednostek z tym statusem" />
          ) : (
            <>
              <UnitSection
                title="Mieszkania"
                units={apartments}
                activeUnitId={activeUnitId}
                onUnitClick={onUnitClick}
              />
              {commercial.length > 0 && (
                <UnitSection
                  title="Lokale usługowe"
                  units={commercial}
                  activeUnitId={activeUnitId}
                  onUnitClick={onUnitClick}
                />
              )}
            </>
          )}
        </>
      ) : (
        <PlanPlaceholder floor={floorLabel} section={section} />
      )}
    </div>
  );
}

function UnitSection({
  title,
  units,
  activeUnitId,
  onUnitClick,
}: {
  title: string;
  units: {
    id: string;
    designator: string;
    displayDesignator: string;
    type: "apartment" | "commercial" | "parking" | "storage";
    status: UnitStatus;
  }[];
  activeUnitId: string | null;
  onUnitClick: (id: string) => void;
}) {
  if (units.length === 0) return null;
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title} · <span className="font-mono">{units.length}</span>
      </h3>
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {units.map((u) => (
          <UnitCard
            key={u.id}
            designator={u.displayDesignator}
            type={u.type}
            status={u.status}
            onClick={() => onUnitClick(u.id)}
            isActive={activeUnitId === u.id}
          />
        ))}
      </div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function PlanPlaceholder({
  floor,
  section,
}: {
  floor: string;
  section: string;
}) {
  return (
    <div className="rounded-lg border border-dashed bg-card p-12 text-center shadow-sm">
      <FileImage
        className="mx-auto mb-3 h-10 w-10 text-muted-foreground"
        strokeWidth={1.5}
      />
      <p className="font-medium">Rzut kondygnacji {floor} · Klatka {section}</p>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
        W tym miejscu pojawi się plan architektoniczny piętra z klikalnymi jednostkami.
        Upload rzutów dla każdej kondygnacji będzie w panelu admina.
      </p>
    </div>
  );
}

// ─── Level: Garage ──────────────────────────────────────────────────────────

interface GarageLevelProps {
  statusFilter: UnitStatus | null;
  onStatusFilterChange: (status: UnitStatus | null) => void;
  onUnitClick: (id: string) => void;
  activeUnitId: string | null;
}

function GarageLevel({
  statusFilter,
  onStatusFilterChange,
  onUnitClick,
  activeUnitId,
}: GarageLevelProps) {
  const trpc = useTRPC();
  const { data: units, isLoading } = useQuery(
    trpc.unit.list.queryOptions({
      projectCode: "Z4",
      includeGarage: true,
    }),
  );

  const filtered =
    statusFilter && units
      ? units.filter((u) => u.status === statusFilter)
      : units;

  const counts = useMemo(() => {
    const c: Partial<Record<UnitStatus, number>> = {};
    for (const u of units ?? []) {
      c[u.status] = (c[u.status] ?? 0) + 1;
    }
    return c;
  }, [units]);

  const parkings = filtered?.filter((u) => u.type === "parking") ?? [];
  const storages = filtered?.filter((u) => u.type === "storage") ?? [];

  return (
    <div className="space-y-5">
      <StatusFilter
        selected={statusFilter}
        onChange={onStatusFilterChange}
        counts={counts}
      />

      {isLoading ? (
        <UnitGridSkeleton />
      ) : !filtered?.length ? (
        <EmptyState label="Brak jednostek" />
      ) : (
        <>
          <UnitSection
            title="Miejsca postojowe (MP)"
            units={parkings}
            activeUnitId={activeUnitId}
            onUnitClick={onUnitClick}
          />
          <UnitSection
            title="Komórki lokatorskie (KL)"
            units={storages}
            activeUnitId={activeUnitId}
            onUnitClick={onUnitClick}
          />
        </>
      )}
    </div>
  );
}

// ─── Skeletons & empty ──────────────────────────────────────────────────────

function TileGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}

function UnitGridSkeleton() {
  return (
    <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-sm bg-muted" />
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-card p-10 text-center shadow-sm">
      <Construction
        className="mx-auto mb-2 h-8 w-8 text-muted-foreground"
        strokeWidth={1.5}
      />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
