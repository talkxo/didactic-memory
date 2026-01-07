"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { ContactCard } from "@/components/ContactCard";

type ContactRow = {
  id: string;
  full_name: string;
  org: string | null;
  phone: string;
  email: string | null;
  last_engaged_at: string | null;
  last_engaged_by_profile: {
    username: string | null;
  } | null;
};

type InteractionNote = {
  contact_id: string;
  note: string;
};

export default function CallingPage() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "never">("all");
  const [noteDraft, setNoteDraft] = useState<InteractionNote | null>(null);
  const [noteSaving, setNoteSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiScript, setAiScript] = useState<{
    call_script: string;
    whatsapp_message: string;
  } | null>(null);

  useEffect(() => {
    const loadContacts = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error: queryError } = await supabase
          .from("contacts")
          .select(
            `
            id,
            full_name,
            org,
            phone,
            email,
            last_engaged_at,
            last_engaged_by_profile:profiles!contacts_last_engaged_by_fkey (
              username
            )
          `
          )
          .order("last_engaged_at", { ascending: true, nullsFirst: true })
          .order("created_at", { ascending: true });

        if (queryError) {
          throw queryError;
        }

        setContacts((data as ContactRow[]) || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load contacts.");
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, []);

  const filteredContacts =
    filter === "never"
      ? contacts.filter((c) => !c.last_engaged_at)
      : contacts;

  const handleOpenNote = (contactId: string) => {
    setNoteDraft({ contact_id: contactId, note: "" });
  };

  const handleSaveNote = async () => {
    if (!noteDraft?.note.trim()) return;
    setNoteSaving(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: insertError } = await supabase
        .from("interactions")
        .insert({
          contact_id: noteDraft.contact_id,
          type: "note",
          note: noteDraft.note.trim(),
        });

      if (insertError) {
        throw insertError;
      }

      // Refresh contacts to update last_engaged fields via backend logic
      const { data, error: queryError } = await supabase
        .from("contacts")
        .select(
          `
          id,
          full_name,
          org,
          phone,
          email,
          last_engaged_at,
          last_engaged_by_profile:profiles!contacts_last_engaged_by_fkey (
            username
          )
        `
        )
        .order("last_engaged_at", { ascending: true, nullsFirst: true })
        .order("created_at", { ascending: true });

      if (queryError) throw queryError;

      setContacts((data as ContactRow[]) || []);
      setNoteDraft(null);
    } catch (err) {
      console.error(err);
      setError("Failed to save note.");
    } finally {
      setNoteSaving(false);
    }
  };

  const total = contacts.length;
  const contacted = contacts.filter((c) => c.last_engaged_at).length;

  const contactsForAI = useMemo(
    () =>
      contacts.map((c) => ({
        id: c.id,
        full_name: c.full_name,
        last_engaged_at: c.last_engaged_at,
        interactions_count: c.last_engaged_at ? 1 : 0,
        tags: null,
      })),
    [contacts]
  );

  const handleAIScript = async (contact: ContactRow) => {
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "script",
          contact: {
            full_name: contact.full_name,
            org: contact.org,
            phone: contact.phone,
            email: contact.email,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("AI script request failed");
      }

      const data = await res.json();
      setAiScript({
        call_script: data.call_script ?? "",
        whatsapp_message: data.whatsapp_message ?? "",
      });
    } catch (err) {
      console.error(err);
      setError("Failed to generate AI script.");
    }
  };

  const handleAIPrioritize = async () => {
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "prioritize",
          contacts: contactsForAI,
        }),
      });

      if (!res.ok) {
        throw new Error("AI prioritize request failed");
      }

      const data = await res.json();
      const orderedIds: string[] = data.ordered_ids ?? [];
      if (!orderedIds.length) return;

      const byId = new Map(contacts.map((c) => [c.id, c]));
      const reordered: ContactRow[] = [];
      for (const id of orderedIds) {
        const row = byId.get(id);
        if (row) reordered.push(row);
      }
      // append any missing (defensive)
      for (const c of contacts) {
        if (!orderedIds.includes(c.id)) {
          reordered.push(c);
        }
      }
      setContacts(reordered);
    } catch (err) {
      console.error(err);
      setError("Failed to prioritize contacts.");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-3 pb-4">
      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-zinc-900">
              Calling mode
            </p>
            <p className="text-[11px] text-zinc-500">
              {contacted} contacted • {total} total
            </p>
          </div>
          <div className="inline-flex rounded-full bg-zinc-100 p-1 text-[11px]">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-full px-2 py-1 ${
                filter === "all"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("never")}
              className={`rounded-full px-2 py-1 ${
                filter === "never"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600"
              }`}
            >
              Never
            </button>
          </div>
        </div>
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleAIPrioritize}
            className="rounded-full bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-white"
          >
            AI prioritize order
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-20 animate-pulse rounded-2xl bg-zinc-200/70"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && filteredContacts.length === 0 && (
        <p className="rounded-xl bg-zinc-100 px-3 py-2 text-xs text-zinc-700">
          No contacts yet. Upload a CSV to get started.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {filteredContacts.map((c) => (
          <ContactCard
            key={c.id}
            id={c.id}
            fullName={c.full_name}
            org={c.org}
            phone={c.phone}
            email={c.email}
            lastEngagedAt={c.last_engaged_at}
            lastEngagedBy={c.last_engaged_by_profile?.username ?? null}
            onAddNote={() => handleOpenNote(c.id)}
            onAISuggest={() => handleAIScript(c)}
          />
        ))}
      </div>

      {noteDraft && (
        <div className="fixed inset-x-0 bottom-16 z-20 mx-auto max-w-md px-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-lg">
            <textarea
              autoFocus
              rows={3}
              className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs outline-none focus:border-zinc-400 focus:bg-white"
              placeholder="Quick note about this call..."
              value={noteDraft.note}
              onChange={(e) =>
                setNoteDraft({ ...noteDraft, note: e.target.value })
              }
            />
            <div className="mt-2 flex items-center justify-end gap-2 text-[11px]">
              <button
                type="button"
                className="text-zinc-500"
                onClick={() => setNoteDraft(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={noteSaving}
                onClick={handleSaveNote}
                className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
              >
                {noteSaving ? "Saving..." : "Save note"}
              </button>
            </div>
          </div>
        </div>
      )}

      {aiScript && (
        <div className="fixed inset-x-0 bottom-16 z-30 mx-auto max-w-md px-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-900">
                AI call + WhatsApp script
              </p>
              <button
                type="button"
                className="text-[11px] text-zinc-500"
                onClick={() => setAiScript(null)}
              >
                Close
              </button>
            </div>
            <div className="space-y-2 text-[11px] text-zinc-700">
              <div>
                <p className="mb-1 font-medium text-zinc-900">Call script</p>
                <p className="whitespace-pre-line rounded-xl bg-zinc-50 px-2 py-1.5">
                  {aiScript.call_script}
                </p>
              </div>
              <div>
                <p className="mb-1 font-medium text-zinc-900">
                  WhatsApp message
                </p>
                <p className="whitespace-pre-line rounded-xl bg-zinc-50 px-2 py-1.5">
                  {aiScript.whatsapp_message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


