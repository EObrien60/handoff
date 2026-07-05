import { customAlphabet } from "nanoid";

// Lowercase, url-safe, no ambiguous chars — used for org subdomains.
const suffix = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 6);

/** Turn a display name into a subdomain-safe base slug. */
export function slugifyName(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "workspace";
}

/** A slug with a short random suffix, guaranteeing practical uniqueness. */
export function uniqueSlug(name: string): string {
  return `${slugifyName(name)}-${suffix()}`;
}
