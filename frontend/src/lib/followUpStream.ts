"use client";

import { BACKEND_URL } from "./api";

export type FollowUpEvent =
  | { type: "retrieval"; moment_id: string; chunks: unknown }
  | { type: "token"; text: string }
  | { type: "done"; moment_id: string }
  | { type: "error"; message: string };

export interface FollowUpRequest {
  momentId: string;
  question: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  sportSlug?: string | null;
  sportName?: string | null;
  momentSummary?: string;
  signal?: AbortSignal;
}

export async function* openFollowUpStream(
  req: FollowUpRequest,
): AsyncGenerator<FollowUpEvent, void, void> {
  let response: Response;
  try {
    response = await fetch(
      `${BACKEND_URL}/api/moments/${encodeURIComponent(req.momentId)}/follow-up`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: req.question,
          history: req.history,
          sport_slug: req.sportSlug ?? null,
          sport_name: req.sportName ?? null,
          moment_summary: req.momentSummary ?? "",
        }),
        signal: req.signal,
      },
    );
  } catch (err) {
    yield { type: "error", message: friendlyMessage(err) };
    return;
  }

  if (!response.ok || !response.body) {
    yield { type: "error", message: `Server returned ${response.status}` };
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

function parseSseEvent(raw: string): FollowUpEvent | null {
  let event = "message";
  let data = "";
  for (const line of raw.split("\n")) {
    if (line.startsWith("event: ")) event = line.slice(7).trim();
    else if (line.startsWith("data: ")) data += line.slice(6);
  }
  if (!data) return null;
  try {
    const payload = JSON.parse(data);
    return { type: event, ...payload } as FollowUpEvent;
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
