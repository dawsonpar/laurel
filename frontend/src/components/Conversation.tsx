"use client";

import { useState } from "react";

import { openFollowUpStream } from "@/lib/followUpStream";

import { VoiceInput } from "./VoiceInput";

interface ConversationProps {
  momentId: string;
  sportSlug: string | null;
  sportName: string | null;
  momentSummary: string;
  initialAnswer: string;
}

interface Turn {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_FOLLOWUPS = [
  "What's the rule?",
  "Why does this matter?",
  "Is this rare?",
];

export function Conversation({
  momentId,
  sportSlug,
  sportName,
  momentSummary,
  initialAnswer,
}: ConversationProps) {
  const [turns, setTurns] = useState<Turn[]>([
    { role: "assistant", content: initialAnswer },
  ]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async (question: string) => {
    const cleaned = question.trim();
    if (!cleaned || streaming) return;

    const historySnapshot: Turn[] = turns;
    setTurns([
      ...turns,
      { role: "user", content: cleaned },
      { role: "assistant", content: "" },
    ]);
    setDraft("");
    setStreaming(true);
    setError(null);

    const stream = openFollowUpStream({
      momentId,
      question: cleaned,
      history: historySnapshot,
      sportSlug,
      sportName,
      momentSummary,
    });

    for await (const event of stream) {
      if (event.type === "token") {
        setTurns((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last.role === "assistant") {
            next[next.length - 1] = { ...last, content: last.content + event.text };
          }
          return next;
        });
      } else if (event.type === "error") {
        setError(event.message);
        break;
      }
    }
    setStreaming(false);
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    return ask(draft);
  };

  // Hide the starter chips once the conversation has any user turn.
  const showSuggestions = !turns.some((t) => t.role === "user");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {turns.slice(1).map((turn, i) => (
          <div
            key={i}
            className={`laurel-fade-up rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
              turn.role === "user"
                ? "self-end max-w-[85%] border-laurel/30 bg-laurel/[0.04] text-foreground"
                : "border-border bg-background text-foreground"
            }`}
          >
            {turn.content || <span className="text-muted">Thinking...</span>}
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-2xl border border-border bg-background px-4 py-3 text-xs text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      {showSuggestions && (
        <div className="laurel-fade-up flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
            Try asking
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_FOLLOWUPS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => ask(suggestion)}
                disabled={streaming}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground transition hover:border-laurel hover:text-laurel disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a follow-up. eg, was that a record?"
          disabled={streaming}
          className="h-11 flex-1 rounded-full border border-border bg-background px-5 text-sm text-foreground placeholder:text-muted focus:border-laurel focus:outline-none"
        />
        <VoiceInput
          onTranscript={(text) => setDraft(text)}
          disabled={streaming}
        />
        <button
          type="submit"
          disabled={streaming || !draft.trim()}
          className="h-11 rounded-full bg-laurel px-5 text-sm font-medium text-cream transition hover:bg-laurel-deep disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
