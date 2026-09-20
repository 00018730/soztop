"use client";

import { createBrowserClient } from "@supabase/ssr";

// The whole app is client components today (game state lives in localStorage,
// no server-rendered page needs a signed-in user), so this is the only
// Supabase client we need — no server/proxy client, no middleware.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
