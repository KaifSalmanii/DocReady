/**
 * Random, space-free file names for every file DocReady creates.
 *
 * Pattern: <prefix>-<YYYYMMDD>-<HHMMSS>-<random6>.<ext>
 * e.g.     docready-20260912-174503-k7m2qa.jpg
 *
 * Rules enforced here (single source of truth):
 *  - year + month + day + hour + minute + second + random token
 *  - no spaces ever (spaces collapse into "-")
 *  - no characters that are illegal in file systems
 */

/** Ambiguous glyphs (i, l, o, 0, 1) are left out on purpose. */
const RANDOM_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const RANDOM_TOKEN_LENGTH = 6;
const MAX_STEM_LENGTH = 64;
const FALLBACK_STEM = "untitled";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function randomToken(length: number = RANDOM_TOKEN_LENGTH): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < length; i++) out += RANDOM_ALPHABET[bytes[i] % RANDOM_ALPHABET.length];
  return out;
}

/** 20260912-174503  ->  year+month+day - hour+minute+second */
export function timestampToken(date: Date = new Date()): string {
  return (
    `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}` +
    `-${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`
  );
}

/** Make any user-typed string safe: no spaces, no illegal chars, no leading dots. */
export function sanitizeFileName(raw: string, fallback: string = FALLBACK_STEM): string {
  const cleaned = (raw ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"'<>|]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[.-]+/, "")
    .replace(/[-.]+$/, "")
    .slice(0, MAX_STEM_LENGTH);
  return cleaned.length > 0 ? cleaned : fallback;
}

/** Strip a trailing extension from a name. */
export function stemOf(name: string): string {
  return sanitizeFileName(name.replace(/\.[^./\\]+$/, ""));
}

/** Lowercase extension without the dot ("" when there is none). */
export function extensionOf(name: string): string {
  const match = name.match(/\.([a-z0-9]{1,5})$/i);
  return match ? match[1].toLowerCase() : "";
}

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/bmp": "bmp",
  "image/heic": "heic",
  "image/tiff": "tif",
  "application/pdf": "pdf",
};

export function extensionForMime(mime?: string): string {
  if (!mime) return "";
  return MIME_EXTENSIONS[mime.toLowerCase()] ?? extensionOf(`x.${mime.split("/")[1] ?? ""}`);
}

/** Resolve an extension from an explicit value or a MIME type ("pdf", ".pdf", "application/pdf"). */
export function defaultExtension(mime: string | undefined, ext: string | undefined, fallback = "jpg"): string {
  const raw = (ext ?? "").toLowerCase();
  // A MIME type may be passed in place of an extension ("image/png").
  if (raw.includes("/")) return extensionForMime(raw) || extensionForMime(mime) || fallback;
  const cleaned = raw.replace(/^\./, "");
  const safe = /^[a-z0-9]{1,5}$/.test(cleaned) ? cleaned : "";
  return safe || extensionForMime(mime) || fallback;
}

/** "docready-20260912-174503-k7m2qa" — safe to use as a file stem. */
export function randomFileStem(prefix: string = "docready"): string {
  return sanitizeFileName(`${prefix}-${timestampToken()}-${randomToken()}`, FALLBACK_STEM);
}

/** Full random file name including extension. */
export function randomFileName(ext: string = "jpg", prefix: string = "docready"): string {
  return `${randomFileStem(prefix)}.${defaultExtension(undefined, ext, "jpg")}`;
}

/** Join a (possibly user-typed) stem with an extension — always space-free. */
export function buildFileName(stem: string, ext: string = "jpg"): string {
  return `${sanitizeFileName(stem)}.${defaultExtension(undefined, ext, "jpg")}`;
}

/**
 * Prefix used for auto names so they stay recognizable per tool,
 * e.g. "Passport Photo" -> "docready-passport-photo" (idempotent).
 */
export function slugPrefix(label: string, fallback = "docready"): string {
  const slug = (label ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/g, "");
  if (slug.length === 0) return fallback;
  return slug.startsWith("docready-") || slug === "docready" ? slug : `docready-${slug}`;
}

/** A fresh random name for a given tool + extension: "docready-20260912-174503-k7m2qa.jpg" */
export function autoFileName(prefix: string, ext: string = "jpg"): string {
  return buildFileName(randomFileStem(slugPrefix(prefix)), ext);
}

/**
 * Random name for a file the app produces, keeping the source extension
 * (jpg/png/pdf…) — never any spaces.
 */
export function randomNameLike(
  source: { type?: string; name?: string },
  prefix: string,
  fallbackExt: string = "jpg"
): string {
  const fromName = source.name ? extensionOf(source.name) : "";
  const ext = fromName || defaultExtension(source.type, undefined, fallbackExt);
  return autoFileName(prefix, ext);
}



