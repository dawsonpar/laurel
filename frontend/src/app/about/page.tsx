import Link from "next/link";

import { LaurelMark } from "@/components/LaurelMark";

export const metadata = {
  title: "About — Laurel",
  description: "How Laurel works: stack, demo scenarios, and hackathon credits.",
};

export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted transition hover:text-laurel"
          >
            <span className="text-laurel">
              <LaurelMark size={20} />
            </span>
            Laurel
          </Link>
        </header>

        <div className="laurel-fade-up mb-10">
          <h1 className="font-serif text-5xl font-medium tracking-tight">
            About Laurel
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            An Olympic and Paralympic moment explainer powered by Gemini. Built
            for the Team USA × Google Cloud Hackathon 2026.
          </p>
        </div>

        <Section title="What it does">
          <p className="text-sm leading-relaxed text-foreground">
            Capture a frame from your TV with your phone, or share your screen
            on a laptop, and Laurel explains what just happened, the rule
            behind it, and why it matters. Conversational follow-ups via text or
            voice. Sharable links with rich previews. Olympic and Paralympic
            content treated as equals (3 sports each in the MVP).
          </p>
        </Section>

        <Section title="Two demo scenarios">
          <ScenarioCard
            label="Scenario A"
            title="Judge ruling negates the highlight"
            body="Friends watching together, big moment is overturned by a judge call, group is confused. One pulls out their phone, captures the frame, gets a clear rule-based explanation in seconds."
          />
          <ScenarioCard
            label="Scenario B"
            title="Was that a big deal?"
            body="A world record falls. The user captures it, asks for significance, gets historical context with concrete past records and a sharable link to text the family group chat."
          />
        </Section>

        <Section title="Stack">
          <ul className="grid gap-2 text-sm text-foreground sm:grid-cols-2">
            <StackItem label="Frontend" value="Next.js 16, React 19, Tailwind 4" />
            <StackItem label="Hosting" value="Vercel" />
            <StackItem label="Backend" value="FastAPI, Python 3.12, uv" />
            <StackItem label="Container" value="Google Cloud Run" />
            <StackItem label="AI" value="Gemini 2.5 Flash via Vertex AI" />
            <StackItem label="Embeddings" value="text-embedding-005" />
            <StackItem label="Storage" value="Cloud Storage + Firestore" />
            <StackItem label="Voice" value="Web Speech API (browser-native)" />
          </ul>
        </Section>

        <Section title="Architecture">
          <pre className="overflow-x-auto rounded-2xl border border-border bg-background p-4 font-mono text-[11px] leading-relaxed text-foreground">
            {ARCHITECTURE}
          </pre>
        </Section>

        <Section title="Sport coverage (MVP)">
          <p className="mb-3 text-sm text-muted">
            Six curated sports, balanced 3:3 between Olympic and Paralympic.
          </p>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            <SportItem name="Figure Skating" type="Olympic · Winter" tone="laurel" />
            <SportItem name="Curling" type="Olympic · Winter" tone="laurel" />
            <SportItem name="Athletics" type="Olympic · Summer" tone="laurel" />
            <SportItem name="Wheelchair Curling" type="Paralympic · Winter" tone="gold" />
            <SportItem name="Para Alpine Skiing" type="Paralympic · Winter" tone="gold" />
            <SportItem name="Para Athletics" type="Paralympic · Summer" tone="gold" />
          </ul>
        </Section>

        <Section title="Credits">
          <p className="text-sm leading-relaxed text-foreground">
            Built for the{" "}
            <a
              href="https://vibecodeforgoldwithgoogle.devpost.com/"
              className="text-laurel hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Team USA × Google Cloud Hackathon 2026
            </a>
            . Apache 2.0 licensed at{" "}
            <a
              href="https://github.com/dawsonpar/laurel"
              className="text-laurel hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/dawsonpar/laurel
            </a>
            .
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ScenarioCard({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mb-3 rounded-2xl border border-border bg-background p-4 last:mb-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold-deep">
        {label}
      </p>
      <p className="mt-1 font-serif text-xl font-medium text-foreground">
        {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function StackItem({ label, value }: { label: string; value: string }) {
  return (
    <li className="rounded-2xl border border-border bg-background px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <p className="text-sm text-foreground">{value}</p>
    </li>
  );
}

function SportItem({
  name,
  type,
  tone,
}: {
  name: string;
  type: string;
  tone: "laurel" | "gold";
}) {
  const toneClass = tone === "laurel" ? "text-laurel" : "text-gold-deep";
  return (
    <li className="rounded-2xl border border-border bg-background px-4 py-3">
      <p className="font-serif text-base font-medium text-foreground">{name}</p>
      <p
        className={`font-mono text-[10px] uppercase tracking-[0.18em] ${toneClass}`}
      >
        {type}
      </p>
    </li>
  );
}

const ARCHITECTURE = `[Phone Camera / Laptop Screen Share / File] -> [Next.js client (Vercel)]
                                |
                                v
                  [FastAPI on Cloud Run]
                        |
                        +--> [Gemini 2.5 Flash Vision]  (sport ID)
                        |
                        +--> [In-memory vector index]   (KB chunks)
                        |
                        +--> [Gemini 2.5 Flash text]    (synthesis, SSE)
                        |
                        +--> [Cloud Storage]            (frames)
                        |
                        +--> [Firestore]                (moment metadata)
                                |
                                v
                  [Next.js client renders explainer]`;
