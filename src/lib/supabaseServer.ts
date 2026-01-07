import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { config } from "./config";

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error(
      "Supabase server client misconfigured: missing URL or anon key in env."
    );
  }

  return createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });
};


