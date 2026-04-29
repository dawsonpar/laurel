"use client";

import { useState } from "react";

interface SectionAccordionProps {
  sections: Array<{ title: string; content: string; defaultOpen?: boolean }>;
}

export function SectionAccordion({ sections }: SectionAccordionProps) {
  return (
    <div className="flex flex-col gap-3">
      {sections.map((section) => (
        <AccordionItem
          key={section.title}
          title={section.title}
          content={section.content}
          defaultOpen={section.defaultOpen}
        />
      ))}
    </div>
  );
}

function AccordionItem({
  title,
  content,
  defaultOpen = false,
}: {
  title: string;
  content: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between bg-background px-5 py-4 text-left transition hover:bg-border/30"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span
          className="text-muted transition-transform"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
          aria-hidden
        >
          +
        </span>
      </button>
      {open && (
        <div className="border-t border-border bg-background px-5 py-4">
          <div className="prose-sm whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}
