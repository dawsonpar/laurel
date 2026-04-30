"use client";

import Link from "next/link";
import { useState } from "react";

import { CaptureSurface } from "@/components/CaptureSurface";
import { LaurelMark } from "@/components/LaurelMark";
import { MomentViewer } from "@/components/MomentViewer";

export default function CapturePage() {
  const [captured, setCaptured] = useState<Blob | null>(null);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-xl">
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
          {captured && (
            <button
              type="button"
              onClick={() => setCaptured(null)}
              className="text-xs uppercase tracking-[0.2em] text-muted hover:text-laurel"
            >
              New capture
            </button>
          )}
        </header>

        {!captured && (
          <div className="laurel-fade-up mb-6">
            <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
              Capture a moment
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Laurel watches what you watch. Share your screen on a laptop,
              point your phone at the TV, or upload a screenshot.
            </p>
          </div>
        )}

        {captured ? (
          <MomentViewer image={captured} onReset={() => setCaptured(null)} />
        ) : (
          <CaptureSurface onCapture={setCaptured} />
        )}
      </div>
    </main>
  );
}
