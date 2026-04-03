import { createServerClient } from "@supabase/ssr";

// These values are defined in .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Adapted Supabase Server Client for Vite/generic environments.
 * Note: In a pure Vite SPA, you usually only need the Browser Client.
 * This helper is provided for server-side logic (e.g. Edge Functions or SSR).
 */
export const createClient = (cookieStore: { 
  getAll: () => any[]; 
  set: (name: string, value: string, options: any) => void;
}) => {
  return createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Handle error in non-writable environments
          }
        },
      },
    },
  );
};
