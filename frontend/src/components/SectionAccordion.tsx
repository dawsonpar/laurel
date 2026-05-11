"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
    <div className="overflow-hidden rounded-2xl border border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between bg-background px-5 py-4 text-left transition hover:bg-cream"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span
          className="text-laurel transition-transform"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
          aria-hidden
        >
          +
        </span>
      </button>
      {open && (
        <div className="laurel-fade-up border-t border-border bg-background px-5 py-4">
          <div className="markdown-body text-sm leading-relaxed text-foreground">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="mb-3 last:mb-0">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic">{children}</em>
                ),
                ul: ({ children }) => (
                  <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0 marker:text-laurel">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0 marker:text-laurel">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                h1: ({ children }) => (
                  <h2 className="mb-2 mt-4 font-serif text-xl font-medium first:mt-0">
                    {children}
                  </h2>
                ),
                h2: ({ children }) => (
                  <h3 className="mb-2 mt-4 font-serif text-lg font-medium first:mt-0">
                    {children}
                  </h3>
                ),
                h3: ({ children }) => (
                  <h4 className="mb-2 mt-3 font-mono text-xs uppercase tracking-[0.2em] text-muted first:mt-0">
                    {children}
                  </h4>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    className="text-laurel underline-offset-2 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                code: ({ children }) => (
                  <code className="rounded bg-cream px-1 py-0.5 font-mono text-[0.85em] text-foreground">
                    {children}
                  </code>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-3 border-l-2 border-laurel/40 pl-3 italic text-muted">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
