"use client";

import { Suspense, useCallback, useEffect, useRef, useState, memo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CaretLeft,
  FilePdf,
  ArrowUp,
} from "@phosphor-icons/react";
import { fetchSSE, type SSEChunk } from "@/lib/sse";
import { softEase, messageEntry, springConfig } from "@/lib/motion";
import { EmptyState } from "@/components/EmptyState";

/* ─── Copy ─── */
const COPY = {
  backLink: "Upload new",
  inputPlaceholder: "Ask a question...",
  sendLabel: "Send",
  sendDisabledLabel: "Send message (waiting for response)",
  ariaMessages: "Conversation with AI about your document",
  ariaBack: "Go back to upload a new document",
  streamingAriaLabel: "AI is responding...",
  completeAriaLabel: "Response complete",
  streamInterrupted: "The response was interrupted. Send your question again.",
} as const;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const AUTO_SCROLL_THRESHOLD = 100;

/* ─── Avatar dot with breathing pulse ─── */
const AvatarDot = memo(function AvatarDot() {
  return (
    <motion.div
      aria-hidden="true"
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="w-3 h-3 rounded-full bg-accent shrink-0 mt-1"
    />
  );
});

/* ─── Types ─── */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/* ─── Chat content ─── */
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

  useEffect(() => {
    if (!sessionId) router.replace("/");
  }, [sessionId, router]);

  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
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

      const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: text.trim() };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsStreaming(true);
      setIsWaitingFirstToken(true);

      if (textareaRef.current) textareaRef.current.style.height = "auto";

      const assistantMessage: Message = { id: crypto.randomUUID(), role: "assistant", content: "" };
      setMessages([...updatedMessages, assistantMessage]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const history = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      await fetchSSE({
        url: `${API_BASE}/api/chat`,
        body: {
          sessionId,
          message: text.trim(),
          history: history.slice(0, -1),
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
      const el = e.target;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    },
    []
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  if (!sessionId) return null;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg">
      {/* ─── ChatHeader: Double-Bezel, sticky, glass ─── */}
      <header className="sticky top-0 z-10 px-4 md:px-6 pt-3 pb-0">
        <div className="rounded-[2rem] p-1.5 bg-shell/80 ring-1 ring-black/5 backdrop-blur-xl">
          <div className="bg-white rounded-[calc(2rem-0.375rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] px-4 md:px-6 py-3">
            <div className="max-w-[1400px] mx-auto flex items-center gap-4">
              {/* Back button */}
              <Link
                href="/"
                aria-label={COPY.ariaBack}
                className="flex items-center justify-center w-10 h-10 rounded-full text-text-3 hover:text-text-1 hover:bg-shell transition-colors duration-300 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
              >
                <CaretLeft size={20} weight="regular" />
              </Link>

              {/* Document info */}
              <div className="flex items-center gap-3 min-w-0">
                <FilePdf size={20} weight="duotone" className="text-destructive shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-base font-semibold text-text-1 truncate tracking-tight">
                    {filename}
                  </h1>
                </div>
              </div>

              {/* Back link text (desktop) */}
              <Link
                href="/"
                className="ml-auto hidden md:inline-flex text-sm text-text-3 hover:text-text-1 transition-colors duration-300"
                style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
              >
                {COPY.backLink}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Message area ─── */}
      <div
        ref={messageAreaRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
        aria-label={COPY.ariaMessages}
        role="log"
        aria-live="polite"
      >
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
          {messages.length === 0 ? (
            <EmptyState filename={filename} onSelectChip={sendMessage} />
          ) : (
            <div className="flex flex-col gap-6">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    variants={messageEntry}
                    initial="hidden"
                    animate="visible"
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "user" ? (
                      /* ─── User bubble: single-layer, shell bg ─── */
                      <div className="max-w-[85%] md:max-w-[70%] bg-shell text-text-1 rounded-[1.5rem] px-5 py-3 text-base leading-relaxed ring-1 ring-black/5">
                        {msg.content}
                      </div>
                    ) : (
                      /* ─── AI bubble: Double-Bezel ─── */
                      <div className="flex gap-3 max-w-[85%] md:max-w-[75%]">
                        <AvatarDot />
                        <div className="rounded-[1.5rem] p-1.5 bg-shell ring-1 ring-black/5">
                          <div className="bg-white rounded-[calc(1.5rem-0.375rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] px-5 py-3">
                            <p className="text-base leading-relaxed text-text-2 whitespace-pre-wrap">
                              {msg.content}
                              {isStreaming && i === messages.length - 1 && msg.content && (
                                <>
                                  <span className="streaming-cursor" aria-hidden="true" />
                                  <span className="sr-only">{COPY.streamingAriaLabel}</span>
                                </>
                              )}
                            </p>
                            {/* Waiting state: skeleton shimmer */}
                            {isWaitingFirstToken && i === messages.length - 1 && !msg.content && (
                              <div className="flex flex-col gap-2" aria-label={COPY.streamingAriaLabel}>
                                <div className="h-4 w-3/4 rounded-full skeleton-shimmer" />
                                <div className="h-4 w-1/2 rounded-full skeleton-shimmer" />
                              </div>
                            )}
                            {/* Completion SR announcement */}
                            {!isStreaming && i === messages.length - 1 && msg.content && (
                              <span className="sr-only">{COPY.completeAriaLabel}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* ─── InputBar: Double-Bezel, fixed bottom ─── */}
      <div className="sticky bottom-0 px-4 md:px-6 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-[2rem] p-2 bg-shell ring-1 ring-black/5 transition-all duration-300"
            style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
          >
            <div className="bg-white rounded-[calc(2rem-0.5rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex items-end gap-3 px-5 py-3">
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
                className="flex-1 resize-none bg-transparent text-text-1 text-base leading-relaxed placeholder:text-text-3 focus:outline-none disabled:opacity-60"
              />
              {/* SendButton: Button-in-Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={springConfig}
                onClick={handleSubmit}
                disabled={isStreaming || !input.trim()}
                aria-label={isStreaming ? COPY.sendDisabledLabel : COPY.sendLabel}
                className="group shrink-0 flex items-center justify-center bg-accent text-on-accent rounded-full p-2.5 transition-colors duration-300 hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
              >
                <span className="flex items-center justify-center w-5 h-5">
                  <ArrowUp size={20} weight="bold" className="text-on-accent" />
                </span>
              </motion.button>
            </div>
          </div>
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
