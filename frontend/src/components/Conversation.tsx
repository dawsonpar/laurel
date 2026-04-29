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

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const question = draft.trim();
    if (!question || streaming) return;

    const newTurns: Turn[] = [
      ...turns,
      { role: "user", content: question },
      { role: "assistant", content: "" },
    ];
    setTurns(newTurns);
    setDraft("");
    setStreaming(true);
    setError(null);

    const history: Turn[] = turns; // history is what came before this question
    const stream = openFollowUpStream({
      momentId,
      question,
      history,
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {turns.slice(1).map((turn, i) => (
          <div
            key={i}
            className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${
              turn.role === "user"
                ? "border-accent/30 bg-accent/5 self-end max-w-[85%] text-foreground"
                : "border-border bg-background text-foreground"
            }`}
          >
            {turn.content || (
              <span className="text-muted">Thinking...</span>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-md border border-border bg-background px-3 py-2 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a follow-up. eg, was that a record?"
          disabled={streaming}
          className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <VoiceInput
          onTranscript={(text) => setDraft(text)}
          disabled={streaming}
        />
        <button
          type="submit"
          disabled={streaming || !draft.trim()}
          className="h-10 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
