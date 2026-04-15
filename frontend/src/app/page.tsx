"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudArrowUp,
  ArrowRight,
  FilePdf,
  X,
  WarningCircle,
} from "@phosphor-icons/react";

/* ─── Copy ─── */
const COPY = {
  eyebrow: "PDF Intelligence",
  headline: "Talk to your documents",
  subhead: "Drop a PDF here or browse your files",
  dragOver: "Drop your PDF",
  browseButton: "Browse files",
  uploadButton: "Upload and start chatting",
  uploadButtonLoading: "Uploading...",
  fileConstraint: "PDF files up to 20 MB",
  removeLabel: "Remove file",
  stateUploading: "Uploading...",
  stateProcessing: "Reading your document...",
} as const;

const ERRORS = {
  nonPdf: "This file isn't a PDF. Please upload a PDF document.",
  tooLarge: "This file is over 20 MB. Try a smaller PDF.",
  server: "Something went wrong. Please try again.",
  uploadFailed: "Upload failed. Check your connection and try again.",
} as const;

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/* ─── Motion presets ─── */
const softEase = [0.32, 0.72, 0, 1] as const;
const entryEase = [0.16, 1, 0.3, 1] as const;

const scrollEntry = {
  hidden: { opacity: 0, y: 64, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: entryEase },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const springConfig = { type: "spring" as const, stiffness: 120, damping: 20 };

/* ─── Helpers ─── */
function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

/* ─── Page ─── */
export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  const showError = useCallback((message: string) => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    setError(message);
    errorTimeoutRef.current = setTimeout(() => setError(null), 8000);
  }, []);

  const validateFile = useCallback(
    (f: File): boolean => {
      if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
        showError(ERRORS.nonPdf);
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        showError(ERRORS.tooLarge);
        return false;
      }
      return true;
    },
    [showError]
  );

  const handleFile = useCallback(
    (f: File) => {
      setError(null);
      if (validateFile(f)) setFile(f);
    },
    [validateFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) handleFile(selected);
    },
    [handleFile]
  );

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setError(null);
    setUploadProgress(0);
    setUploadStatus("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file || isUploading) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    setUploadStatus(COPY.stateUploading);

    // Simulate progress stages
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        showError(data?.error || ERRORS.server);
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStatus("");
        return;
      }

      setUploadProgress(100);
      setUploadStatus(COPY.stateProcessing);

      const data = await response.json();
      router.push(
        `/chat?sessionId=${encodeURIComponent(data.sessionId)}&filename=${encodeURIComponent(data.filename)}`
      );
    } catch {
      clearInterval(progressInterval);
      showError(ERRORS.uploadFailed);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus("");
    }
  }, [file, isUploading, router, showError]);

  return (
    <main className="min-h-[100dvh] flex items-center">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[1400px] mx-auto px-8 md:px-12 py-16 md:py-32 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12"
      >
        {/* ─── Left column: text ─── */}
        <motion.div
          variants={scrollEntry}
          className="md:col-span-5 flex flex-col justify-center gap-6"
        >
          {/* Eyebrow tag */}
          <span className="inline-flex items-center w-max rounded-full bg-accent-soft px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-accent">
            {COPY.eyebrow}
          </span>

          {/* Display heading */}
          <h1 className="text-[36px] md:text-[56px] font-bold leading-none tracking-tighter text-text-1">
            {COPY.headline}
          </h1>

          {/* Subtext */}
          <p className="text-base leading-relaxed text-text-2 max-w-[50ch]">
            {COPY.subhead}
          </p>

          {/* File constraint hint */}
          <p className="text-xs font-medium text-text-3 tracking-wide">
            {COPY.fileConstraint}
          </p>
        </motion.div>

        {/* ─── Right column: DropZone ─── */}
        <motion.div
          variants={scrollEntry}
          className="md:col-span-7 flex flex-col gap-6"
        >
          {/* Double-Bezel DropZone */}
          <motion.div
            animate={
              isDragging
                ? { scale: 1.02 }
                : { scale: [1, 1.005, 1] }
            }
            transition={
              isDragging
                ? springConfig
                : { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }
            className={`
              rounded-[2rem] p-2 ring-1 transition-colors duration-500
              ${isDragging ? "bg-accent-soft ring-accent" : "bg-shell ring-black/5"}
              ${error ? "ring-destructive" : ""}
            `}
            style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
          >
            {/* Inner Core */}
            <div
              role="button"
              tabIndex={0}
              aria-label="PDF upload area. Drag and drop a PDF file or click to browse."
              onClick={() => !isUploading && fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !isUploading) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                bg-white rounded-[calc(2rem-0.5rem)] p-8 md:p-10
                shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]
                flex flex-col items-center justify-center gap-4 text-center
                cursor-pointer min-h-[320px]
                transition-colors duration-500
                focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent
                ${isDragging ? "bg-accent-soft/30" : ""}
              `}
              style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
            >
              {/* Upload icon */}
              <motion.div
                animate={isDragging ? { y: -4 } : { y: 0 }}
                transition={springConfig}
              >
                <CloudArrowUp
                  size={64}
                  weight="light"
                  className={`transition-colors duration-300 ${
                    isDragging ? "text-accent" : "text-text-3"
                  }`}
                />
              </motion.div>

              {/* Drop label */}
              <p className="text-base font-medium text-text-1">
                {isDragging ? COPY.dragOver : "Drop your PDF here"}
              </p>

              {/* Helper text */}
              <p className="text-sm text-text-3">
                {COPY.fileConstraint}
              </p>

              {/* Divider */}
              <div className="flex items-center gap-4 w-full max-w-[280px]">
                <div className="flex-1 h-px bg-black/5" />
                <span className="text-xs text-text-3">or</span>
                <div className="flex-1 h-px bg-black/5" />
              </div>

              {/* Button-in-Button: Browse files */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="group inline-flex items-center gap-3 bg-accent text-on-accent rounded-full px-6 py-3 text-sm font-medium transition-colors duration-300 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
                type="button"
              >
                {COPY.browseButton}
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black/10 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105"
                  style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
                >
                  <ArrowRight size={16} weight="bold" className="text-on-accent" />
                </span>
              </motion.button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleInputChange}
              className="hidden"
              aria-hidden="true"
            />
          </motion.div>

          {/* ─── File selected / Upload progress ─── */}
          <AnimatePresence mode="wait">
            {file && !isUploading && (
              <motion.div
                key="file-info"
                initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.5, ease: softEase }}
                className="rounded-[2rem] p-2 bg-shell ring-1 ring-black/5"
              >
                <div className="bg-white rounded-[calc(2rem-0.5rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] px-6 py-4 flex items-center gap-4">
                  <FilePdf size={24} weight="duotone" className="text-destructive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-1 truncate">{file.name}</p>
                    <p className="text-xs text-text-3">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    aria-label={COPY.removeLabel}
                    className="shrink-0 text-text-3 hover:text-destructive transition-colors duration-200"
                  >
                    <X size={18} weight="regular" />
                  </button>
                </div>
              </motion.div>
            )}

            {file && isUploading && (
              <motion.div
                key="upload-progress"
                initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: softEase }}
                className="rounded-[2rem] p-2 bg-shell ring-1 ring-black/5"
              >
                <div className="bg-white rounded-[calc(2rem-0.5rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] px-6 py-5 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <FilePdf size={24} weight="duotone" className="text-destructive shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-1 truncate">{file.name}</p>
                      <p className="text-xs text-text-3">{uploadStatus}</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-shell overflow-hidden progress-bar-shimmer">
                    <motion.div
                      className="h-full rounded-full bg-accent"
                      initial={{ width: "0%" }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ type: "spring", stiffness: 80, damping: 25 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Upload CTA (Button-in-Button) ─── */}
          {file && !isUploading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: softEase }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpload}
                disabled={isUploading}
                className="group inline-flex items-center gap-3 bg-accent text-on-accent rounded-full px-6 py-3 text-sm font-medium transition-colors duration-300 hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
              >
                {COPY.uploadButton}
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black/10 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105"
                  style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
                >
                  <ArrowRight size={16} weight="bold" className="text-on-accent" />
                </span>
              </motion.button>
            </motion.div>
          )}

          {/* ─── Error message ─── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: 0 }}
                animate={{
                  opacity: 1,
                  x: [0, -4, 4, -2, 0],
                }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: softEase }}
                role="alert"
                className="rounded-[2rem] p-2 bg-destructive-bg ring-1 ring-destructive/10"
              >
                <div className="bg-white rounded-[calc(2rem-0.5rem)] px-6 py-4 flex items-center gap-3">
                  <WarningCircle size={20} weight="fill" className="text-destructive shrink-0" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </main>
  );
}
