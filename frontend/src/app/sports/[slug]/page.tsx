import Link from "next/link";
import { notFound } from "next/navigation";

import { LaurelMark } from "@/components/LaurelMark";
import { SectionAccordion } from "@/components/SectionAccordion";
import { fetchSport } from "@/lib/api";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const sport = await fetchSport(slug);
  if (!sport) return { title: "Sport not found — Laurel" };
  return {
    title: `${sport.name} — Laurel`,
    description: `Rules, scoring, and what to look for in ${sport.name}.`,
  };
}

const PRIORITY_SECTIONS = [
  "Rules",
  "Scoring",
  "Classifications",
  "What to Look For",
  "Glossary",
  "Notable Records & Historical Context",
  "Notable Records and Historical Context",
];

export default async function SportDetail({ params }: PageProps) {
  const { slug } = await params;
  const sport = await fetchSport(slug);
  if (!sport) notFound();

  const sectionsList = orderSections(sport.sections);
  const tone = sport.type === "Olympic" ? "text-laurel" : "text-gold-deep";

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <Link
            href="/sports"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted transition hover:text-laurel"
          >
            <span className="text-laurel">
              <LaurelMark size={20} />
            </span>
            All sports
          </Link>
        </header>

        <div className="laurel-fade-up mb-8">
          <p
            className={`font-mono text-[10px] uppercase tracking-[0.28em] ${tone}`}
          >
            {sport.type}
          </p>
          <h1 className="mt-2 font-serif text-5xl font-medium tracking-tight">
            {sport.name}
          </h1>
          {sport.parity_pair && (
            <p className="mt-3 text-sm text-muted">
              Parity pair:{" "}
              <Link
                href={`/sports/${sport.parity_pair}`}
                className="text-laurel hover:underline"
              >
                {humanizeSlug(sport.parity_pair)}
              </Link>
            </p>
          )}
        </div>

        {sport.has_content ? (
          <SectionAccordion
            sections={sectionsList.map((s, i) => ({
              ...s,
              defaultOpen: i === 0,
            }))}
          />
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted">
            Content for this sport is being authored. Check back soon.
          </p>
        )}
      </div>
    </main>
  );
}

function orderSections(
  sections: Record<string, string>,
): Array<{ title: string; content: string }> {
  const ordered: Array<{ title: string; content: string }> = [];
  const seen = new Set<string>();

  for (const priority of PRIORITY_SECTIONS) {
    if (priority in sections) {
      ordered.push({ title: priority, content: sections[priority] });
      seen.add(priority);
    }
  }

  for (const [title, content] of Object.entries(sections)) {
    if (seen.has(title)) continue;
    if (title === "Type" || title === "Parity Pair") continue;
    ordered.push({ title, content });
  }

  return ordered;
}

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
