import Link from "next/link";
import { notFound } from "next/navigation";

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
];

export default async function SportDetail({ params }: PageProps) {
  const { slug } = await params;
  const sport = await fetchSport(slug);
  if (!sport) notFound();

  const sectionsList = orderSections(sport.sections);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <header className="mb-8">
          <Link
            href="/sports"
            className="font-mono text-xs uppercase tracking-[0.2em] text-muted hover:text-accent"
          >
            ← All sports
          </Link>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-muted">
            {sport.type}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{sport.name}</h1>
          {sport.parity_pair && (
            <p className="mt-2 text-sm text-muted">
              Parity pair:{" "}
              <Link
                href={`/sports/${sport.parity_pair}`}
                className="text-accent hover:underline"
              >
                {humanizeSlug(sport.parity_pair)}
              </Link>
            </p>
          )}
        </header>

        {sport.has_content ? (
          <SectionAccordion
            sections={sectionsList.map((s, i) => ({
              ...s,
              defaultOpen: i === 0,
            }))}
          />
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-background p-6 text-sm text-muted">
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
