import { createServerClient } from "@supabase/ssr";

// These values are defined in .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Adapted Supabase Middleware helper for non-Next.js environments.
 * Note: Vite/SPAs don't have built-in edge middleware.
 * This is provided for reference or if used in serverless/edge environments.
 */
export const updateSession = (request: any, response: any) => {
  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    },
  );

  return supabase
};
