import Link from "next/link";

import type { SportSummary } from "@/lib/api";

export function SportCard({ sport }: { sport: SportSummary }) {
  return (
    <Link
      href={`/sports/${sport.slug}`}
      className="group flex flex-col rounded-lg border border-border bg-background p-5 transition hover:border-accent hover:shadow-sm"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
        {sport.type}
      </span>
      <span className="mt-2 text-lg font-medium text-foreground group-hover:text-accent">
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
