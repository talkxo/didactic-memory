"use client";

import { useState } from "react";
import Papa from "papaparse";

type ParsedContact = {
  full_name: string;
  org?: string | null;
  phone: string;
  email?: string | null;
  notes?: string | null;
  tags?: string[] | null;
};

export default function UploadPage() {
  const [rows, setRows] = useState<ParsedContact[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage(null);
    setError(null);
    setRows([]);
    setFileName(file.name);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsed: ParsedContact[] = [];
        for (const row of result.data) {
          const name =
            row.full_name ||
            row.name ||
            row["Name"] ||
            row["Full Name"] ||
            "";
          const phone =
            row.phone ||
            row["Phone"] ||
            row["phone_number"] ||
            row["Phone Number"] ||
            "";

          if (!name || !phone) continue;

          const org =
            row.org || row.organization || row.company || row["Org"] || "";
          const email =
            row.email || row["Email"] || row["email_address"] || "";
          const notes = row.notes || row["Notes"] || "";
          const tagsRaw = row.tags || row["Tags"] || "";
          const tags =
            tagsRaw && typeof tagsRaw === "string"
              ? tagsRaw
                  .split(/[;,]/)
                  .map((t) => t.trim())
                  .filter(Boolean)
              : [];

          parsed.push({
            full_name: name,
            org: org || null,
            phone: phone.trim(),
            email: email || null,
            notes: notes || null,
            tags: tags.length ? tags : null,
          });
        }

        setRows(parsed);
        if (!parsed.length) {
          setError("No valid rows found. Ensure at least name and phone exist.");
        }
      },
      error: (err) => {
        console.error(err);
        setError("Failed to parse CSV. Please check the file and try again.");
      },
    });
  };

  const handleImport = async () => {
    if (!rows.length) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/contacts/bulk-insert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contacts: rows }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to import contacts.");
      }

      const data = await res.json();
      setMessage(
        `Imported ${data.insertedCount} contacts. Skipped ${data.skippedCount} rows.`
      );
    } catch (err) {
      console.error(err);
      setError("Failed to import contacts.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 pb-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="font-heading text-lg font-semibold">Upload contacts</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Upload a CSV with columns like{" "}
          <span className="font-medium">
            name, org, phone, email, notes, tags
          </span>
          . We&apos;ll auto-detect the fields.
        </p>

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-600">
          <span className="font-medium text-zinc-900">
            Tap to choose a CSV file
          </span>
          <span className="text-xs text-zinc-500">
            {fileName || "Max ~5k rows recommended"}
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {rows.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium text-zinc-900">
              Preview ({rows.length} rows)
            </span>
            <button
              type="button"
              onClick={handleImport}
              disabled={loading}
              className="inline-flex items-center rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            >
              {loading ? "Importing..." : "Import contacts"}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {rows.slice(0, 10).map((row, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-900">
                    {row.full_name}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {row.org || "No org"}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-zinc-600">
                  <span>{row.phone}</span>
                  {row.email && <span>• {row.email}</span>}
                  {row.tags && row.tags.length > 0 && (
                    <span className="rounded-full bg-zinc-200 px-2 py-0.5">
                      {row.tags.join(", ")}
                    </span>
                  )}
                </div>
                {row.notes && (
                  <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500">
                    {row.notes}
                  </p>
                )}
              </div>
            ))}
          </div>

          {rows.length > 10 && (
            <p className="mt-2 text-xs text-zinc-500">
              Showing first 10 rows of {rows.length} total.
            </p>
          )}
        </div>
      )}

      {message && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}


