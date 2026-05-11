"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { Conversation } from "@/components/Conversation";
import { LaurelMark } from "@/components/LaurelMark";
import { ShareControls } from "@/components/ShareControls";
import type { CapturedMoment } from "@/lib/capturedMoment";
import {
  openExplainStream,
  type ExplainEvent,
  type SupportedSport,
} from "@/lib/explainStream";

interface MomentViewerProps {
  moment: CapturedMoment;
  onReset: () => void;
  /** Optional scene-specific suggested follow-up chips (used by /demo). */
  suggestedFollowups?: readonly string[];
  /** Optional CTA label override (e.g. "Try another scene"). */
  resetLabel?: string;
}

interface StreamState {
  status: "loading" | "vision" | "streaming" | "done" | "unsupported" | "error";
  momentId: string | null;
  sportSlug: string | null;
  sportName: string | null;
  momentSummary: string | null;
  explanation: string;
  error: string | null;
  unsupportedMessage: string | null;
  supportedSports: SupportedSport[];
}

const INITIAL_STATE: StreamState = {
  status: "loading",
  momentId: null,
  sportSlug: null,
  sportName: null,
  momentSummary: null,
  explanation: "",
  error: null,
  unsupportedMessage: null,
  supportedSports: [],
};

export function MomentViewer({
  moment,
  onReset,
  suggestedFollowups,
  resetLabel,
}: MomentViewerProps) {
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
            // Fallback ring drawn before the first animation frame paints,
            // and a hint to the compositor so the chunky inset glow stays
            // smooth during streaming.
            boxShadow:
              "inset 0 0 0 4px var(--gold), inset 0 0 0 5px var(--laurel), inset 0 0 32px 2px var(--gold)",
            willChange: showOverlay ? "box-shadow" : undefined,
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

      {state.sportName && state.status !== "unsupported" && (
        <p className="laurel-fade-up text-xs text-muted">
          <span className="font-mono uppercase tracking-[0.2em] text-laurel">
            Identified
          </span>{" "}
          {state.sportName}
          {state.momentSummary ? `. ${state.momentSummary}` : ""}
        </p>
      )}

      {state.status === "unsupported" && state.unsupportedMessage && (
        <UnsupportedSportCard
          message={state.unsupportedMessage}
          supportedSports={state.supportedSports}
        />
      )}

      {state.status !== "unsupported" && state.status !== "error" && (
        <article className="min-h-[8rem] rounded-2xl border border-border bg-background p-5 text-sm leading-relaxed text-foreground">
          {state.explanation || (
            <span className="text-muted">
              {state.status === "loading"
                ? "Sending the clip to Laurel..."
                : "Reading the moment..."}
            </span>
          )}
        </article>
      )}

      {state.status === "error" && state.error && (
        <article className="laurel-fade-up flex flex-col gap-3 rounded-2xl border border-border bg-background p-5">
          <div className="flex items-center gap-3">
            <span className="text-laurel">
              <LaurelMark size={28} />
            </span>
            <p className="font-serif text-xl font-medium text-foreground">
              I dropped the ball on that one.
            </p>
          </div>
          <p className="text-sm leading-relaxed text-foreground">
            {state.error}
          </p>
        </article>
      )}

      {state.status === "done" && state.momentId && (
        <Conversation
          momentId={state.momentId}
          sportSlug={state.sportSlug}
          sportName={state.sportName}
          momentSummary={state.momentSummary ?? ""}
          initialAnswer={state.explanation}
          suggestedFollowups={suggestedFollowups}
        />
      )}

      {state.status === "done" && (
        <div className="mt-2 flex flex-col gap-4 border-t border-border pt-5">
          {/* Utility row: secondary actions (share + copy). Grouped, muted,
              equal weight. Vertical on mobile, inline on desktop. */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            {state.momentId && shareFrame && (
              <ShareControls
                momentId={state.momentId}
                image={shareFrame}
                explanation={state.explanation}
                sportSlug={state.sportSlug}
                sportName={state.sportName}
                momentSummary={state.momentSummary ?? ""}
              />
            )}
            <button
              type="button"
              onClick={() => copyText(state.explanation)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-muted transition hover:border-laurel hover:text-laurel"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy explanation
            </button>
          </div>

          {/* Primary CTA. Mirrors the landing-page Capture button so the
              "what next" action is visually unmistakable. */}
          <button
            type="button"
            onClick={onReset}
            className="group inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 text-base font-medium text-cream shadow-[0_8px_32px_-8px_rgba(31,77,58,0.5)] transition hover:shadow-[0_12px_40px_-8px_rgba(201,169,97,0.6)]"
            style={{
              background:
                "linear-gradient(110deg, var(--laurel-deep) 0%, var(--laurel) 25%, var(--gold) 50%, var(--laurel) 75%, var(--laurel-deep) 100%)",
              backgroundSize: "200% 100%",
              animation: "laurel-shimmer 8s linear infinite",
            }}
          >
            <span>{resetLabel ?? "Capture another moment"}</span>
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
          </button>
        </div>
      )}

      {state.status !== "done" && (
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-border bg-background px-5 py-2 text-sm text-foreground transition hover:border-laurel"
          >
            Capture another
          </button>
        </div>
      )}
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
      set((s) =>
        s.status === "unsupported"
          ? s
          : { ...s, status: "done", momentId: event.moment_id },
      );
      break;
    case "unsupported":
      set((s) => ({
        ...s,
        status: "unsupported",
        momentId: event.moment_id,
        unsupportedMessage: event.message,
        supportedSports: event.supported_sports,
      }));
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

function UnsupportedSportCard({
  message,
  supportedSports,
}: {
  message: string;
  supportedSports: SupportedSport[];
}) {
  const olympic = supportedSports.filter((s) => s.type === "Olympic");
  const paralympic = supportedSports.filter((s) => s.type === "Paralympic");

  return (
    <article
      data-testid="unsupported-sport-card"
      className="laurel-fade-up flex flex-col gap-5 rounded-2xl border border-border bg-background p-5"
    >
      <div className="flex items-center gap-3">
        <span className="text-laurel">
          <LaurelMark size={28} />
        </span>
        <p className="font-serif text-xl font-medium text-foreground">
          Hmm, that one is not in my playbook yet.
        </p>
      </div>
      <p className="text-sm leading-relaxed text-foreground">{message}</p>
      <SportGroup label="Olympic" sports={olympic} />
      <SportGroup label="Paralympic" sports={paralympic} />
    </article>
  );
}

function SportGroup({
  label,
  sports,
}: {
  label: string;
  sports: SupportedSport[];
}) {
  if (sports.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-laurel">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {sports.map((sport) => (
          <Link
            key={sport.slug}
            href={`/sports/${sport.slug}`}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground transition hover:border-laurel hover:text-laurel"
          >
            {sport.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
