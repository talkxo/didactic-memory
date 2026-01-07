"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(errorParam);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: username,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.replace("/calling");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-semibold">
            Sign in to Handshake
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Use your username and password to access your calling list.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-zinc-800"
            >
              Username (email)
            </label>
            <input
              id="username"
              name="username"
              type="email"
              required
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 focus:bg-white"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-800"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-400 focus:bg-white"
            />
          </div>

          {(error || errorParam) && (
            <p className="text-sm text-red-600">
              {error || errorParam || "Authentication error"}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            className="font-medium text-zinc-900 underline-offset-2 hover:underline"
            onClick={() => router.push("/register")}
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}


