import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type ScriptRequest = {
  type: "script";
  contact: {
    full_name: string;
    org?: string | null;
    phone: string;
    email?: string | null;
  };
  notes?: string[];
};

type PrioritizeRequest = {
  type: "prioritize";
  contacts: {
    id: string;
    full_name: string;
    last_engaged_at?: string | null;
    interactions_count?: number;
    tags?: string[] | null;
  }[];
};

type RequestBody = ScriptRequest | PrioritizeRequest;

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!config.openRouterApiKey) {
    return NextResponse.json(
      { error: "OpenRouter API key not configured" },
      { status: 500 }
    );
  }

  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const model = config.openRouterModel;

  try {
    if (body.type === "script") {
      const notesText = body.notes && body.notes.length
        ? body.notes.join("\n- ")
        : "No prior notes. First touch.";

      const prompt = `
You are helping a salesperson make a short, warm call and WhatsApp message to a contact from a simple CRM.

Contact:
- Name: ${body.contact.full_name}
- Org: ${body.contact.org || "N/A"}
- Phone: ${body.contact.phone}
- Email: ${body.contact.email || "N/A"}

Recent notes:
- ${notesText}

Return a concise JSON object with two fields:
- "call_script": a 3–6 line call opening + key talking points, friendly and efficient.
- "whatsapp_message": a single short WhatsApp message (no markdown, no quotes) they can paste directly.
      `.trim();

      const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.openRouterApiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!openRouterRes.ok) {
        const text = await openRouterRes.text();
        console.error("[AI script] error", text);
        throw new Error("OpenRouter request failed");
      }

      const json = await openRouterRes.json();
      const content = json.choices?.[0]?.message?.content;
      let parsed;
      try {
        parsed = typeof content === "string" ? JSON.parse(content) : content;
      } catch {
        parsed = { call_script: content, whatsapp_message: "" };
      }

      return NextResponse.json(parsed);
    }

    if (body.type === "prioritize") {
      const prompt = `
You are ranking CRM contacts for a calling session.

You will be given an array of contacts with:
- id
- full_name
- last_engaged_at (ISO string or null)
- interactions_count
- tags

Return ONLY a JSON object with one field "ordered_ids", which is an array of contact ids, sorted from highest to lowest priority to call next.
Prefer:
- Never-contacted or long-ago contacts.
- Warmer tags like "warm", "demo", "trial" above "cold" or empty.
      `.trim();

      const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.openRouterApiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: `${prompt}\n\nContacts:\n${JSON.stringify(
                body.contacts
              )}`,
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!openRouterRes.ok) {
        const text = await openRouterRes.text();
        console.error("[AI prioritize] error", text);
        throw new Error("OpenRouter request failed");
      }

      const json = await openRouterRes.json();
      const content = json.choices?.[0]?.message?.content;
      let parsed;
      try {
        parsed = typeof content === "string" ? JSON.parse(content) : content;
      } catch {
        parsed = { ordered_ids: body.contacts.map((c) => c.id) };
      }

      return NextResponse.json({
        ordered_ids: parsed.ordered_ids ?? body.contacts.map((c) => c.id),
      });
    }

    return NextResponse.json(
      { error: "Invalid AI request type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[AI] Unexpected error", error);
    return NextResponse.json(
      { error: "AI request failed" },
      { status: 500 }
    );
  }
}


