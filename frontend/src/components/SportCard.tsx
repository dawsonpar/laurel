import Link from "next/link";

import type { SportSummary } from "@/lib/api";

export function SportCard({ sport }: { sport: SportSummary }) {
  const tone = sport.type === "Olympic" ? "text-laurel" : "text-gold-deep";

  return (
    <Link
      href={`/sports/${sport.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:border-laurel hover:shadow-[0_8px_24px_-12px_rgba(31,77,58,0.3)]"
    >
      <span className={`font-mono text-[10px] uppercase tracking-[0.24em] ${tone}`}>
        {sport.type}
      </span>
      <span className="mt-3 font-serif text-2xl font-medium text-foreground transition-colors group-hover:text-laurel">
        {sport.name}
      </span>
      {sport.parity_pair && (
        <span className="mt-2 text-xs text-muted">
          Parity pair: {humanizeSlug(sport.parity_pair)}
        </span>
      )}
    </Link>
  );
}

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
