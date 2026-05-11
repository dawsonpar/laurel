"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Module-level flag. Survives client-side navigations within the SPA but
// resets on a hard reload. That gives the user the behavior they asked for:
// intro plays on first load and on refresh; quiet on every nav-back.
let hasPlayedIntro = false;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function LandingHero() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (hasPlayedIntro) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia(REDUCED_MOTION_QUERY).matches;
    if (reduced) {
      hasPlayedIntro = true;
      return;
    }
    hasPlayedIntro = true;
    setAnimate(true);
  }, []);

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
      {/* Soft ambient gradient orb behind the wordmark, Gemini-style. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${
          animate ? "intro-glow" : "opacity-50"
        }`}
        style={{
          background:
            "radial-gradient(circle at center, var(--gold-soft) 0%, var(--laurel-soft) 40%, transparent 75%)",
          ...(animate && { opacity: 0 }),
        }}
      />

      <div className="flex w-full max-w-md flex-col items-center text-center">
        <p
          className={`font-mono text-[10px] uppercase tracking-[0.32em] text-foreground ${
            animate ? "intro-step" : ""
          }`}
          style={animate ? { opacity: 0, animationDelay: "1500ms" } : undefined}
        >
          Olympic & Paralympic Companion
        </p>

        <div
          className="mt-6 text-laurel"
          style={{
            animation: animate
              ? undefined
              : "laurel-breathe 6s ease-in-out infinite",
          }}
        >
          <IntroLaurel size={88} animate={animate} />
        </div>

        <h1
          className={`mt-2 font-serif text-7xl font-medium tracking-tight text-foreground sm:text-8xl ${
            animate ? "intro-step" : ""
          }`}
          style={animate ? { opacity: 0, animationDelay: "1300ms" } : undefined}
        >
          Laurel
        </h1>

        <p
          className={`mt-4 max-w-sm text-base leading-relaxed text-muted ${
            animate ? "intro-step" : ""
          }`}
          style={animate ? { opacity: 0, animationDelay: "1700ms" } : undefined}
        >
          What just happened? Capture the moment and Laurel will tell you.
        </p>

        <Link
          href="/capture"
          className="group mt-10 inline-flex items-center gap-3 rounded-full px-8 py-4 text-base font-medium text-cream shadow-[0_8px_32px_-8px_rgba(31,77,58,0.5)] transition hover:shadow-[0_12px_40px_-8px_rgba(201,169,97,0.6)]"
          style={{
            // Palindrome gradient so the shimmer loop has no visible seam.
            // The animation pans this 200%-wide gradient back and forth
            // instead of producing a hard line where the wrap used to land.
            background:
              "linear-gradient(110deg, var(--laurel-deep) 0%, var(--laurel) 25%, var(--gold) 50%, var(--laurel) 75%, var(--laurel-deep) 100%)",
            backgroundSize: "200% 100%",
            // During the intro: fade-up first (delayed), then start the
            // shimmer right after. After the intro: shimmer only.
            ...(animate
              ? {
                  opacity: 0,
                  animation:
                    "intro-step-in 500ms cubic-bezier(0.2, 0.8, 0.2, 1) 1900ms forwards, laurel-shimmer 8s linear 2400ms infinite",
                }
              : { animation: "laurel-shimmer 8s linear infinite" }),
          }}
        >
          <span>Capture a moment</span>
          <ArrowRight />
        </Link>

        <nav
          className={`mt-8 flex items-center gap-6 text-sm ${
            animate ? "intro-step" : ""
          }`}
          style={animate ? { opacity: 0, animationDelay: "2100ms" } : undefined}
        >
          <Link
            href="/demo"
            className="text-laurel transition hover:text-laurel-deep"
          >
            See a demo
          </Link>
          <span className="text-muted/50" aria-hidden>
            •
          </span>
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

      <footer
        className={`absolute bottom-6 font-mono text-[10px] uppercase tracking-[0.28em] text-muted ${
          animate ? "intro-step" : ""
        }`}
        style={animate ? { opacity: 0, animationDelay: "2300ms" } : undefined}
      >
        Team USA × Google Cloud Hackathon 2026
      </footer>
    </main>
  );
}

/**
 * Laurel mark with a built-in intro animation.
 *
 * When `animate` is true: branches draw via stroke-dashoffset, and leaves
 * pop in along each branch from base (y=47, drawn first) to tip (y=22).
 *
 * The shimmer / breathing of the static state is restored by the parent.
 */
function IntroLaurel({
  size,
  animate,
}: {
  size: number;
  animate: boolean;
}) {
  // Once branches finish drawing (~900ms), restart the gentle breathing
  // animation so the mark feels alive in its resting state.
  const [restoreBreathe, setRestoreBreathe] = useState(!animate);
  useEffect(() => {
    if (!animate) return;
    const t = setTimeout(() => setRestoreBreathe(true), 1300);
    return () => clearTimeout(t);
  }, [animate]);

  // Leaves are listed top-to-bottom in LaurelMark; we want them to appear
  // bottom-to-top (as the branch grows upward). leafIndex 0 = bottom-most.
  const leaves = [
    { d: "M25 47 C 20 47, 17 47, 16 48 C 18 51, 22 51, 25 47 Z", branch: "L" },
    { d: "M20 41 C 15 40, 12 40, 10 41 C 12 44, 16 45, 20 41 Z", branch: "L" },
    { d: "M16 35 C 11 33, 8 32, 6 33 C 8 36, 12 38, 16 35 Z", branch: "L" },
    { d: "M14 28 C 9 25, 6 24, 4 24 C 6 27, 10 30, 14 28 Z", branch: "L" },
    { d: "M14 22 C 9 18, 6 16, 4 16 C 6 20, 10 23, 14 22 Z", branch: "L" },
    { d: "M39 47 C 44 47, 47 47, 48 48 C 46 51, 42 51, 39 47 Z", branch: "R" },
    { d: "M44 41 C 49 40, 52 40, 54 41 C 52 44, 48 45, 44 41 Z", branch: "R" },
    { d: "M48 35 C 53 33, 56 32, 58 33 C 56 36, 52 38, 48 35 Z", branch: "R" },
    { d: "M50 28 C 55 25, 58 24, 60 24 C 58 27, 54 30, 50 28 Z", branch: "R" },
    { d: "M50 22 C 55 18, 58 16, 60 16 C 58 20, 54 23, 50 22 Z", branch: "R" },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={
        restoreBreathe && animate
          ? { animation: "laurel-breathe 6s ease-in-out infinite" }
          : undefined
      }
    >
      <path
        d="M32 56 C 18 50, 10 38, 10 22"
        pathLength={1}
        className={animate ? "intro-branch" : ""}
      />
      <path
        d="M32 56 C 46 50, 54 38, 54 22"
        pathLength={1}
        className={animate ? "intro-branch" : ""}
      />
      {leaves.map((leaf, i) => {
        // Leaves on each branch staggered from base (i % 5 == 0) to tip
        // (i % 5 == 4). 90ms apart, starting 250ms in (after branch begins).
        const leafIndex = i % 5;
        const delay = 250 + leafIndex * 110;
        return (
          <path
            key={leaf.d}
            d={leaf.d}
            fill="currentColor"
            fillOpacity={0.18}
            className={animate ? "intro-leaf" : ""}
            style={
              animate
                ? {
                    opacity: 0,
                    animationDelay: `${delay}ms`,
                    transformOrigin: "32px 56px",
                  }
                : { fill: "currentColor", fillOpacity: 0.18 }
            }
          />
        );
      })}
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
