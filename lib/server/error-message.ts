/** Supabase Postgrest errors are plain objects with `message`, not always `instanceof Error`. */
export function messageFromUnknown(error: unknown): string {
  if (error instanceof Error) {
    return error.message || String(error);
  }
  if (error && typeof error === "object") {
    const o = error as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.length > 0) {
      const parts = [o.message];
      if (typeof o.details === "string" && o.details) parts.push(o.details);
      if (typeof o.hint === "string" && o.hint) parts.push(o.hint);
      return parts.join(" — ");
    }
  }
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}
