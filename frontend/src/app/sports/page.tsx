import Link from "next/link";

import { SportCard } from "@/components/SportCard";
import { fetchSports } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sports — Laurel",
  description:
    "Six curated Olympic and Paralympic sports with rules, scoring, and classifications explained for new viewers.",
};

export default async function SportsIndex() {
  const sports = await fetchSports();
  const olympic = sports.filter((s) => s.type === "Olympic");
  const paralympic = sports.filter((s) => s.type === "Paralympic");

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-3xl">
        <header className="mb-10">
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.2em] text-muted hover:text-accent"
          >
            ← Laurel
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Browse sports</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Rules, scoring, classifications, and what to look for. Equal coverage of
            Olympic and Paralympic events.
          </p>
        </header>

        <SportSection title="Olympic" sports={olympic} />
        <div className="mt-10">
          <SportSection title="Paralympic" sports={paralympic} />
        </div>
      </div>
    </main>
  );
}

function SportSection({
  title,
  sports,
}: {
  title: string;
  sports: Awaited<ReturnType<typeof fetchSports>>;
}) {
  return (
    <section>
      <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-muted">
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {sports.map((sport) => (
          <SportCard key={sport.slug} sport={sport} />
        ))}
      </div>
    </section>
  );
}
