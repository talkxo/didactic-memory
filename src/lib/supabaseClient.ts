import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { config } from "./config";

export const createSupabaseBrowserClient = () => {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error(
      "Supabase client misconfigured: missing URL or anon key in env."
    );
  }

  return createBrowserClient(config.supabaseUrl, config.supabaseAnonKey);
};


