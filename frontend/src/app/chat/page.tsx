"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FilePdf,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { fetchSSE, type SSEChunk } from "@/lib/sse";
import { EmptyState } from "@/components/EmptyState";

const COPY = {
  backLink: "Upload new",
  inputPlaceholder: "Ask a question...",
  sendLabel: "Send",
  sendDisabledLabel: "Send message (waiting for response)",
  ariaMessages: "Conversation with AI about your document",
  ariaBack: "Go back to upload a new document",
  streamingAriaLabel: "AI is responding...",
  completeAriaLabel: "Response complete",
  emptyMessage: "Type a question before sending.",
  streamInterrupted: "The response was interrupted. Send your question again.",
} as const;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const AUTO_SCROLL_THRESHOLD = 100;

interface Message {
  role: "user" | "assistant";
  content: string;
}

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const filename = searchParams.get("filename") || "Document";

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingFirstToken, setIsWaitingFirstToken] = useState(false);

  // Redirect if no sessionId
  useEffect(() => {
    if (!sessionId) {
      router.replace("/");
    }
  }, [sessionId, router]);

  // Abort in-flight SSE fetch on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const isNearBottom = useCallback(() => {
    const area = messageAreaRef.current;
    if (!area) return true;
    return area.scrollHeight - area.scrollTop - area.clientHeight < AUTO_SCROLL_THRESHOLD;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isNearBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !sessionId || isStreaming) return;

      const userMessage: Message = { role: "user", content: text.trim() };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsStreaming(true);
      setIsWaitingFirstToken(true);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      const assistantMessage: Message = { role: "assistant", content: "" };
      setMessages([...updatedMessages, assistantMessage]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Build history for API (exclude the current empty assistant message)
      const history = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      await fetchSSE({
        url: `${API_BASE}/api/chat`,
        body: {
          sessionId,
          message: text.trim(),
          history: history.slice(0, -1), // Exclude the latest user message (sent separately)
        },
        signal: controller.signal,
        onChunk: (chunk: SSEChunk) => {
          setIsWaitingFirstToken(false);
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                content: last.content + chunk.content,
              };
            }
            return updated;
          });
          scrollToBottom();
        },
        onDone: () => {
          setIsStreaming(false);
          setIsWaitingFirstToken(false);
          abortControllerRef.current = null;
          scrollToBottom();
        },
        onError: (err) => {
          setIsStreaming(false);
          setIsWaitingFirstToken(false);
          abortControllerRef.current = null;
          // Add error as assistant message
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant" && !last.content) {
              updated[updated.length - 1] = {
                ...last,
                content: err.message || COPY.streamInterrupted,
              };
            }
            return updated;
          });
        },
      });
    },
    [sessionId, messages, isStreaming, scrollToBottom]
  );

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(input);
  }, [input, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      // Auto-grow
      const el = e.target;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    },
    []
  );

  // Scroll on messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  if (!sessionId) return null;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface border-b border-border px-spacing-4 md:px-spacing-6 py-spacing-3 flex items-center justify-between gap-spacing-4">
        <Link
          href="/"
          aria-label={COPY.ariaBack}
          className="flex items-center gap-spacing-2 text-[14px] leading-[1.5] text-tertiary hover:text-primary transition-colors duration-150 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft size={20} weight="regular" />
          <span className="hidden md:inline">{COPY.backLink}</span>
        </Link>
        <div className="flex items-center gap-spacing-2 min-w-0">
          <FilePdf size={20} weight="duotone" className="text-destructive shrink-0" />
          <h2 className="text-[22px] font-semibold leading-[1.3] tracking-[-0.015em] text-primary truncate">
            {filename}
          </h2>
        </div>
        {/* Spacer to balance the header */}
        <div className="w-[70px] shrink-0 hidden md:block" aria-hidden="true" />
      </header>

      {/* Message area */}
      <div
        ref={messageAreaRef}
        className="flex-1 overflow-y-auto chat-scrollbar"
        aria-label={COPY.ariaMessages}
        role="log"
        aria-live="polite"
      >
        <div className="max-w-[768px] mx-auto px-spacing-4 md:px-spacing-6 py-spacing-6">
          {messages.length === 0 ? (
            <EmptyState filename={filename} onSelectChip={sendMessage} />
          ) : (
            <div className="flex flex-col gap-spacing-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "user" ? (
                    <div className="max-w-[85%] md:max-w-[70%] bg-surface-alt text-primary rounded-md px-spacing-4 py-spacing-3 text-[16px] leading-[1.65]">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="max-w-[85%] md:max-w-[70%] bg-surface text-secondary border border-border rounded-md px-spacing-4 py-spacing-3 text-[16px] leading-[1.65]">
                      {msg.content}
                      {isStreaming && i === messages.length - 1 && (
                        <>
                          <span
                            className="streaming-cursor"
                            aria-hidden="true"
                          />
                          <span className="sr-only">
                            {COPY.streamingAriaLabel}
                          </span>
                        </>
                      )}
                      {isWaitingFirstToken && i === messages.length - 1 && !msg.content && (
                        <div className="dot-pulse flex gap-spacing-1" aria-label={COPY.streamingAriaLabel}>
                          <span />
                          <span />
                          <span />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="sticky bottom-0 bg-surface border-t border-border px-spacing-4 md:px-spacing-6 py-spacing-4">
        <div className="max-w-[768px] mx-auto flex items-end gap-spacing-3">
          <label htmlFor="chat-input" className="sr-only">
            Ask a question about your document
          </label>
          <textarea
            id="chat-input"
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={COPY.inputPlaceholder}
            disabled={isStreaming}
            rows={1}
            className="flex-1 resize-none bg-surface text-primary border border-border rounded-sm px-spacing-4 py-spacing-2 text-[16px] leading-[1.65] placeholder:text-tertiary transition-colors duration-150 focus:border-border-active focus:outline-none disabled:opacity-60"
          />
          <button
            onClick={handleSubmit}
            disabled={isStreaming || !input.trim()}
            aria-label={isStreaming ? COPY.sendDisabledLabel : COPY.sendLabel}
            className="shrink-0 bg-accent text-on-primary rounded-sm p-spacing-2 transition-all duration-200 hover:bg-accent-hover active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <PaperPlaneTilt
              size={20}
              weight={isStreaming || !input.trim() ? "light" : "fill"}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageContent />
    </Suspense>
  );
}
