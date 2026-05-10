"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Conversation } from "@/components/Conversation";
import { ShareControls } from "@/components/ShareControls";
import type { CapturedMoment } from "@/lib/capturedMoment";
import { openExplainStream, type ExplainEvent } from "@/lib/explainStream";

interface MomentViewerProps {
  moment: CapturedMoment;
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

export function MomentViewer({ moment, onReset }: MomentViewerProps) {
  const [state, setState] = useState<StreamState>(INITIAL_STATE);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  // Frame used for the share preview (and OG image). Pick the middle frame
  // when we have multiples; otherwise the only one.
  const shareFrame = useMemo(() => {
    if (moment.frames.length === 0) return null;
    const mid = Math.floor(moment.frames.length / 2);
    return moment.frames[mid] ?? moment.frames[0];
  }, [moment.frames]);

  useEffect(() => {
    const source = moment.clip ?? shareFrame;
    if (!source) {
      setMediaUrl(null);
      return;
    }
    const url = URL.createObjectURL(source);
    setMediaUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [moment.clip, shareFrame]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setState(INITIAL_STATE);

    (async () => {
      const stream = openExplainStream({
        images: moment.frames,
        signal: controller.signal,
      });
      for await (const event of stream) {
        if (cancelled) break;
        applyEvent(event, setState);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [moment.frames]);

  const isThinking = state.status === "loading" || state.status === "vision";
  const isStreaming = state.status === "streaming";
  const showOverlay = isThinking || isStreaming;
  const hasClip = !!moment.clip;

  return (
    <div className="laurel-fade-up flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-foreground">
        {mediaUrl &&
          (hasClip ? (
            <video
              key={mediaUrl}
              src={mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt="Captured moment"
              className="h-full w-full object-contain"
            />
          ))}

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
              ? "Sending the clip to Laurel..."
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

      {state.status === "done" && state.momentId && shareFrame && (
        <ShareControls
          momentId={state.momentId}
          image={shareFrame}
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
