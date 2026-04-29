"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  disabled?: boolean;
}

export function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const stopStream = useCallback(() => {
    setStream((current) => {
      current?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  const startCamera = async () => {
    setError(null);
    setStarting(true);
    try {
      const next = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(next);
      if (videoRef.current) {
        videoRef.current.srcObject = next;
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not access camera.";
      setError(`${message}. Use the upload option below instead.`);
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

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-border bg-black sm:aspect-video">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-white/60">
            {starting ? "Starting camera..." : "Camera off"}
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {error && (
        <p className="rounded-md border border-border bg-background px-3 py-2 text-xs text-muted">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        {!stream ? (
          <button
            type="button"
            onClick={startCamera}
            disabled={disabled || starting}
            className="flex-1 rounded-md bg-accent px-4 py-3 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {starting ? "Starting..." : "Start camera"}
          </button>
        ) : (
          <button
            type="button"
            onClick={capture}
            disabled={disabled}
            className="flex-1 rounded-md bg-accent px-4 py-3 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            Capture moment
          </button>
        )}

        <label className="flex flex-1 cursor-pointer items-center justify-center rounded-md border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition hover:border-accent">
          Upload a screenshot
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFile}
            disabled={disabled}
          />
        </label>
      </div>
    </div>
  );
}
