import { createClient, type SupabaseClient } from "@supabase/supabase-js";

declare global {
  var __tecSupabase: SupabaseClient | undefined;
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase credentials are not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
    this.name = "SupabaseNotConfiguredError";
  }
}

/**
 * Server-only client, authenticated with the service role key so it
 * bypasses Row Level Security entirely. Every table's RLS policy locks it
 * to the service role (see supabase/migrations/0001_init.sql) — this
 * client must never be imported from a "use client" component or any code
 * that ships to the browser. All app data access goes through Next.js
 * server code (route handlers, server components), which is the only
 * place this is imported.
 */
export function getSupabase(): SupabaseClient {
  if (!globalThis.__tecSupabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new SupabaseNotConfiguredError();
    }
    globalThis.__tecSupabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return globalThis.__tecSupabase;
}

/** Throws a descriptive error immediately if a Postgres/PostgREST call fails, instead of returning `{data: null}` silently. */
export function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) {
    throw new Error(`Supabase error: ${result.error.message}`);
  }
  if (result.data === null) {
    throw new Error("Supabase returned no data for a query expected to return a row");
  }
  return result.data;
}
