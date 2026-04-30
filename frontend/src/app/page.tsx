import Link from "next/link";

import { LaurelMark } from "@/components/LaurelMark";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
      {/* Soft ambient gradient orb behind the wordmark, Gemini-style. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at center, var(--gold-soft) 0%, var(--laurel-soft) 40%, transparent 75%)",
        }}
      />

      <div className="laurel-fade-up flex w-full max-w-md flex-col items-center text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted">
          Olympic & Paralympic Companion
        </p>

        <div
          className="mt-6 text-laurel"
          style={{ animation: "laurel-breathe 6s ease-in-out infinite" }}
        >
          <LaurelMark size={88} />
        </div>

        <h1 className="mt-2 font-serif text-7xl font-medium tracking-tight text-foreground sm:text-8xl">
          Laurel
        </h1>

        <p className="mt-4 max-w-sm text-base leading-relaxed text-muted">
          Wait, what just happened? Capture the moment and Laurel will explain
          the rule, the record, and why it matters.
        </p>

        <Link
          href="/capture"
          className="group mt-10 inline-flex items-center gap-3 rounded-full px-8 py-4 text-base font-medium text-cream shadow-[0_8px_32px_-8px_rgba(31,77,58,0.5)] transition hover:shadow-[0_12px_40px_-8px_rgba(201,169,97,0.6)]"
          style={{
            background:
              "linear-gradient(110deg, var(--laurel-deep) 0%, var(--laurel) 35%, var(--gold) 100%)",
            backgroundSize: "200% 100%",
            animation: "laurel-shimmer 8s linear infinite",
          }}
        >
          <CaptureGlyph />
          <span>Capture a moment</span>
          <ArrowRight />
        </Link>

        <nav className="mt-8 flex items-center gap-6 text-sm">
          <Link
            href="/sports"
            className="text-muted transition hover:text-laurel"
          >
            Browse sports
          </Link>
          <span className="text-muted/50" aria-hidden>
            •
          </span>
          <Link
            href="/about"
            className="text-muted transition hover:text-laurel"
          >
            About
          </Link>
        </nav>
      </div>

      <footer className="absolute bottom-6 font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
        GCP × Team USA Hackathon 2026
      </footer>
    </main>
  );
}

function CaptureGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="transition-transform group-hover:translate-x-1"
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
