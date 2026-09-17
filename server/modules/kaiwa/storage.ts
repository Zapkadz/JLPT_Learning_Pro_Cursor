import {
  createReadStream,
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import type { Readable } from "node:stream";

/**
 * Private local filesystem media store.
 * Keys are server-generated; paths never leave the configured media root.
 */
export class LocalMediaStorage {
  constructor(private readonly root: string) {
    mkdirSync(this.root, { recursive: true });
  }

  /** Opaque storage key — not a user-supplied filename. */
  createKey(kind: string, ext = "bin"): string {
    const safeKind = kind.replace(/[^a-z0-9_-]/gi, "").slice(0, 32) || "asset";
    const safeExt = ext.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "bin";
    const id = randomUUID().replace(/-/g, "");
    // Shard by first 2 hex chars to avoid huge directories.
    return `${safeKind}/${id.slice(0, 2)}/${id}.${safeExt}`;
  }

  resolvePath(storageKey: string): string {
    const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");
    if (
      normalized.includes("..") ||
      normalized.includes("\0") ||
      normalized.startsWith("/") ||
      /^[a-zA-Z]:/.test(normalized)
    ) {
      throw new Error("invalid_storage_key");
    }
    const full = resolve(this.root, normalized);
    const rootWithSep = this.root.endsWith(sep) ? this.root : this.root + sep;
    if (full !== this.root && !full.startsWith(rootWithSep)) {
      throw new Error("path_escape");
    }
    return full;
  }

  writeFile(storageKey: string, data: Buffer): void {
    const dest = this.resolvePath(storageKey);
    mkdirSync(dirname(dest), { recursive: true });
    const tmp = join(dirname(dest), `.tmp-${randomUUID()}`);
    writeFileSync(tmp, data);
    renameSync(tmp, dest);
  }

  openRead(
    storageKey: string,
    range?: { start: number; end: number },
  ): { stream: Readable; size: number; start: number; end: number } {
    const path = this.resolvePath(storageKey);
    if (!existsSync(path)) throw new Error("missing_file");
    const size = statSync(path).size;
    const start = range?.start ?? 0;
    const end = range?.end ?? size - 1;
    if (start < 0 || end >= size || start > end) throw new Error("invalid_range");
    return {
      stream: createReadStream(path, { start, end }),
      size,
      start,
      end,
    };
  }

  stat(storageKey: string): { size: number; mtimeMs: number } | null {
    const path = this.resolvePath(storageKey);
    if (!existsSync(path)) return null;
    const s = statSync(path);
    return { size: s.size, mtimeMs: s.mtimeMs };
  }

  remove(storageKey: string): void {
    const path = this.resolvePath(storageKey);
    if (existsSync(path)) rmSync(path, { force: true });
  }

  isUnderRoot(absolutePath: string): boolean {
    const full = resolve(absolutePath);
    const rootWithSep = this.root.endsWith(sep) ? this.root : this.root + sep;
    return full === this.root || full.startsWith(rootWithSep);
  }
}
