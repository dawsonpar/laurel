"use client";

import { BACKEND_URL } from "./api";

export interface SupportedSport {
  slug: string;
  name: string;
  type: "Olympic" | "Paralympic";
  parity_pair: string | null;
}

export type ExplainEvent =
  | {
      type: "vision";
      moment_id: string;
      sport_slug: string | null;
      sport_name: string | null;
      moment_summary: string;
      confidence: number;
    }
  | {
      type: "retrieval";
      chunks: Array<{ chunk_id: string; section: string; score: number }>;
    }
  | { type: "token"; text: string }
  | { type: "done"; moment_id: string }
  | {
      type: "unsupported";
      moment_id: string;
      message: string;
      supported_sports: SupportedSport[];
    }
  | { type: "error"; message: string };

interface ExplainStreamOptions {
  /** One or more frames in chronological order. The backend treats them as a sequence. */
  images: Blob[];
  sportHint?: string;
  signal?: AbortSignal;
}

/**
 * Open a multipart POST to /api/explain and yield parsed SSE events.
 * EventSource cannot send multipart payloads, so we parse the SSE format
 * manually from the streaming response body.
 */
export async function* openExplainStream(
  opts: ExplainStreamOptions,
): AsyncGenerator<ExplainEvent, void, void> {
  if (opts.images.length === 0) {
    yield { type: "error", message: "No frames captured." };
    return;
  }
  const form = new FormData();
  opts.images.forEach((blob, i) => {
    form.append("images", blob, `frame-${i}.jpg`);
  });
  if (opts.sportHint) form.append("sport_hint", opts.sportHint);

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/explain`, {
      method: "POST",
      body: form,
      signal: opts.signal,
    });
  } catch (err) {
    yield { type: "error", message: friendlyMessage(err) };
    return;
  }

  if (!response.ok || !response.body) {
    yield {
      type: "error",
      message: `Server returned ${response.status}`,
    };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let separatorIndex = buffer.indexOf("\n\n");
      while (separatorIndex !== -1) {
        const rawEvent = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        const parsed = parseSseEvent(rawEvent);
        if (parsed) yield parsed;
        separatorIndex = buffer.indexOf("\n\n");
      }
    }
  } catch (err) {
    yield { type: "error", message: friendlyMessage(err) };
  }
}

function parseSseEvent(raw: string): ExplainEvent | null {
  let event = "message";
  let data = "";
  for (const line of raw.split("\n")) {
    if (line.startsWith("event: ")) event = line.slice(7).trim();
    else if (line.startsWith("data: ")) data += line.slice(6);
  }
  if (!data) return null;
  try {
    const payload = JSON.parse(data);
    return { type: event, ...payload } as ExplainEvent;
  } catch {
    return null;
  }
}

function friendlyMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "AbortError") return "Cancelled.";
    return err.message;
  }
  return "Something went wrong.";
}
