import { NextRequest, NextResponse } from "next/server";

import { downloadFile, uploadFile } from "~/lib/synology";

import { auth } from "~/auth/server";

/**
 * POST /api/files — upload a file to Synology NAS
 * Body: multipart/form-data with fields: file, folder (subfolder path)
 * Returns: { path, url }
 */
export async function POST(req: NextRequest) {
  // Check auth
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) ?? "inne";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: JPEG, PNG, WebP, PDF" },
      { status: 400 },
    );
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large. Max 10MB" },
      { status: 400 },
    );
  }

  // Generate unique filename
  const ext = file.name.split(".").pop() ?? "bin";
  const timestamp = Date.now();
  const safeName = `${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await uploadFile(folder, safeName, buffer, file.type);
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json(
      { error: e.message ?? "Upload failed" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/files?path=/JDK/... — proxy download from NAS
 * Returns redirect to NAS download URL
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filePath = req.nextUrl.searchParams.get("path");
  if (!filePath) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  try {
    const result = await downloadFile(filePath);
    if (!result) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return new NextResponse(result.body, {
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e: any) {
    console.error("Download error:", e);
    return NextResponse.json(
      { error: e.message ?? "Download failed" },
      { status: 500 },
    );
  }
}
