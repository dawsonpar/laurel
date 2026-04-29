import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <header className="mb-12 text-center">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Olympic & Paralympic Companion
          </p>
          <h1 className="mb-4 text-5xl font-semibold tracking-tight sm:text-6xl">
            Laurel
          </h1>
          <p className="mx-auto max-w-md text-lg leading-relaxed text-muted">
            Wait, what just happened? Point your phone at the TV and find out.
          </p>
        </header>

        <nav className="grid gap-3 sm:grid-cols-3">
          <CtaCard
            href="/capture"
            label="Capture a moment"
            description="Use your camera or upload a screenshot."
          />
          <CtaCard
            href="/sports"
            label="Browse sports"
            description="Rules, scoring, classifications."
          />
          <CtaCard
            href="/about"
            label="See examples"
            description="Memorable moments from past Games."
          />
        </nav>

        <footer className="mt-16 text-center font-mono text-xs uppercase tracking-[0.18em] text-muted">
          GCP × Team USA Hackathon 2026
        </footer>
      </div>
    </main>
  );
}

function CtaCard({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border border-border bg-background p-5 transition hover:border-accent hover:shadow-sm"
    >
      <span className="text-base font-medium text-foreground group-hover:text-accent">
        {label}
      </span>
      <span className="mt-1 text-sm leading-relaxed text-muted">
        {description}
      </span>
    </Link>
  );
}
