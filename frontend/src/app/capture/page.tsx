"use client";

import Link from "next/link";
import { useState } from "react";

import { CameraCapture } from "@/components/CameraCapture";
import { MomentViewer } from "@/components/MomentViewer";

export default function CapturePage() {
  const [captured, setCaptured] = useState<Blob | null>(null);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-xl">
        <header className="mb-8">
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.2em] text-muted hover:text-accent"
          >
            ← Laurel
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            {captured ? "What just happened?" : "Capture a moment"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {captured
              ? "Laurel is reading the frame and the rules."
              : "Point your phone at the TV and tap the shutter, or upload a screenshot."}
          </p>
        </header>

        {captured ? (
          <MomentViewer
            image={captured}
            onReset={() => setCaptured(null)}
          />
        ) : (
          <CameraCapture onCapture={setCaptured} />
        )}
      </div>
    </main>
  );
}
