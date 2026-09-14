import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
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
} finally {
  db.close();
}
