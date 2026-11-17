import { MMTCustomPhoto, MMTPositionType, MMTVectorArrow, MMTVectorArrowType } from '../types/atlas';

const DB_NAME = 'kinezioatlas_mmt_media_v1';
const DB_VERSION = 1;
const STORE_PHOTOS = 'mmt_photos';
const STORE_OVERLAY_ARROWS = 'mmt_overlay_arrows';
const LS_ARROWS_KEY = 'kinezioatlas_mmt_overlay_arrows_v1';
export const MMT_MEDIA_UPDATED_EVENT = 'kinezioatlas:mmt-media-updated';

export const MMT_POSITION_OPTIONS: ReadonlyArray<{
  id: MMTPositionType;
  label: string;
}> = [
  { id: 'supine', label: 'Лёжа на спине' },
  { id: 'prone', label: 'Лёжа на животе' },
  { id: 'side', label: 'Лёжа на боку' },
  { id: 'sitting', label: 'Сидя' },
  { id: 'standing', label: 'Стоя' },
  { id: 'custom', label: 'Другое положение' },
];

export const MMT_ARROW_KIND_META: Record<
  MMTVectorArrowType,
  { label: string; shortLabel: string; color: string; bgBadge: string; textBadge: string }
> = {
  practitioner_pressure: {
    label: 'Вектор давления врача',
    shortLabel: 'Давление врача',
    color: '#dc2626',
    bgBadge: 'bg-red-50 border-red-200',
    textBadge: 'text-red-700',
  },
  patient_action: {
    label: 'Движение / усилие пациента',
    shortLabel: 'Движение пациента',
    color: '#1d4ed8',
    bgBadge: 'bg-blue-50 border-blue-200',
    textBadge: 'text-blue-700',
  },
  stabilization: {
    label: 'Вектор фиксации / стабилизации',
    shortLabel: 'Стабилизация',
    color: '#059669',
    bgBadge: 'bg-emerald-50 border-emerald-200',
    textBadge: 'text-emerald-700',
  },
};

interface OverlayArrowRecord {
  key: string;
  arrows: MMTVectorArrow[];
  updatedAt: string;
}

function notifyMediaUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MMT_MEDIA_UPDATED_EVENT));
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
          store.createIndex('muscleId', 'muscleId', { unique: false });
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
    // ignore quota errors
  }
}

export async function loadCustomPhotosForMuscle(muscleId: string): Promise<MMTCustomPhoto[]> {
  const db = await openMediaDb();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_PHOTOS, 'readonly');
      const store = tx.objectStore(STORE_PHOTOS);
      const index = store.index('muscleId');
      const req = index.getAll(muscleId);
      req.onsuccess = () => {
        const rows = ((req.result as MMTCustomPhoto[]) ?? []).sort((a, b) =>
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

export async function saveCustomPhoto(photo: MMTCustomPhoto): Promise<void> {
  const db = await openMediaDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_PHOTOS, 'readwrite');
      tx.objectStore(STORE_PHOTOS).put(photo);
      tx.oncomplete = () => {
        db.close();
        notifyMediaUpdated();
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

export async function deleteCustomPhoto(photoId: string): Promise<void> {
  const db = await openMediaDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_PHOTOS, 'readwrite');
      tx.objectStore(STORE_PHOTOS).delete(photoId);
      tx.oncomplete = () => {
        db.close();
        notifyMediaUpdated();
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

export async function loadOverlayArrows(overlayKey: string): Promise<MMTVectorArrow[]> {
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

export async function saveOverlayArrows(
  overlayKey: string,
  arrows: MMTVectorArrow[]
): Promise<void> {
  const fallback = readArrowsFallback();
  fallback[overlayKey] = arrows;
  writeArrowsFallback(fallback);

  const db = await openMediaDb();
  if (!db) {
    notifyMediaUpdated();
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
        notifyMediaUpdated();
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

export async function exportAllMmtMedia(): Promise<{
  photos: MMTCustomPhoto[];
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
        const photos = (photosReq.result as MMTCustomPhoto[]) ?? [];
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

export async function importMmtMediaBatch(
  incomingPhotos: MMTCustomPhoto[],
  incomingArrows: Record<string, MMTVectorArrow[]>,
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ photosAdded: number }> {
  const db = await openMediaDb();
  const currentArrows = mode === 'replace' ? {} : readArrowsFallback();
  const nextArrows = { ...currentArrows, ...incomingArrows };
  writeArrowsFallback(nextArrows);

  if (!db) {
    notifyMediaUpdated();
    return { photosAdded: 0 };
  }

  return new Promise((resolve) => {
    try {
      const readTx = db.transaction(STORE_PHOTOS, 'readonly');
      const existingReq = readTx.objectStore(STORE_PHOTOS).getAll();
      readTx.oncomplete = () => {
        const existingList = (existingReq.result as MMTCustomPhoto[]) ?? [];
        const existingMap = new Map<string, MMTCustomPhoto>();
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
          notifyMediaUpdated();
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

export function compressImageFile(
  file: File,
  maxDim = 1400,
  quality = 0.86
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не удалось прочитать файл изображения'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Неподдерживаемый формат изображения'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export async function exportAnnotatedPhotoPng(
  imgSrc: string,
  arrows: MMTVectorArrow[],
  fileTitle: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => reject(new Error('Ошибка загрузки изображения для экспорта'));
    img.onload = () => {
      const w = img.naturalWidth || 1000;
      const h = img.naturalHeight || 750;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas недоступен'));
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);

      const scaleBase = Math.max(w, h) / 800;
      const strokeW = Math.max(4, 4.5 * scaleBase);
      const headLen = Math.max(16, 18 * scaleBase);
      const fontSize = Math.max(14, Math.round(15 * scaleBase));

      arrows.forEach((arr) => {
        const x1 = (arr.x1 / 100) * w;
        const y1 = (arr.y1 / 100) * h;
        const x2 = (arr.x2 / 100) * w;
        const y2 = (arr.y2 / 100) * h;
        const color = MMT_ARROW_KIND_META[arr.kind].color;
        const angle = Math.atan2(y2 - y1, x2 - x1);

        // Subtle white halo for contrast over any photo
        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255,255,255,0.92)';
        ctx.lineWidth = strokeW + 3.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Main colored arrow shaft
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeW;
        if (arr.kind === 'patient_action') {
          ctx.setLineDash([10 * scaleBase, 6 * scaleBase]);
        }
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Origin anchor circle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x1, y1, strokeW * 1.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(2, strokeW * 0.6);
        ctx.stroke();

        // Arrowhead
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - headLen * Math.cos(angle - Math.PI / 6),
          y2 - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          x2 - headLen * Math.cos(angle + Math.PI / 6),
          y2 - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        // Optional text label
        const label = arr.label?.trim();
        if (label) {
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2 - 12 * scaleBase;
          ctx.font = `600 ${fontSize}px sans-serif`;
          const textW = ctx.measureText(label).width;
          const padX = 8 * scaleBase;
          const boxH = fontSize + 10 * scaleBase;
          const boxX = Math.max(6, Math.min(w - textW - padX * 2 - 6, midX - textW / 2 - padX));
          const boxY = Math.max(6, Math.min(h - boxH - 6, midY - boxH / 2));

          ctx.fillStyle = 'rgba(255,255,255,0.94)';
          ctx.fillRect(boxX, boxY, textW + padX * 2, boxH);
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(1.5, scaleBase * 1.5);
          ctx.strokeRect(boxX, boxY, textW + padX * 2, boxH);
          ctx.fillStyle = '#0f172a';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, boxX + padX, boxY + boxH / 2);
        }
        ctx.restore();
      });

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileTitle.replace(/[^a-zA-Zа-яА-Я0-9_-]+/g, '_')}_mmt_vectors.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      resolve();
    };
    img.src = imgSrc;
  });
}
