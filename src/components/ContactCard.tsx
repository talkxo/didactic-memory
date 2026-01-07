import Link from "next/link";

type ContactCardProps = {
  id: string;
  fullName: string;
  org?: string | null;
  phone: string;
  email?: string | null;
  lastEngagedBy?: string | null;
  lastEngagedAt?: string | null;
  onAddNote?: () => void;
  onAISuggest?: () => void;
};

const formatLastEngaged = (iso?: string | null) => {
  if (!iso) return "Never contacted";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Recently";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export function ContactCard({
  id,
  fullName,
  org,
  phone,
  email,
  lastEngagedBy,
  lastEngagedAt,
  onAddNote,
  onAISuggest,
}: ContactCardProps) {
  const telHref = `tel:${phone}`;
  const waHref = `https://wa.me/${encodeURIComponent(
    phone.replace(/[^+\d]/g, "")
  )}`;

  return (
    <section
      key={id}
      className="rounded-2xl border border-zinc-200 bg-white px-3 py-3 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-heading text-base font-semibold leading-tight">
            {fullName}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-600">
            {org || "No organization"}
          </p>
        </div>
        <div className="flex flex-col items-end text-[10px] text-zinc-500">
          <span className="rounded-full bg-zinc-100 px-2 py-0.5">
            {lastEngagedBy
              ? `Last by ${lastEngagedBy}`
              : "Not contacted yet"}
          </span>
          <span className="mt-1">{formatLastEngaged(lastEngagedAt)}</span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-700">
        <span>{phone}</span>
        {email && (
          <>
            <span className="h-1 w-1 rounded-full bg-zinc-300" />
            <span>{email}</span>
          </>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Link
          href={telHref}
          className="flex flex-1 items-center justify-center rounded-full bg-zinc-900 px-2 py-2 text-xs font-medium text-white"
        >
          Call
        </Link>
        <Link
          href={waHref}
          target="_blank"
          className="flex flex-1 items-center justify-center rounded-full border border-zinc-300 bg-zinc-50 px-2 py-2 text-xs font-medium text-zinc-900"
        >
          WhatsApp
        </Link>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
        <button
          type="button"
          className="underline-offset-2 hover:underline"
          onClick={onAddNote}
        >
          Add note
        </button>
        <button
          type="button"
          className="underline-offset-2 hover:underline"
          onClick={onAISuggest}
        >
          AI script
        </button>
      </div>
    </section>
  );
}


