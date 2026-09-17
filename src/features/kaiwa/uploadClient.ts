/** Browser SHA-256 hex for Kaiwa chunked uploads. */
export async function sha256Hex(data: ArrayBuffer | Uint8Array): Promise<string> {
  const buf =
    data instanceof Uint8Array
      ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
      : data;
  const digest = await crypto.subtle.digest("SHA-256", buf as ArrayBuffer);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type UploadSession = {
  uploadId: string;
  assetId: string;
  chunkSize: number;
  chunkCount: number;
  fileKey: string;
};

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

const STORAGE_PREFIX = "kaiwa-upload:";

export function loadResume(file: File): UploadSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + fileKey(file));
    if (!raw) return null;
    return JSON.parse(raw) as UploadSession;
  } catch {
    return null;
  }
}

export function saveResume(file: File, session: UploadSession) {
  sessionStorage.setItem(
    STORAGE_PREFIX + fileKey(file),
    JSON.stringify({ ...session, fileKey: fileKey(file) }),
  );
}

export function clearResume(file: File) {
  sessionStorage.removeItem(STORAGE_PREFIX + fileKey(file));
}

export async function putBinary(
  path: string,
  body: Blob | ArrayBuffer | Uint8Array,
  headers: Record<string, string> = {},
  signal?: AbortSignal,
): Promise<Response> {
  const res = await fetch("/api" + path, {
    method: "PUT",
    headers,
    body: body as BodyInit,
    signal,
  });
  return res;
}

export async function uploadFileChunked(
  file: File,
  opts: {
    onProgress?: (ratio: number) => void;
    signal?: AbortSignal;
    chunkSize?: number;
  } = {},
): Promise<{ assetId: string }> {
  const ext = (file.name.split(".").pop() || "mp4").slice(0, 8).toLowerCase();
  const chunkSize = opts.chunkSize || 1024 * 1024;
  let session = loadResume(file);

  if (!session) {
    const checksum = await sha256Hex(await file.arrayBuffer());
    const created = await fetch("/api/kaiwa/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purpose: "source",
        bytes: file.size,
        chunkSize,
        checksum,
        ext,
      }),
      signal: opts.signal,
    });
    const data = await created.json();
    if (!created.ok) throw new Error(data.error || "Không tạo được phiên tải lên.");
    session = {
      uploadId: data.id,
      assetId: data.asset_id,
      chunkSize: data.chunk_size,
      chunkCount: data.chunk_count,
      fileKey: fileKey(file),
    };
    saveResume(file, session);
  }

  const statusRes = await fetch(`/api/kaiwa/uploads/${session.uploadId}`, {
    signal: opts.signal,
  });
  const status = await statusRes.json();
  if (!statusRes.ok) {
    clearResume(file);
    throw new Error(status.error || "Phiên tải lên không còn hợp lệ.");
  }
  const received = new Set<number>(status.receivedIndexes || []);

  for (let i = 0; i < session.chunkCount; i++) {
    if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (received.has(i)) {
      opts.onProgress?.((i + 1) / session.chunkCount);
      continue;
    }
    const start = i * session.chunkSize;
    const end = Math.min(start + session.chunkSize, file.size);
    const slice = file.slice(start, end);
    const buf = new Uint8Array(await slice.arrayBuffer());
    const checksum = await sha256Hex(buf);
    const put = await putBinary(
      `/kaiwa/uploads/${session.uploadId}/chunks/${i}`,
      buf,
      {
        "Content-Type": "application/octet-stream",
        "X-Checksum-Sha256": checksum,
      },
      opts.signal,
    );
    const putBody = await put.json().catch(() => ({}));
    if (!put.ok) throw new Error(putBody.error || `Lỗi chunk ${i}.`);
    opts.onProgress?.((i + 1) / session.chunkCount);
  }

  const done = await fetch(`/api/kaiwa/uploads/${session.uploadId}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    signal: opts.signal,
  });
  const asset = await done.json();
  if (!done.ok) throw new Error(asset.error || "Không hoàn tất tải lên.");
  clearResume(file);
  return { assetId: asset.id as string };
}

export async function cancelUpload(file: File) {
  const session = loadResume(file);
  if (!session) return;
  await fetch(`/api/kaiwa/uploads/${session.uploadId}`, { method: "DELETE" });
  clearResume(file);
}
