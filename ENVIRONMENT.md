## Environment variables for Handshake CRM

Set these in your local `.env.local` and in Vercel project settings.

### Copy-paste format for Vercel

Copy the following into Vercel (Project → Settings → Environment Variables). Fill in the values from your Supabase and OpenRouter dashboards.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=moonshotai/kimi-k2:free
NEXT_PUBLIC_DEFAULT_COUNTRY_CODE=+91
APP_USERNAME=
APP_PASSWORD=
```

### Detailed variable descriptions

#### Supabase

- **`NEXT_PUBLIC_SUPABASE_URL`** (Required)
  - **Where to find**: Supabase Dashboard → Project Settings → API → Project URL
  - **Format**: `https://[project-ref].supabase.co`

- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** (Required)
  - **Where to find**: Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public`
  - **Alternative**: Can use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` as fallback (same location)
  - **Format**: JWT token starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.`

- **`SUPABASE_SERVICE_ROLE_KEY`** (Optional, but recommended)
  - **Where to find**: Supabase Dashboard → Project Settings → API → Project API keys → `service_role` `secret`
  - **⚠️ Security**: Server-side only, **never** exposed to the browser. Currently optional but useful for future admin tasks.
  - **Format**: JWT token starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.`

#### OpenRouter (AI)

- **`OPENROUTER_API_KEY`** (Required)
  - **Where to find**: OpenRouter Dashboard → Keys → Create Key or use existing key
  - **Format**: Starts with `sk-or-v1-`

- **`OPENROUTER_MODEL`** (Optional)
  - **Default**: `moonshotai/kimi-k2:free` (used if not set)
  - **Other options**: `anthropic/claude-3.5-sonnet`, `openai/gpt-4`, etc.

#### App defaults

- **`NEXT_PUBLIC_DEFAULT_COUNTRY_CODE`** (Optional)
  - **Default**: `+91` (used if not set)
  - **Options**: `+91` (India), `+1` (USA), `+44` (UK), etc.

#### Simple username/password auth

This app does **not** use Supabase Auth. Instead it uses a single username/password pair configured via env and a cookie-based session.

- **`APP_USERNAME`** (Required)
  - Username required on the login screen

- **`APP_PASSWORD`** (Required)
  - Password required on the login screen
  - **⚠️ Security**: Use a strong password. Anyone who knows this pair can access the app; there is no per-user registration in the UI.

### Notes for Vercel

1. **Adding variables**: Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. **Environment scope**: Set the **Environment** correctly (Production, Preview, Development) for each variable
3. **After changes**: Re-deploy your project after adding or changing any environment variable
4. **Supabase URL configuration**: If using Supabase Auth features, add your Vercel domain URLs to Supabase → Authentication → URL Configuration (`SITE_URL`, redirect URLs) so that login/redirects work in production

