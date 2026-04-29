import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchMoment, frameUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const moment = await fetchMoment(id);
  if (!moment) {
    return { title: "Moment not found — Laurel" };
  }
  const description = moment.explanation.slice(0, 160);
  return {
    title: `${moment.sport_name ?? "A Laurel moment"} — Laurel`,
    description,
    openGraph: {
      title: `${moment.sport_name ?? "Laurel moment"}`,
      description,
      type: "article",
    },
  };
}

export default async function MomentPage({ params }: PageProps) {
  const { id } = await params;
  const moment = await fetchMoment(id);
  if (!moment) notFound();

  const imageSrc = frameUrl(moment.frame_url);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <header className="mb-8">
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.2em] text-muted hover:text-accent"
          >
            ← Laurel
          </Link>
          {moment.sport_name && (
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-muted">
              {moment.sport_name}
            </p>
          )}
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {moment.moment_summary || "A captured moment"}
          </h1>
        </header>

        {imageSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt="Captured moment"
            className="mb-6 w-full rounded-lg border border-border object-contain"
          />
        )}

        <article className="rounded-lg border border-border bg-background p-5 text-sm leading-relaxed text-foreground">
          {moment.explanation}
        </article>

        <footer className="mt-8 text-center font-mono text-xs uppercase tracking-[0.2em] text-muted">
          <Link href="/capture" className="hover:text-accent">
            Capture your own moment
          </Link>
        </footer>
      </div>
    </main>
  );
}
