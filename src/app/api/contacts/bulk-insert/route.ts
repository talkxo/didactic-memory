import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type IncomingContact = {
  full_name: string;
  org?: string | null;
  phone: string;
  email?: string | null;
  notes?: string | null;
  tags?: string[] | null;
};

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { contacts?: IncomingContact[] };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const contacts = body.contacts ?? [];

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json(
      { error: "No contacts provided" },
      { status: 400 }
    );
  }

  const cleaned = contacts
    .map((c) => ({
      full_name: c.full_name?.trim(),
      org: c.org?.trim() || null,
      phone: c.phone?.trim(),
      email: c.email?.trim() || null,
      tags: c.tags && c.tags.length ? c.tags : null,
    }))
    .filter((c) => c.full_name && c.phone);

  if (cleaned.length === 0) {
    return NextResponse.json(
      { error: "No valid contacts after validation" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert(cleaned)
    .select("id");

  if (error) {
    console.error("[bulk-insert] error", error);
    return NextResponse.json(
      { error: "Failed to insert contacts" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    insertedCount: data?.length ?? 0,
    skippedCount: contacts.length - (data?.length ?? 0),
  });
}


