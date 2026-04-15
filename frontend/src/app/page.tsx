"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UploadSimple,
  FilePdf,
  X,
  Warning,
} from "@phosphor-icons/react";

const COPY = {
  headline: "Talk to your documents",
  subhead: "Drop a PDF here or browse your files",
  dragOver: "Drop your PDF",
  uploadButton: "Upload and start chatting",
  uploadButtonLoading: "Uploading...",
  fileConstraint: "PDF files up to 20 MB",
  removeLabel: "Remove file",
} as const;

const ERRORS = {
  nonPdf: "This file isn't a PDF. Please upload a PDF document.",
  tooLarge: "This file is over 20 MB. Try a smaller PDF.",
  server: "Something went wrong. Please try again.",
  uploadFailed: "Upload failed. Check your connection and try again.",
} as const;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean up error timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  const showError = useCallback((message: string) => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    setError(message);
    errorTimeoutRef.current = setTimeout(() => {
      setError(null);
    }, 8000);
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
      if (validateFile(f)) {
        setFile(f);
      }
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file || isUploading) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        showError(data?.error || ERRORS.server);
        setIsUploading(false);
        return;
      }

      const data = await response.json();
      router.push(
        `/chat?sessionId=${encodeURIComponent(data.sessionId)}&filename=${encodeURIComponent(data.filename)}`
      );
    } catch {
      showError(ERRORS.uploadFailed);
      setIsUploading(false);
    }
  }, [file, isUploading, router, showError]);

  return (
    <main className="min-h-[100dvh] grid place-items-center px-spacing-8 md:px-spacing-10">
      <div className="w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-spacing-6">
          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="PDF upload area. Drag and drop a PDF file or click to browse."
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              rounded-md p-spacing-8 md:p-spacing-12 cursor-pointer
              transition-all duration-150 ease-in
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring
              ${
                error
                  ? "border-2 border-solid border-destructive"
                  : isDragging
                    ? "border-2 border-solid border-border-active bg-accent/[0.04]"
                    : "border border-dashed border-border bg-transparent"
              }
            `}
          >
            <div className="flex flex-col gap-spacing-3">
              <UploadSimple
                size={48}
                weight={isDragging ? "regular" : "light"}
                className={`transition-all duration-200 ${
                  isDragging
                    ? "text-accent scale-105"
                    : "text-tertiary"
                }`}
              />
              <h1 className="text-[36px] font-bold leading-[1.1] tracking-[-0.025em] text-primary text-left">
                {isDragging ? COPY.dragOver : COPY.headline}
              </h1>
              <p className="text-[14px] leading-[1.5] text-tertiary">
                {COPY.subhead}
              </p>
              <p className="text-[12px] font-medium leading-[1.4] tracking-[0.02em] text-tertiary">
                {COPY.fileConstraint}
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleInputChange}
              className="hidden"
              aria-hidden="true"
            />
          </div>

          {/* File info */}
          {file && (
            <div
              className="flex items-center gap-spacing-3 px-spacing-4 py-spacing-3 rounded-sm bg-surface border border-border"
              aria-label={`${file.name} selected, ${formatFileSize(file.size)}`}
            >
              <FilePdf size={20} weight="duotone" className="text-destructive shrink-0" />
              <span className="text-[14px] leading-[1.5] text-primary truncate max-w-[280px]">
                {file.name}
              </span>
              <span className="text-[12px] font-medium leading-[1.4] tracking-[0.02em] text-tertiary shrink-0">
                {formatFileSize(file.size)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                aria-label={COPY.removeLabel}
                className="ml-auto shrink-0 text-tertiary hover:text-destructive transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <X size={16} weight="regular" />
              </button>
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="relative w-full md:w-auto md:self-start bg-accent text-on-primary text-[14px] font-medium leading-[1.4] tracking-[0.01em] rounded-sm px-spacing-6 py-spacing-3 transition-all duration-200 hover:bg-accent-hover active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {isUploading ? (
              <span className="flex flex-col items-center gap-spacing-2">
                <span className="sr-only">{COPY.uploadButtonLoading}</span>
                <span className="loading-bar w-[120px]" />
              </span>
            ) : (
              COPY.uploadButton
            )}
          </button>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="flex items-center gap-spacing-2 px-spacing-4 py-spacing-3 rounded-sm bg-destructive-bg animate-[fadeIn_200ms_ease]"
            >
              <Warning size={16} weight="fill" className="text-destructive shrink-0" />
              <span className="text-[12px] font-medium leading-[1.4] tracking-[0.02em] text-destructive">
                {error}
              </span>
            </div>
          )}
        </div>

        {/* Right column: intentional negative space (desktop only) */}
        <div className="hidden md:block" aria-hidden="true" />
      </div>
    </main>
  );
}
