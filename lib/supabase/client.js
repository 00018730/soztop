"use client";

import { createBrowserClient } from "@supabase/ssr";

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

// The whole app is client components today (game state lives in localStorage,
// no server-rendered page needs a signed-in user), so this is the only
// Supabase client we need — no server/proxy client, no middleware.
//
// Returns null instead of throwing when the env vars are missing (e.g. a
// deploy that forgot to set them) — createBrowserClient() itself throws
// synchronously in that case, and since every caller here constructs it
// inside a useState initializer, an uncaught throw there doesn't just break
// one component, it crashes the whole render. Every caller must handle null.
export function createClient() {
  if (!isSupabaseConfigured()) {
    console.error(
      "Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY). " +
        "Set them in .env.local (dev) or your host's project env vars (prod), then redeploy."
    );
    return null;
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
