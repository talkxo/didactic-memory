import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const email = user.email ?? "";
  const username = email.split("@")[0] || email;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <span className="font-heading text-lg font-semibold tracking-tight">
              Handshake
            </span>
            <p className="text-xs text-zinc-500">Serial calling CRM</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-medium text-white">
              {username.slice(0, 2).toUpperCase()}
            </span>
            <span className="hidden sm:inline">{username}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-3 pb-16 pt-3">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white/95 px-6 py-2.5 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between text-xs font-medium">
          <Link
            href="/calling"
            className="flex flex-1 flex-col items-center gap-0.5 text-zinc-900"
          >
            <span>Calling</span>
          </Link>
          <Link
            href="/upload"
            className="flex flex-1 flex-col items-center gap-0.5 text-zinc-500"
          >
            <span>Upload</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}


