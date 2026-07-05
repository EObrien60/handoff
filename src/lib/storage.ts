import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Object storage abstraction. Dev uses local disk under `.storage/`; production
 * swaps in S3/R2 behind the same interface. Keys are always tenant/customer
 * scoped by the caller (e.g. `org/<orgId>/customer/<customerId>/<fileId>`), so
 * a leaked key still can't cross a tenant boundary in the access layer above.
 */
export interface Storage {
  put(key: string, data: Buffer, contentType?: string): Promise<void>;
  get(key: string): Promise<Buffer>;
}

class LocalDiskStorage implements Storage {
  constructor(private root: string) {}

  private resolve(key: string): string {
    // Prevent path traversal: no "..", collapse to a safe relative path.
    const safe = key.replace(/\.\.+/g, "").replace(/^\/+/, "");
    return path.join(this.root, safe);
  }

  async put(key: string, data: Buffer): Promise<void> {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.resolve(key));
  }
}

let _storage: Storage | undefined;
export function storage(): Storage {
  if (_storage) return _storage;
  // Only local disk implemented so far; S3 impl slots in here by env.
  _storage = new LocalDiskStorage(path.join(process.cwd(), ".storage"));
  return _storage;
}

/** Canonical, tenant-scoped storage key for a file. */
export function fileKey(organisationId: string, customerId: string, fileId: string): string {
  return `org/${organisationId}/customer/${customerId}/${fileId}`;
}
