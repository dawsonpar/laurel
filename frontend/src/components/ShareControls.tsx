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
      // fallback: user can select the input
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
          className="self-start rounded-full border border-border bg-background px-5 py-2 text-sm text-foreground transition hover:border-gold hover:text-gold-deep disabled:opacity-50"
        >
          {saving ? "Saving..." : "Generate share link"}
        </button>
        {error && (
          <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="laurel-fade-up flex flex-col gap-2 rounded-2xl border border-border bg-background p-3">
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={shareUrl}
          className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground"
          onFocus={(e) => e.currentTarget.select()}
        />
        <button
          type="button"
          onClick={copy}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs hover:border-laurel"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={nativeShare}
          className="rounded-full bg-laurel px-3 py-1.5 text-xs text-cream hover:bg-laurel-deep"
        >
          Share
        </button>
      </div>
    </div>
  );
}
