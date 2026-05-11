"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { LaurelMark } from "@/components/LaurelMark";
import { MomentViewer } from "@/components/MomentViewer";
import type { CapturedMoment } from "@/lib/capturedMoment";

interface DemoSpec {
  id: "a" | "b";
  imagePath: string;
  eyebrow: string;
  title: string;
  suggested: string[];
  /** Reset target. The "next demo" link uses this. */
  next: { href: string; label: string };
}

const DEMOS: Record<"a" | "b", DemoSpec> = {
  a: {
    id: "a",
    imagePath: "/demo/scene-a.jpg",
    eyebrow: "Demo · Scenario A",
    title: "Curling. The double-touch call.",
    suggested: ["What is the double touch rule?"],
    next: { href: "/demo/b", label: "Try Scenario B" },
  },
  b: {
    id: "b",
    imagePath: "/demo/scene-b.jpg",
    eyebrow: "Demo · Scenario B",
    title: "Long jump T64. World record falls.",
    suggested: [
      "What is the world record that was broken?",
      "How does it compare to the regular Olympics?",
      "Why does it matter?",
    ],
    next: { href: "/demo/a", label: "Try Scenario A" },
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DemoPage({ params }: PageProps) {
  const { id } = use(params);
  const spec = DEMOS[id as "a" | "b"];
  const [moment, setMoment] = useState<CapturedMoment | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Bumping `nonce` forces MomentViewer to re-mount, which re-runs the
  // /explain stream against the same frame. Lets you replay the demo
  // without leaving the page.
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!spec) return;
    let cancelled = false;
    setLoadError(null);
    setMoment(null);
    (async () => {
      try {
        const res = await fetch(spec.imagePath);
        if (!res.ok) throw new Error(`Failed to load ${spec.imagePath}`);
        const blob = await res.blob();
        if (cancelled) return;
        setMoment({
          frames: [blob],
          clip: null,
          clipMime: null,
        });
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : "Could not load the demo frame.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spec, nonce]);

  if (!spec) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted">
            Demo not found
          </p>
          <p className="mt-2 text-sm text-foreground">
            Try{" "}
            <Link href="/demo/a" className="text-laurel hover:underline">
              /demo/a
            </Link>{" "}
            or{" "}
            <Link href="/demo/b" className="text-laurel hover:underline">
              /demo/b
            </Link>
            .
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-xl">
        <header className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted transition hover:text-laurel"
          >
            <span className="text-laurel">
              <LaurelMark size={20} />
            </span>
            Laurel
          </Link>
          <Link
            href={spec.next.href}
            className="text-xs uppercase tracking-[0.2em] text-muted hover:text-laurel"
          >
            {spec.next.label}
          </Link>
        </header>

        <div className="laurel-fade-up mb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold-deep">
            {spec.eyebrow}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            {spec.title}
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            The captured moment is pre-loaded. Laurel will explain it on
            arrival, then tap a suggested question.
          </p>
        </div>

        {loadError && (
          <p className="rounded-2xl border border-border bg-background px-4 py-3 text-xs text-foreground/70">
            {loadError}
          </p>
        )}

        {moment && (
          <MomentViewer
            key={`${spec.id}-${nonce}`}
            moment={moment}
            onReset={() => setNonce((n) => n + 1)}
            suggestedFollowups={spec.suggested}
            resetLabel="Replay this scene"
          />
        )}
      </div>
    </main>
  );
}
