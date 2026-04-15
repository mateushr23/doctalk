export interface SSEChunk {
  content: string;
  done: boolean;
}

export interface FetchSSEOptions {
  url: string;
  body: Record<string, unknown>;
  onChunk: (chunk: SSEChunk) => void;
  onDone: () => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

export async function fetchSSE({
  url,
  body,
  onChunk,
  onDone,
  onError,
  signal,
}: FetchSSEOptions): Promise<void> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message =
        errorData?.error || `Request failed with status ${response.status}`;
      onError(new Error(message));
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError(new Error("No response body"));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") {
          onDone();
          return;
        }

        try {
          const parsed: SSEChunk = JSON.parse(data);
          onChunk(parsed);

          if (parsed.done) {
            onDone();
            return;
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    // Process any remaining data in the buffer
    if (buffer.trim().startsWith("data:")) {
      const data = buffer.trim().slice(5).trim();
      if (data && data !== "[DONE]") {
        try {
          const parsed: SSEChunk = JSON.parse(data);
          onChunk(parsed);
        } catch {
          // Skip malformed final line
        }
      }
    }

    onDone();
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return;
    }
    onError(err instanceof Error ? err : new Error("Stream error"));
  }
}
