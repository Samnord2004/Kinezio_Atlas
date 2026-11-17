import {
  DirectoryCustomPhoto,
  DirectoryMediaSection,
  MMTVectorArrow,
} from '../types/atlas';

const DB_NAME = 'kinezioatlas_directory_media_v1';
const DB_VERSION = 1;
const STORE_PHOTOS = 'directory_photos';
const STORE_OVERLAY_ARROWS = 'directory_overlay_arrows';
const LS_ARROWS_KEY = 'kinezioatlas_directory_overlay_arrows_v1';

export const DIRECTORY_MEDIA_UPDATED_EVENT = 'kinezioatlas:directory-media-updated';

interface OverlayArrowRecord {
  key: string;
  arrows: MMTVectorArrow[];
  updatedAt: string;
}

export function makeDirectoryEntryKey(
  section: DirectoryMediaSection,
  itemId: string
): string {
  return `${section}::${itemId}`;
}

function notifyDirectoryMediaUpdated(section?: DirectoryMediaSection): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(DIRECTORY_MEDIA_UPDATED_EVENT, { detail: { section } })
    );
  }
}

function openMediaDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
          const store = db.createObjectStore(STORE_PHOTOS, { keyPath: 'id' });
          store.createIndex('entryKey', 'entryKey', { unique: false });
          store.createIndex('section', 'section', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_OVERLAY_ARROWS)) {
          db.createObjectStore(STORE_OVERLAY_ARROWS, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function readArrowsFallback(): Record<string, MMTVectorArrow[]> {
  try {
    const raw = localStorage.getItem(LS_ARROWS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, MMTVectorArrow[]>;
  } catch {
    return {};
  }
}

function writeArrowsFallback(map: Record<string, MMTVectorArrow[]>): void {
  try {
    localStorage.setItem(LS_ARROWS_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

export async function loadDirectoryPhotos(
  section: DirectoryMediaSection,
  itemId: string
): Promise<DirectoryCustomPhoto[]> {
  const db = await openMediaDb();
  if (!db) return [];

  const entryKey = makeDirectoryEntryKey(section, itemId);
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_PHOTOS, 'readonly');
      const store = tx.objectStore(STORE_PHOTOS);
      const index = store.index('entryKey');
      const req = index.getAll(entryKey);
      req.onsuccess = () => {
        const rows = ((req.result as DirectoryCustomPhoto[]) ?? []).sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt)
        );
        db.close();
        resolve(rows);
      };
      req.onerror = () => {
        db.close();
        resolve([]);
      };
    } catch {
      db.close();
      resolve([]);
    }
  });
}

export async function loadDirectoryPhotoCountsBySection(
  section: DirectoryMediaSection
): Promise<Record<string, number>> {
  const db = await openMediaDb();
  if (!db) return {};

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_PHOTOS, 'readonly');
      const store = tx.objectStore(STORE_PHOTOS);
      const index = store.index('section');
      const req = index.getAll(section);
      req.onsuccess = () => {
        const rows = (req.result as DirectoryCustomPhoto[]) ?? [];
        const counts: Record<string, number> = {};
        for (const r of rows) {
          counts[r.itemId] = (counts[r.itemId] ?? 0) + 1;
        }
        db.close();
        resolve(counts);
      };
      req.onerror = () => {
        db.close();
        resolve({});
      };
    } catch {
      db.close();
      resolve({});
    }
  });
}

export async function saveDirectoryPhoto(
  photo: DirectoryCustomPhoto
): Promise<void> {
  const db = await openMediaDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_PHOTOS, 'readwrite');
      tx.objectStore(STORE_PHOTOS).put(photo);
      tx.oncomplete = () => {
        db.close();
        notifyDirectoryMediaUpdated(photo.section);
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

export async function deleteDirectoryPhoto(
  photoId: string,
  section?: DirectoryMediaSection
): Promise<void> {
  const db = await openMediaDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_PHOTOS, 'readwrite');
      tx.objectStore(STORE_PHOTOS).delete(photoId);
      tx.oncomplete = () => {
        db.close();
        notifyDirectoryMediaUpdated(section);
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

export async function loadDirectoryOverlayArrows(
  overlayKey: string
): Promise<MMTVectorArrow[]> {
  const fallback = readArrowsFallback();
  const db = await openMediaDb();
  if (!db) {
    return fallback[overlayKey] ?? [];
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_OVERLAY_ARROWS, 'readonly');
      const req = tx.objectStore(STORE_OVERLAY_ARROWS).get(overlayKey);
      req.onsuccess = () => {
        const row = req.result as OverlayArrowRecord | undefined;
        db.close();
        resolve(row?.arrows ?? fallback[overlayKey] ?? []);
      };
      req.onerror = () => {
        db.close();
        resolve(fallback[overlayKey] ?? []);
      };
    } catch {
      db.close();
      resolve(fallback[overlayKey] ?? []);
    }
  });
}

export async function saveDirectoryOverlayArrows(
  overlayKey: string,
  arrows: MMTVectorArrow[]
): Promise<void> {
  const fallback = readArrowsFallback();
  fallback[overlayKey] = arrows;
  writeArrowsFallback(fallback);

  const db = await openMediaDb();
  if (!db) {
    notifyDirectoryMediaUpdated();
    return;
  }

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_OVERLAY_ARROWS, 'readwrite');
      const record: OverlayArrowRecord = {
        key: overlayKey,
        arrows,
        updatedAt: new Date().toISOString(),
      };
      tx.objectStore(STORE_OVERLAY_ARROWS).put(record);
      tx.oncomplete = () => {
        db.close();
        notifyDirectoryMediaUpdated();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

export async function exportAllDirectoryMedia(): Promise<{
  photos: DirectoryCustomPhoto[];
  overlayArrows: Record<string, MMTVectorArrow[]>;
}> {
  const arrows = readArrowsFallback();
  const db = await openMediaDb();
  if (!db) {
    return { photos: [], overlayArrows: arrows };
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_PHOTOS, STORE_OVERLAY_ARROWS], 'readonly');
      const photosReq = tx.objectStore(STORE_PHOTOS).getAll();
      const arrowsReq = tx.objectStore(STORE_OVERLAY_ARROWS).getAll();

      tx.oncomplete = () => {
        const photos = (photosReq.result as DirectoryCustomPhoto[]) ?? [];
        const dbArrows = (arrowsReq.result as OverlayArrowRecord[]) ?? [];
        const mergedArrows: Record<string, MMTVectorArrow[]> = { ...arrows };
        for (const row of dbArrows) {
          if (row && row.key) {
            mergedArrows[row.key] = row.arrows ?? [];
          }
        }
        db.close();
        resolve({ photos, overlayArrows: mergedArrows });
      };
      tx.onerror = () => {
        db.close();
        resolve({ photos: [], overlayArrows: arrows });
      };
    } catch {
      db.close();
      resolve({ photos: [], overlayArrows: arrows });
    }
  });
}

export async function importDirectoryMediaBatch(
  incomingPhotos: DirectoryCustomPhoto[],
  incomingArrows: Record<string, MMTVectorArrow[]>,
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ photosAdded: number }> {
  const db = await openMediaDb();
  const currentArrows = mode === 'replace' ? {} : readArrowsFallback();
  const nextArrows = { ...currentArrows, ...incomingArrows };
  writeArrowsFallback(nextArrows);

  if (!db) {
    notifyDirectoryMediaUpdated();
    return { photosAdded: 0 };
  }

  return new Promise((resolve) => {
    try {
      const readTx = db.transaction(STORE_PHOTOS, 'readonly');
      const existingReq = readTx.objectStore(STORE_PHOTOS).getAll();
      readTx.oncomplete = () => {
        const existingList = (existingReq.result as DirectoryCustomPhoto[]) ?? [];
        const existingMap = new Map<string, DirectoryCustomPhoto>();
        existingList.forEach((p) => existingMap.set(p.id, p));

        let photosAdded = 0;
        const writeTx = db.transaction([STORE_PHOTOS, STORE_OVERLAY_ARROWS], 'readwrite');
        const photoStore = writeTx.objectStore(STORE_PHOTOS);
        const arrowStore = writeTx.objectStore(STORE_OVERLAY_ARROWS);

        if (mode === 'replace') {
          photoStore.clear();
          arrowStore.clear();
        }

        for (const p of incomingPhotos) {
          if (!p || typeof p.id !== 'string') continue;
          const prev = existingMap.get(p.id);
          if (!prev || mode === 'replace') {
            if (!prev) photosAdded++;
            photoStore.put(p);
          } else if ((p.updatedAt ?? '') >= (prev.updatedAt ?? '')) {
            photoStore.put(p);
          }
        }

        for (const [key, arrows] of Object.entries(nextArrows)) {
          arrowStore.put({
            key,
            arrows,
            updatedAt: new Date().toISOString(),
          });
        }

        writeTx.oncomplete = () => {
          db.close();
          notifyDirectoryMediaUpdated();
          resolve({ photosAdded });
        };
        writeTx.onerror = () => {
          db.close();
          resolve({ photosAdded: 0 });
        };
      };
      readTx.onerror = () => {
        db.close();
        resolve({ photosAdded: 0 });
      };
    } catch {
      db.close();
      resolve({ photosAdded: 0 });
    }
  });
}

