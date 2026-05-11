import Link from "next/link";
import Image from "next/image";

import { LaurelMark } from "@/components/LaurelMark";

export const metadata = {
  title: "Demos — Laurel",
  description:
    "Two pre-loaded moments that show Laurel explaining a curling rule call and a Para Athletics world record.",
};

interface Scene {
  id: "a" | "b";
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  imageAlt: string;
  questions: string[];
}

const SCENES: Scene[] = [
  {
    id: "a",
    href: "/demo/a",
    eyebrow: "Scenario A · Curling",
    title: "The double-touch call",
    body: "A close final end. The broadcast flags a double-touch on the delivering stone. The viewer at home has no idea what just happened.",
    image: "/demo/scene-a.jpg",
    imageAlt:
      "Broadcast-style mockup of a curling sheet with a 'DOUBLE TOUCH, stone re-contact, under review' flag in the upper right.",
    questions: ["What is the double touch rule?"],
  },
  {
    id: "b",
    href: "/demo/b",
    eyebrow: "Scenario B · Para Athletics",
    title: "Long jump T64 world record",
    body: "Final attempt of the men's long jump T64. The jump lands beyond the previous best mark. Is this the longest jump ever, or something more specific?",
    image: "/demo/scene-b.jpg",
    imageAlt:
      "Broadcast-style mockup of a long jump runway and pit with a gold WORLD RECORD badge reading '8.74m, class T64.'",
    questions: [
      "What is the world record that was broken?",
      "How does it compare to the regular Olympics?",
      "Why does it matter?",
    ],
  },
];

export default function DemoIndexPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-3xl">
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
          <Link
            href="/capture"
            className="text-xs uppercase tracking-[0.2em] text-muted hover:text-laurel"
          >
            Or capture your own
          </Link>
        </header>

        <div className="laurel-fade-up mb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold-deep">
            Demos
          </p>
          <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
            See Laurel explain a moment.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            Each demo loads a self-produced broadcast mockup as the captured
            moment, then streams a grounded explanation. Tap a suggested
            question to keep going. Works on phone or desktop.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {SCENES.map((scene) => (
            <SceneCard key={scene.id} scene={scene} />
          ))}
        </div>

        <p className="mt-10 text-xs leading-relaxed text-muted">
          The two clips you see are produced from scratch, not Games footage.
          Athlete identities, broadcaster brands, and federation names have
          been intentionally removed for compliance with the hackathon rules.
        </p>
      </div>
    </main>
  );
}

function SceneCard({ scene }: { scene: Scene }) {
  return (
    <Link
      href={scene.href}
      className="laurel-fade-up group flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition hover:border-laurel hover:shadow-[0_18px_48px_-24px_rgba(31,77,58,0.4)]"
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={scene.image}
          alt={scene.imageAlt}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold-deep">
          {scene.eyebrow}
        </p>
        <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
          {scene.title}
        </h2>
        <p className="text-sm leading-relaxed text-muted">{scene.body}</p>
        <div className="mt-auto flex flex-col gap-1 border-t border-border pt-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
            You can ask
          </p>
          <ul className="flex flex-col gap-1 text-xs text-foreground">
            {scene.questions.map((q) => (
              <li key={q} className="before:mr-2 before:content-['—']">
                {q}
              </li>
            ))}
          </ul>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-laurel transition group-hover:translate-x-1">
          Open the demo →
        </p>
      </div>
    </Link>
  );
}
