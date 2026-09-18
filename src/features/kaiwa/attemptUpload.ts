import type { ChunkJournal } from "./chunkJournal";
import { sha256Hex } from "./chunkJournal";

export type UploadProgress = {
  localCount: number;
  uploadedCount: number;
  receivedIndexes: number[];
};

/** Flush journal chunks to server with resume (skip already-received indexes). */
export async function syncJournalToServer(
  attemptId: string,
  journal: ChunkJournal,
  opts: {
    signal?: AbortSignal;
    onProgress?: (p: UploadProgress) => void;
  } = {},
): Promise<UploadProgress> {
  const local = await journal.list(attemptId);
  const stateRes = await fetch(`/api/kaiwa/attempts/${attemptId}/upload-state`, {
    signal: opts.signal,
  });
  const state = await stateRes.json();
  if (!stateRes.ok)
    throw new Error(state.error || "Không đọc được trạng thái upload.");
  const received = new Set<number>(state.receivedIndexes || []);

  for (const meta of local) {
    if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (received.has(meta.index)) continue;
    const data = await journal.get(attemptId, meta.index);
    if (!data) throw new Error(`Thiếu chunk local #${meta.index}`);
    const checksum = meta.checksum || (await sha256Hex(data));
    const put = await fetch(
      `/api/kaiwa/attempts/${attemptId}/chunks/${meta.index}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Checksum-Sha256": checksum,
        },
        body: data as unknown as BodyInit,
        signal: opts.signal,
      },
    );
    const body = await put.json().catch(() => ({}));
    if (!put.ok) throw new Error(body.error || `Lỗi upload chunk ${meta.index}`);
    received.add(meta.index);
    opts.onProgress?.({
      localCount: local.length,
      uploadedCount: received.size,
      receivedIndexes: [...received].sort((a, b) => a - b),
    });
  }

  const progress: UploadProgress = {
    localCount: local.length,
    uploadedCount: received.size,
    receivedIndexes: [...received].sort((a, b) => a - b),
  };
  opts.onProgress?.(progress);
  return progress;
}

export async function assembleAndFinalize(
  attemptId: string,
  payload: {
    completion: "completed" | "partial" | "interrupted" | "failed";
    durationMs: number;
    clocks: unknown;
    device: unknown;
  },
): Promise<Response> {
  if (payload.completion === "completed" || payload.completion === "partial") {
    const assembled = await fetch(
      `/api/kaiwa/attempts/${attemptId}/assemble-audio`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
    );
    const body = await assembled.json().catch(() => ({}));
    if (!assembled.ok) {
      throw new Error(
        body.error || "Không lắp được audio — không báo đã lưu.",
      );
    }
  }
  return fetch(`/api/kaiwa/attempts/${attemptId}/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
