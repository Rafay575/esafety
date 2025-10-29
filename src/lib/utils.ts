// src/lib/utils.ts

/**
 * Removes empty string, null, and undefined values
 * from an object recursively and ensures output fits clean API expectations.
 */
export function sanitizePayload<T extends Record<string, any>>(obj: T): any {
  const clean: Record<string, any> = {};

  Object.entries(obj).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) return;

    if (typeof value === "object" && !Array.isArray(value)) {
      const nested = sanitizePayload(value);
      if (Object.keys(nested).length > 0) clean[key] = nested;
    } else {
      clean[key] = value;
    }
  });

  // Explicit cast to satisfy stricter payloads (e.g., string | undefined instead of string | null)
  return clean as unknown as {
    [K in keyof T]: Exclude<T[K], null>;
  };
}
