import { NextRequest, NextResponse } from "next/server";

import { auth } from "~/auth/server";
import { env } from "~/env";
import { listFolder } from "~/lib/synology";

const NAS_BASE = env.SYNOLOGY_BASE_PATH!.replace(/\/$/, "");

function isWithinBase(target: string): boolean {
  const normalized = target.replace(/\\/g, "/").replace(/\/+$/, "");
  if (normalized === NAS_BASE) return true;
  return normalized.startsWith(`${NAS_BASE}/`) && !normalized.includes("/..");
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requested = req.nextUrl.searchParams.get("path") ?? NAS_BASE;
  const target = requested.startsWith("/") ? requested : `${NAS_BASE}/${requested}`;

  if (!isWithinBase(target)) {
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
