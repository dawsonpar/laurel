import Link from "next/link";
import { notFound } from "next/navigation";

import { LaurelMark } from "@/components/LaurelMark";
import { fetchMoment, frameUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const moment = await fetchMoment(id);
  if (!moment) return { title: "Moment not found. Laurel" };
  const description = moment.explanation.slice(0, 160);
  return {
    title: `${moment.sport_name ?? "A Laurel moment"} on Laurel`,
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
    <main className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted transition hover:text-laurel"
          >
            <span className="text-laurel">
              <LaurelMark size={20} />
            </span>
            Laurel
          </Link>
        </header>

        <div className="laurel-fade-up">
          {moment.sport_name && (
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-laurel">
              {moment.sport_name}
            </p>
          )}
          <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight">
            {moment.moment_summary || "A captured moment"}
          </h1>
        </div>

        {imageSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt="Captured moment"
            className="laurel-fade-up mt-6 w-full rounded-2xl border border-border object-contain"
          />
        )}

        <article className="laurel-fade-up mt-6 rounded-2xl border border-border bg-background p-5 text-sm leading-relaxed text-foreground">
          {moment.explanation}
        </article>

        <footer className="mt-10 flex justify-center font-mono text-xs uppercase tracking-[0.28em] text-muted">
          <Link
            href="/capture"
            className="rounded-full border border-border bg-background px-5 py-2 transition hover:border-laurel hover:text-laurel"
          >
            Capture your own moment
          </Link>
        </footer>
      </div>
    </main>
  );
}
