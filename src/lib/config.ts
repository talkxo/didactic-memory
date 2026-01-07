export const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  openRouterModel: process.env.OPENROUTER_MODEL ?? "moonshotai/kimi-k2:free",
  defaultCountryCode: process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE ?? "+91",
};

if (!config.supabaseUrl || !config.supabaseAnonKey) {
  // In dev, it's helpful to fail fast if env is missing
  console.warn(
    "[config] Missing Supabase URL or anon key. Check your environment variables."
  );
}


