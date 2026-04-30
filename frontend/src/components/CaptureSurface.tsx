"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { LaurelMark } from "@/components/LaurelMark";

type CaptureMode = "screen" | "camera";

interface CaptureSurfaceProps {
  onCapture: (blob: Blob) => void;
  /** Override the default mode. Auto-detected by form factor when omitted. */
  defaultMode?: CaptureMode;
}

export function CaptureSurface({ onCapture, defaultMode }: CaptureSurfaceProps) {
  const [mode, setMode] = useState<CaptureMode>(defaultMode ?? detectDefaultMode());
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Attach the stream to the video element after both exist. Setting srcObject
  // synchronously inside startStream runs before React renders the video tag.
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

  // Always stop the stream on unmount.
  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  // If the user switches modes while a stream is live, kill it.
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

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture(blob);
          stopStream();
        }
      },
      "image/jpeg",
      0.85,
    );
  };

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onCapture(file);
  };

  const isLive = !!stream;

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
        {/* Video tag is always mounted so the ref is stable. We hide it when
            no stream is active to avoid showing an empty black box without
            a clear message. */}
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
            onClick={capture}
            className="flex-1 rounded-full bg-gradient-to-r from-laurel via-gold to-laurel bg-[length:200%_100%] px-5 py-3 text-sm font-medium text-cream transition hover:bg-[length:300%_100%]"
            style={{ animation: "laurel-shimmer 4s linear infinite" }}
          >
            Capture moment
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
