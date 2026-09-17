import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { loadKaiwaConfig } from "./modules/kaiwa/config";
import {
  backupKaiwaMedia,
  verifyKaiwaMediaBackup,
} from "./modules/kaiwa/ops";

const target = process.argv[2];
if (!target)
  throw new Error(
    "Provide a new destination path: npm run backup -- /path/backup.sqlite",
  );
const source = resolve(process.env.DB_PATH || "data/kotoba.sqlite");
const destination = resolve(target);
if (source === destination || existsSync(destination))
  throw new Error(
    "Destination must be a new file. Existing files are never overwritten.",
  );
mkdirSync(dirname(destination), { recursive: true });
const db = new Database(source, { readonly: true, fileMustExist: true });
try {
  await db.backup(destination);
  const verify = new Database(destination, { readonly: true });
  const integrity = verify.pragma("integrity_check", { simple: true });
  verify.close();
  if (integrity !== "ok") throw new Error("Backup integrity check failed.");
  console.log("Backup created and verified:", destination);

  const withMedia =
    process.env.KAIWA_BACKUP_MEDIA === "1" ||
    process.argv.includes("--with-media");
  if (withMedia) {
    const mediaRoot = loadKaiwaConfig().mediaRoot;
    const mediaDest = destination + ".media";
    const manifest = backupKaiwaMedia({
      mediaRoot,
      destinationDir: mediaDest,
      dbPath: destination,
    });
    const check = verifyKaiwaMediaBackup(mediaDest);
    if (!check.ok) {
      throw new Error(
        `Media backup verify failed: ${check.errors.slice(0, 5).join("; ")}`,
      );
    }
    console.log(
      `Kaiwa media backup: ${manifest.fileCount} files, ${manifest.totalBytes} bytes → ${mediaDest}`,
    );
  } else {
    console.log(
      "Tip: pass --with-media (or KAIWA_BACKUP_MEDIA=1) to include private Kaiwa media + MANIFEST.json.",
    );
  }
} finally {
  db.close();
}
