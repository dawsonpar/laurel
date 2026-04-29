"use client";

import { useState } from "react";

import { saveMoment } from "@/lib/api";

interface ShareControlsProps {
  momentId: string;
  image: Blob;
  explanation: string;
  sportSlug: string | null;
  sportName: string | null;
  momentSummary: string;
}

export function ShareControls({
  momentId,
  image,
  explanation,
  sportSlug,
  sportName,
  momentSummary,
}: ShareControlsProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await saveMoment({
        momentId,
        image,
        explanation,
        sportSlug,
        sportName,
        momentSummary,
      });
      const url = `${window.location.origin}${result.share_path}`;
      setShareUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback handled by anchor selection
    }
  };

  const nativeShare = async () => {
    if (!shareUrl) return;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Laurel — what just happened",
          text: explanation.slice(0, 140),
          url: shareUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      copy();
    }
  };

  if (!shareUrl) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={generate}
          disabled={saving}
          className="rounded-md border border-border bg-background px-4 py-2 text-sm hover:border-accent disabled:opacity-50"
        >
          {saving ? "Saving..." : "Generate share link"}
        </button>
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-background p-3">
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={shareUrl}
          className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
          onFocus={(e) => e.currentTarget.select()}
        />
        <button
          type="button"
          onClick={copy}
          className="rounded border border-border bg-background px-3 py-1 text-xs hover:border-accent"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={nativeShare}
          className="rounded border border-border bg-background px-3 py-1 text-xs hover:border-accent"
        >
          Share
        </button>
      </div>
    </div>
  );
}
