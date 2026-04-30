"use client";

import { useEffect, useRef, useState } from "react";

import { Conversation } from "@/components/Conversation";
import { ShareControls } from "@/components/ShareControls";
import { openExplainStream, type ExplainEvent } from "@/lib/explainStream";

interface MomentViewerProps {
  image: Blob;
  sportHint?: string;
  onReset: () => void;
}

interface StreamState {
  status: "loading" | "vision" | "streaming" | "done" | "error";
  momentId: string | null;
  sportSlug: string | null;
  sportName: string | null;
  momentSummary: string | null;
  explanation: string;
  error: string | null;
}

const INITIAL_STATE: StreamState = {
  status: "loading",
  momentId: null,
  sportSlug: null,
  sportName: null,
  momentSummary: null,
  explanation: "",
  error: null,
};

export function MomentViewer({ image, onReset }: MomentViewerProps) {
  const [state, setState] = useState<StreamState>(INITIAL_STATE);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    objectUrlRef.current = URL.createObjectURL(image);
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [image]);

  useEffect(() => {
    const controller = new AbortController();
    setState(INITIAL_STATE);

    (async () => {
      const stream = openExplainStream({
        image,
        signal: controller.signal,
      });
      for await (const event of stream) {
        applyEvent(event, setState);
      }
    })();

    return () => controller.abort();
  }, [image]);

  const isThinking = state.status === "loading" || state.status === "vision";
  const isStreaming = state.status === "streaming";
  const showOverlay = isThinking || isStreaming;

  return (
    <div className="laurel-fade-up flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-foreground">
        {objectUrlRef.current && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={objectUrlRef.current}
            alt="Captured moment"
            className="h-full w-full object-contain"
          />
        )}

        {/* Animated laurel + gold ring overlay during AI processing. */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-500 ${
            showOverlay ? "opacity-100" : "opacity-0"
          }`}
          style={{
            animation: showOverlay
              ? "laurel-pulse-ring 2.4s ease-in-out infinite"
              : undefined,
          }}
        />

        {showOverlay && (
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-0 h-1"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, var(--gold) 30%, var(--laurel-soft) 50%, var(--gold) 70%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "laurel-shimmer 2.2s linear infinite",
            }}
          />
        )}
      </div>

      {state.sportName && (
        <p className="laurel-fade-up text-xs text-muted">
          <span className="font-mono uppercase tracking-[0.2em] text-laurel">
            Identified
          </span>{" "}
          {state.sportName}
          {state.momentSummary ? `. ${state.momentSummary}` : ""}
        </p>
      )}

      <article className="min-h-[8rem] rounded-2xl border border-border bg-background p-5 text-sm leading-relaxed text-foreground">
        {state.explanation || (
          <span className="text-muted">
            {state.status === "loading"
              ? "Sending the frame to Laurel..."
              : "Reading the moment..."}
          </span>
        )}
      </article>

      {state.status === "error" && state.error && (
        <p className="rounded-2xl border border-border bg-background px-4 py-3 text-xs text-red-700 dark:text-red-400">
          {state.error}
        </p>
      )}

      {state.status === "done" && state.momentId && (
        <Conversation
          momentId={state.momentId}
          sportSlug={state.sportSlug}
          sportName={state.sportName}
          momentSummary={state.momentSummary ?? ""}
          initialAnswer={state.explanation}
        />
      )}

      {state.status === "done" && state.momentId && (
        <ShareControls
          momentId={state.momentId}
          image={image}
          explanation={state.explanation}
          sportSlug={state.sportSlug}
          sportName={state.sportName}
          momentSummary={state.momentSummary ?? ""}
        />
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        {state.status === "done" && (
          <button
            type="button"
            onClick={() => copyText(state.explanation)}
            className="rounded-full border border-border bg-background px-5 py-2 text-sm text-foreground transition hover:border-laurel"
          >
            Copy explanation
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-border bg-background px-5 py-2 text-sm text-foreground transition hover:border-laurel"
        >
          Capture another
        </button>
      </div>
    </div>
  );
}

function applyEvent(
  event: ExplainEvent,
  set: React.Dispatch<React.SetStateAction<StreamState>>,
) {
  switch (event.type) {
    case "vision":
      set((s) => ({
        ...s,
        status: "streaming",
        momentId: event.moment_id,
        sportSlug: event.sport_slug,
        sportName: event.sport_name,
        momentSummary: event.moment_summary,
      }));
      break;
    case "token":
      set((s) => ({
        ...s,
        status: "streaming",
        explanation: s.explanation + event.text,
      }));
      break;
    case "done":
      set((s) => ({ ...s, status: "done", momentId: event.moment_id }));
      break;
    case "error":
      set((s) => ({ ...s, status: "error", error: event.message }));
      break;
  }
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Silent failure: clipboard requires HTTPS or user gesture in some browsers.
  }
}
