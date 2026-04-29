import Link from "next/link";

export const metadata = {
  title: "About — Laurel",
  description: "How Laurel works: stack, demo scenarios, and hackathon credits.",
};

export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <header className="mb-8">
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.2em] text-muted hover:text-accent"
          >
            ← Laurel
          </Link>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">About Laurel</h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            An Olympic and Paralympic moment explainer powered by Gemini, built for
            the GCP × Team USA Hackathon 2026.
          </p>
        </header>

        <Section title="What it does">
          <p className="text-sm leading-relaxed text-foreground">
            Capture a frame from your TV with your phone, and Laurel explains what
            just happened, the rule behind it, and why it matters. Conversational
            follow-ups via text or voice. Sharable links with rich previews.
            Olympic and Paralympic content treated as equals (3 sports each in the
            MVP).
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
          <pre className="overflow-x-auto rounded-lg border border-border bg-background p-4 font-mono text-[11px] leading-relaxed text-foreground">
            {ARCHITECTURE}
          </pre>
        </Section>

        <Section title="Sport coverage (MVP)">
          <p className="mb-3 text-sm text-muted">
            Six curated sports, balanced 3:3 between Olympic and Paralympic.
          </p>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            <SportItem name="Figure Skating" type="Olympic · Winter" />
            <SportItem name="Curling" type="Olympic · Winter" />
            <SportItem name="Athletics" type="Olympic · Summer" />
            <SportItem name="Wheelchair Curling" type="Paralympic · Winter" />
            <SportItem name="Para Alpine Skiing" type="Paralympic · Winter" />
            <SportItem name="Para Athletics" type="Paralympic · Summer" />
          </ul>
        </Section>

        <Section title="Credits">
          <p className="text-sm leading-relaxed text-foreground">
            Built for the{" "}
            <a
              href="https://vibecodeforgoldwithgoogle.devpost.com/"
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Team USA × Google Cloud Hackathon 2026
            </a>
            . Apache 2.0 licensed at{" "}
            <a
              href="https://github.com/dawsonpar/laurel"
              className="text-accent hover:underline"
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
      <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-muted">
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
    <div className="mb-3 rounded-lg border border-border bg-background p-4 last:mb-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function StackItem({ label, value }: { label: string; value: string }) {
  return (
    <li className="rounded-md border border-border bg-background px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <p className="text-sm text-foreground">{value}</p>
    </li>
  );
}

function SportItem({ name, type }: { name: string; type: string }) {
  return (
    <li className="rounded-md border border-border bg-background px-3 py-2">
      <p className="text-sm font-medium text-foreground">{name}</p>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {type}
      </p>
    </li>
  );
}

const ARCHITECTURE = `[Phone Camera / File] -> [Next.js client (Vercel)]
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
