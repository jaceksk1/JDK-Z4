import { NextRequest, NextResponse } from "next/server";

import { auth } from "~/auth/server";
import { env } from "~/env";
import { listFolder } from "~/lib/synology";

export const dynamic = "force-dynamic";

function getNasBase(): string {
  return (env.SYNOLOGY_BASE_PATH ?? "").replace(/\/$/, "");
}

function isWithinBase(target: string, base: string): boolean {
  const normalized = target.replace(/\\/g, "/").replace(/\/+$/, "");
  if (normalized === base) return true;
  return normalized.startsWith(`${base}/`) && !normalized.includes("/..");
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nasBase = getNasBase();
  if (!nasBase) {
    return NextResponse.json(
      { error: "SYNOLOGY_BASE_PATH not configured" },
      { status: 500 },
    );
  }

  const requested = req.nextUrl.searchParams.get("path") ?? nasBase;
  const target = requested.startsWith("/") ? requested : `${nasBase}/${requested}`;

  if (!isWithinBase(target, nasBase)) {
    return NextResponse.json({ error: "Path outside allowed scope" }, { status: 403 });
  }

  try {
    const entries = await listFolder(target);
    return NextResponse.json({ path: target, entries });
  } catch (e: any) {
    console.error("List error:", e);
    return NextResponse.json(
      { error: e.message ?? "List failed" },
      { status: 500 },
    );
  }
}
