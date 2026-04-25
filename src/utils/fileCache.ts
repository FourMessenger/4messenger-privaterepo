import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = '4messenger-file-cache-db';
const DB_VERSION = 1;
const STORE_NAME = 'files';

export interface CachedFileEntry {
  key: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  timestamp: number;
}

let db: IDBPDatabase | null = null;

async function initDB(): Promise<IDBPDatabase> {
  if (db) return db;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    },
  });

  return db;
}

export function deriveCacheKey(fileUrl: string, fileName: string) {
  return `${fileUrl}::${fileName}`;
}

export async function getCachedFile(key: string): Promise<CachedFileEntry | null> {
  const database = await initDB();
  return (await database.get(STORE_NAME, key)) || null;
}

export async function storeFileInCache(
  key: string,
  blob: Blob,
  fileName: string,
  mimeType: string
): Promise<void> {
  const database = await initDB();
  await database.put(STORE_NAME, {
    key,
    fileName,
    mimeType,
    blob,
    timestamp: Date.now(),
  });
}

export async function deleteCachedFile(key: string): Promise<void> {
  const database = await initDB();
  await database.delete(STORE_NAME, key);
}

export async function clearFileCache(): Promise<void> {
  const database = await initDB();
  await database.clear(STORE_NAME);
}
