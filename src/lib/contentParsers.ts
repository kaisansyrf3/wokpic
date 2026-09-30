import type { SocialLink } from "@/types/database";

/** jsonb columns are untrusted at the type level, so every read normalizes them. */

export function parseFeatures(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
}

export function parseSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const candidate = entry as Record<string, unknown>;
    if (typeof candidate.platform !== "string" || typeof candidate.url !== "string") {
      return [];
    }
    return [{ platform: candidate.platform, url: candidate.url }];
  });
}
