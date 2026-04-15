"use client";

import { ChatTeardrop } from "@phosphor-icons/react";

const COPY = {
  title: "Ask anything about this document",
  subtext: "Get summaries, find specific info, or ask follow-up questions.",
  chips: [
    "Summarize this document",
    "What are the key points?",
    "Extract all dates and deadlines",
  ],
} as const;

interface EmptyStateProps {
  filename: string;
  onSelectChip: (question: string) => void;
}

export function EmptyState({ filename, onSelectChip }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-spacing-4 py-spacing-16 gap-spacing-3">
      <ChatTeardrop size={40} weight="light" className="text-tertiary" />
      <h3 className="text-[18px] font-semibold leading-[1.4] tracking-[-0.01em] text-primary">
        {COPY.title}
      </h3>
      <p className="text-[14px] leading-[1.5] text-tertiary max-w-[400px]">
        {COPY.subtext}
      </p>
      <p className="text-[12px] font-medium leading-[1.4] tracking-[0.02em] text-tertiary mt-spacing-1">
        {filename}
      </p>
      <div className="flex flex-wrap justify-center gap-spacing-2 mt-spacing-4">
        {COPY.chips.map((chip, i) => (
          <button
            key={chip}
            onClick={() => onSelectChip(chip)}
            className="text-[14px] leading-[1.5] text-secondary bg-surface-alt border border-border rounded-full px-spacing-4 py-spacing-2 transition-all duration-150 ease-in hover:border-accent hover:bg-surface active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            style={{
              animation: `chip-enter 300ms ease ${i * 100}ms both`,
            }}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
