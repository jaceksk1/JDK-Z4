/**
 * Synology FileStation API client (server-only).
 * DSM 7 compatible: uses SynoToken + Cookie auth for uploads.
 */
import { env } from "~/env";

const getConfig = () => ({
  url: env.SYNOLOGY_URL!,
  user: env.SYNOLOGY_USER!,
  pass: env.SYNOLOGY_PASS!,
  basePath: env.SYNOLOGY_BASE_PATH!,
});

let cachedSid: string | null = null;
let cachedToken: string | null = null;
let sidExpiry = 0;

/** Login with SynoToken (DSM 7 requirement for write operations) */
async function getAuth(): Promise<{ sid: string; token: string }> {
  if (cachedSid && cachedToken && Date.now() < sidExpiry) {
    return { sid: cachedSid, token: cachedToken };
  }

  const cfg = getConfig();
  const url = `${cfg.url}/webapi/entry.cgi?api=SYNO.API.Auth&version=7&method=login&account=${encodeURIComponent(cfg.user)}&passwd=${encodeURIComponent(cfg.pass)}&format=sid&enable_syno_token=yes`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.success) {
    throw new Error(`Synology auth failed: ${JSON.stringify(data.error)}`);
  }

  cachedSid = data.data.sid;
  cachedToken = data.data.synotoken;
  sidExpiry = Date.now() + 14 * 60 * 1000;
  return { sid: cachedSid!, token: cachedToken! };
}

/** Create a single folder (parent must exist). Idempotentne — code 1100/error 408 = już istnieje. */
async function createOneFolder(parentPath: string, name: string): Promise<void> {
  const { sid, token } = await getAuth();
  const cfg = getConfig();

  const url = `${cfg.url}/webapi/entry.cgi?api=SYNO.FileStation.CreateFolder&version=2&method=create&folder_path=${encodeURIComponent(parentPath)}&name=${encodeURIComponent(name)}&_sid=${sid}`;

  const res = await fetch(url, {
    headers: { "X-SYNO-TOKEN": token },
  });
  const data = await res.json();

  if (data.success) return;

  // Wyciągamy szczegółowy kod (FileStation pakuje go w errors[0].code)
  const detailCode: number | undefined = data.error?.errors?.[0]?.code;

  // Akceptujemy: 109 (top-level "already exists"), 1100 + sub-error 408 (już istnieje
  // przy CreateFolder), 1100 + 414 (file already exists)
  const alreadyExists =
    data.error?.code === 109 ||
    (data.error?.code === 1100 && (detailCode === 408 || detailCode === 414));

  if (alreadyExists) return;

  throw new Error(
    `Synology createFolder failed for ${parentPath}/${name}: code=${data.error?.code} detail=${detailCode ?? "n/a"}`,
  );
}

/** Ensure full subfolder path exists. Tolerantne na trailing/leading slashe w basePath i subPath. */
export async function ensureFolder(subPath: string): Promise<string> {
  const cfg = getConfig();
  const parts = subPath.split("/").filter(Boolean);
  // Zdejmij trailing slash z basePath żeby nie produkować "//"
  let current = cfg.basePath.replace(/\/+$/, "");

  for (const part of parts) {
    await createOneFolder(current, part);
    current = `${current}/${part}`;
  }

  return current;
}

/**
 * Upload a file to Synology NAS.
 *
 * DSM 7 quirk: _sid must NOT be in multipart form body.
 * Use Cookie auth + API params in URL + only path/overwrite/file in form body.
 */
export async function uploadFile(
  folderPath: string,
  fileName: string,
  fileBuffer: Buffer,
  contentType: string,
): Promise<{ path: string }> {
  const { sid, token } = await getAuth();
  const cfg = getConfig();

  const fullFolderPath = await ensureFolder(folderPath);

  // API params go in URL, NOT in form body (DSM 7 requirement)
  const params = new URLSearchParams({
    api: "SYNO.FileStation.Upload",
    version: "2",
    method: "upload",
    _sid: sid,
  });

  // Only path, overwrite, and file in form body — file MUST be last
  const formData = new FormData();
  formData.append("path", fullFolderPath);
  formData.append("overwrite", "true");
  formData.append(
    "file",
    new Blob([fileBuffer], { type: contentType }),
    fileName,
  );

  const res = await fetch(`${cfg.url}/webapi/entry.cgi?${params}`, {
    method: "POST",
    headers: { "X-SYNO-TOKEN": token },
    body: formData,
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(
      `Synology upload failed: code ${data.error?.code ?? "unknown"} for path ${fullFolderPath}/${fileName}`,
    );
  }

  return { path: `${fullFolderPath}/${fileName}` };
}

export interface NasEntry {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  mtime: number;
}

/**
 * List contents of a folder on NAS.
 * Returns folders first (alphabetical), then files (alphabetical).
 * Path must be absolute (e.g. `/JDK/JDK-Z4/...`).
 */
export async function listFolder(folderPath: string): Promise<NasEntry[]> {
  const { sid, token } = await getAuth();
  const cfg = getConfig();

  const params = new URLSearchParams({
    api: "SYNO.FileStation.List",
    version: "2",
    method: "list",
    folder_path: folderPath,
    additional: '["size","time"]',
    sort_by: "name",
    sort_direction: "asc",
    _sid: sid,
  });

  const res = await fetch(`${cfg.url}/webapi/entry.cgi?${params}`, {
    headers: { "X-SYNO-TOKEN": token },
  });
  const data = await res.json();

  if (!data.success) {
    throw new Error(
      `Synology list failed: code ${data.error?.code ?? "unknown"} for path ${folderPath}`,
    );
  }

  const files: { name: string; path: string; isdir: boolean; additional?: { size?: number; time?: { mtime?: number } } }[] = data.data?.files ?? [];

  const entries: NasEntry[] = files.map((f) => ({
    name: f.name,
    path: f.path,
    isDir: f.isdir,
    size: f.additional?.size ?? 0,
    mtime: (f.additional?.time?.mtime ?? 0) * 1000,
  }));

  entries.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name, "pl", { numeric: true });
  });

  return entries;
}

/** Download file from NAS — returns Response with binary data */
export async function downloadFile(filePath: string): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  const { sid, token } = await getAuth();
  const cfg = getConfig();

  const url = `${cfg.url}/webapi/entry.cgi?api=SYNO.FileStation.Download&version=2&method=download&path=${encodeURIComponent(filePath)}&mode=open&_sid=${sid}`;

  const res = await fetch(url, {
    headers: { "X-SYNO-TOKEN": token },
  });

  if (!res.ok) return null;

  const contentType = res.headers.get("content-type") ?? "application/octet-stream";

  // If Synology returns JSON error instead of file
  if (contentType.includes("application/json")) {
    return null;
  }

  const body = await res.arrayBuffer();
  return { body, contentType };
}
