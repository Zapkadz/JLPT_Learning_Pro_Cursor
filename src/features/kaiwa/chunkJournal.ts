/** Local capture journal — IndexedDB in browser, memory store for tests. */

export type JournalChunkMeta = {
  attemptId: string;
  index: number;
  checksum: string;
  bytes: number;
};

export type ChunkJournal = {
  clear(attemptId: string): Promise<void>;
  append(
    attemptId: string,
    index: number,
    data: Uint8Array,
    checksum: string,
  ): Promise<void>;
  list(attemptId: string): Promise<JournalChunkMeta[]>;
  get(attemptId: string, index: number): Promise<Uint8Array | null>;
  usageBytes(attemptId: string): Promise<number>;
};

export const DEFAULT_JOURNAL_LIMIT_BYTES = 80 * 1024 * 1024;

export class MemoryChunkJournal implements ChunkJournal {
  private store = new Map<string, Map<number, Uint8Array>>();
  private checksums = new Map<string, Map<number, string>>();

  async clear(attemptId: string) {
    this.store.delete(attemptId);
    this.checksums.delete(attemptId);
  }

  async append(
    attemptId: string,
    index: number,
    data: Uint8Array,
    checksum: string,
  ) {
    if (!this.store.has(attemptId)) this.store.set(attemptId, new Map());
    if (!this.checksums.has(attemptId))
      this.checksums.set(attemptId, new Map());
    const existing = this.checksums.get(attemptId)!.get(index);
    if (existing && existing !== checksum) {
      throw new Error("journal_checksum_conflict");
    }
    this.store.get(attemptId)!.set(index, data);
    this.checksums.get(attemptId)!.set(index, checksum);
  }

  async list(attemptId: string): Promise<JournalChunkMeta[]> {
    const chunks = this.store.get(attemptId);
    const sums = this.checksums.get(attemptId);
    if (!chunks || !sums) return [];
    return [...chunks.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([index, data]) => ({
        attemptId,
        index,
        checksum: sums.get(index) || "",
        bytes: data.byteLength,
      }));
  }

  async get(attemptId: string, index: number) {
    return this.store.get(attemptId)?.get(index) || null;
  }

  async usageBytes(attemptId: string) {
    const chunks = this.store.get(attemptId);
    if (!chunks) return 0;
    let n = 0;
    for (const d of chunks.values()) n += d.byteLength;
    return n;
  }
}

const DB_NAME = "kaiwa-chunk-journal";
const STORE = "chunks";

function idbAvailable() {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: "id" });
        os.createIndex("attemptId", "attemptId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export class IdbChunkJournal implements ChunkJournal {
  async clear(attemptId: string) {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const idx = tx.objectStore(STORE).index("attemptId");
      const req = idx.openCursor(IDBKeyRange.only(attemptId));
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async append(
    attemptId: string,
    index: number,
    data: Uint8Array,
    checksum: string,
  ) {
    const db = await openDb();
    const id = `${attemptId}:${index}`;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({
        id,
        attemptId,
        index,
        checksum,
        bytes: data.byteLength,
        data: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async list(attemptId: string): Promise<JournalChunkMeta[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const idx = tx.objectStore(STORE).index("attemptId");
      const req = idx.getAll(IDBKeyRange.only(attemptId));
      req.onsuccess = () => {
        const rows = (req.result || []) as {
          attemptId: string;
          index: number;
          checksum: string;
          bytes: number;
        }[];
        resolve(
          rows
            .map((r) => ({
              attemptId: r.attemptId,
              index: r.index,
              checksum: r.checksum,
              bytes: r.bytes,
            }))
            .sort((a, b) => a.index - b.index),
        );
      };
      req.onerror = () => reject(req.error);
    });
  }

  async get(attemptId: string, index: number) {
    const db = await openDb();
    return new Promise<Uint8Array | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(`${attemptId}:${index}`);
      req.onsuccess = () => {
        const row = req.result as { data?: ArrayBuffer } | undefined;
        resolve(row?.data ? new Uint8Array(row.data) : null);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async usageBytes(attemptId: string) {
    const list = await this.list(attemptId);
    return list.reduce((n, c) => n + c.bytes, 0);
  }
}

export function createChunkJournal(): ChunkJournal {
  return idbAvailable() ? new IdbChunkJournal() : new MemoryChunkJournal();
}

export async function sha256Hex(data: Uint8Array): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("SHA-256 không khả dụng trong môi trường này.");
  }
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  const digest = await crypto.subtle.digest("SHA-256", copy);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
