"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { LaurelMark } from "@/components/LaurelMark";
import type { CapturedMoment } from "@/lib/capturedMoment";

type CaptureMode = "screen" | "camera";

interface CaptureSurfaceProps {
  onCapture: (moment: CapturedMoment) => void;
  /** Override the default mode. Auto-detected by form factor when omitted. */
  defaultMode?: CaptureMode;
}

const CLIP_DURATION_MS = 3000;
const FRAME_TIMES_MS = [0, 1000, 2000];

export function CaptureSurface({
  onCapture,
  defaultMode,
}: CaptureSurfaceProps) {
  const [mode, setMode] = useState<CaptureMode>(
    defaultMode ?? detectDefaultMode(),
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [starting, setStarting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const stopStream = useCallback(() => {
    setStream((current) => {
      current?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  useEffect(() => {
    return () => {
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const startStream = async () => {
    setError(null);
    setStarting(true);
    try {
      const next =
        mode === "screen"
          ? await navigator.mediaDevices.getDisplayMedia({
              video: { displaySurface: "monitor" } as MediaTrackConstraints,
              audio: false,
            })
          : await navigator.mediaDevices.getUserMedia({
              video: { facingMode: "environment" },
              audio: false,
            });
      setStream(next);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not start capture.";
      setError(`${message}. Try the upload option below.`);
    } finally {
      setStarting(false);
    }
  };

  const captureClip = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !stream) return;

    setRecording(true);
    try {
      const recorder = createRecorder(stream);
      const recorderPromise = recorder
        ? collectClip(recorder)
        : Promise.resolve(null);

      const frames = await captureFrames(video, canvas);
      const clipResult = await recorderPromise;

      onCapture({
        frames,
        clip: clipResult?.blob ?? null,
        clipMime: clipResult?.mime ?? null,
      });
      stopStream();
    } finally {
      setRecording(false);
    }
  };

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onCapture({ frames: [file], clip: null, clipMime: null });
    }
  };

  const isLive = !!stream;
  const isBusy = isLive && recording;

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex w-full items-center gap-1 self-start rounded-full border border-border bg-background p-1 sm:w-auto">
        <ModeChip
          active={mode === "screen"}
          onClick={() => {
            stopStream();
            setMode("screen");
          }}
          label="Share screen"
          icon={<ScreenIcon />}
        />
        <ModeChip
          active={mode === "camera"}
          onClick={() => {
            stopStream();
            setMode("camera");
          }}
          label="Use camera"
          icon={<CameraIcon />}
        />
      </div>

      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-border bg-foreground sm:aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover transition-opacity ${
            isLive ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {recording && <RecordingOverlay />}

        {!isLive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-cream/80">
            <div className="text-cream">
              <LaurelMark size={48} />
            </div>
            <p className="font-serif text-2xl text-cream">
              {mode === "screen" ? "Share your screen" : "Use your camera"}
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-cream/70">
              {starting
                ? "Starting capture..."
                : mode === "screen"
                  ? "Pick the window or display showing the Games."
                  : "Point at the TV and capture the moment."}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-2xl border border-border bg-background px-4 py-3 text-xs text-foreground/70">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        {!isLive ? (
          <button
            type="button"
            onClick={startStream}
            disabled={starting}
            className="flex-1 rounded-full bg-laurel px-5 py-3 text-sm font-medium text-cream transition hover:bg-laurel-deep disabled:opacity-50"
          >
            {starting
              ? "Starting..."
              : mode === "screen"
                ? "Start sharing"
                : "Start camera"}
          </button>
        ) : (
          <button
            type="button"
            onClick={captureClip}
            disabled={isBusy}
            className="flex-1 rounded-full bg-gradient-to-r from-laurel via-gold to-laurel bg-[length:200%_100%] px-5 py-3 text-sm font-medium text-cream transition hover:bg-[length:300%_100%] disabled:opacity-80"
            style={{ animation: "laurel-shimmer 4s linear infinite" }}
          >
            {recording ? "Capturing the moment..." : "Capture moment"}
          </button>
        )}

        <label className="flex cursor-pointer flex-1 items-center justify-center rounded-full border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition hover:border-laurel">
          Upload a screenshot
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFile}
          />
        </label>
      </div>
    </div>
  );
}

function RecordingOverlay() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          boxShadow:
            "inset 0 0 0 3px var(--gold), inset 0 0 0 6px var(--laurel)",
          animation: "laurel-pulse-ring 2.4s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-0 h-1"
        style={{
          background: "var(--gold)",
          animation: `laurel-progress ${CLIP_DURATION_MS}ms linear forwards`,
          transformOrigin: "left center",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-laurel"
      >
        <span
          className="inline-block h-2 w-2 rounded-full bg-gold"
          style={{ animation: "laurel-pulse-dot 1s ease-in-out infinite" }}
        />
        Recording
      </div>
    </>
  );
}

interface ClipResult {
  blob: Blob;
  mime: string;
}

function createRecorder(stream: MediaStream): MediaRecorder | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  const chosen = candidates.find((m) => {
    try {
      return MediaRecorder.isTypeSupported(m);
    } catch {
      return false;
    }
  });
  try {
    return chosen
      ? new MediaRecorder(stream, { mimeType: chosen })
      : new MediaRecorder(stream);
  } catch {
    return null;
  }
}

function collectClip(recorder: MediaRecorder): Promise<ClipResult> {
  return new Promise((resolve, reject) => {
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onerror = (e) =>
      reject((e as ErrorEvent).error ?? new Error("Recorder error"));
    recorder.onstop = () => {
      const mime = recorder.mimeType || "video/webm";
      resolve({ blob: new Blob(chunks, { type: mime }), mime });
    };
    recorder.start();
    setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, CLIP_DURATION_MS);
  });
}

async function captureFrames(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): Promise<Blob[]> {
  const frames: Blob[] = [];
  const start = performance.now();
  for (const target of FRAME_TIMES_MS) {
    const wait = target - (performance.now() - start);
    if (wait > 0) await sleep(wait);
    const frame = await snapshot(video, canvas);
    if (frame) frames.push(frame);
  }
  return frames;
}

function snapshot(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (!video.videoWidth || !video.videoHeight) {
      resolve(null);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(null);
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function ModeChip({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition sm:flex-none ${
        active
          ? "bg-laurel text-cream"
          : "text-foreground/70 hover:text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ScreenIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19V8a2 2 0 0 0-2-2h-3.17l-1.84-2H8.01l-1.84 2H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function detectDefaultMode(): CaptureMode {
  if (typeof window === "undefined") return "screen";
  const ua = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  return isMobile ? "camera" : "screen";
}
