import {
  BackupFileMeta,
  DirectoryCustomPhoto,
  DirectoryEntryOverride,
  DiskFolderRole,
  DiskFolderStatus,
  KinezioAtlasExchangePackage,
  LearningProgressState,
  MMTCustomPhoto,
  MMTVectorArrow,
  PatientProfile,
  PatientVisitRecord,
  StudyNote,
  SyncMergeReport,
} from '../types/atlas';
import {
  DIRECTORY_MEDIA_UPDATED_EVENT,
  exportAllDirectoryMedia,
  importDirectoryMediaBatch,
} from './directoryMediaStore';
import {
  DIRECTORY_OVERRIDES_UPDATED_EVENT,
  importDirectoryOverridesBatch,
  loadAllDirectoryOverrides,
} from './directoryOverridesStore';
import {
  MMT_MEDIA_UPDATED_EVENT,
  exportAllMmtMedia,
  importMmtMediaBatch,
} from './mmtMediaStore';
import {
  PATIENT_DB_UPDATED_EVENT,
  importDatabaseSnapshot,
  loadPatientDatabase,
  replacePatientDatabase,
} from './patientDatabase';
import { STUDY_NOTES_UPDATED_EVENT, loadStudyNotes, saveStudyNotes } from './studyNotesStore';
import { getCurrentAppVersion } from './appUpdater';

const FS_DB_NAME = 'kinezioatlas_fs_handles_v1';
const FS_DB_VERSION = 1;
const FS_STORE = 'handles';

const LS_MACHINE_ID_KEY = 'kinezioatlas_machine_id_v1';
const LS_MACHINE_LABEL_KEY = 'kinezioatlas_machine_label_v1';
const LS_AUTO_MIRROR_KEY = 'kinezioatlas_auto_mirror_enabled_v1';
const LS_LAST_SYNC_META_KEY = 'kinezioatlas_folder_sync_meta_v1';
const LS_LEARNING_PROGRESS_KEY = 'kinezioatlas_learning_progress_v1';

export const STORAGE_ENGINE_STATUS_EVENT = 'kinezioatlas:storage-status-updated';

const ROLE_LABELS: Record<DiskFolderRole, string> = {
  primary: 'Основное хранилище данных',
  mirror: 'Зеркальная копия (Mirror)',
  backup: 'Папка резервных копий (Backup)',
  cloudSync: 'Папка облачного диска (Яндекс / Google)',
};

export interface ExchangePreviewDiff {
  sourceMachineLabel: string;
  exportedAt: string;
  appVersion: string;
  formatLabel: string;
  incomingPatients: number;
  incomingVisits: number;
  incomingNotes: number;
  incomingOverrides: number;
  incomingPhotos: number;
  newPatients: number;
  updatedPatients: number;
  newVisits: number;
  newOverrides: number;
  newNotes: number;
}

interface StoredHandleRecord {
  role: DiskFolderRole;
  handle: FileSystemDirectoryHandle;
  name: string;
  updatedAt: string;
}

// Browser File System Access API augmentations (Chromium)
interface DirectoryPickerWindow extends Window {
  showDirectoryPicker?: (options?: {
    id?: string;
    mode?: 'read' | 'readwrite';
    startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
  }) => Promise<FileSystemDirectoryHandle>;
}

interface PermissionAwareHandle extends FileSystemDirectoryHandle {
  queryPermission?: (desc: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>;
  requestPermission?: (desc: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>;
}

export function isElectronDesktop(): boolean {
  return typeof window !== 'undefined' && Boolean(window.kinezioDesktop?.isElectron);
}

export function isBrowserFsAccessSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as DirectoryPickerWindow).showDirectoryPicker === 'function'
  );
}

export function getMachineIdentity(): { machineId: string; machineLabel: string } {
  if (typeof localStorage === 'undefined') {
    return { machineId: 'pc_local', machineLabel: 'Основной ПК' };
  }
  let machineId = localStorage.getItem(LS_MACHINE_ID_KEY);
  if (!machineId) {
    machineId = `pc_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`;
    localStorage.setItem(LS_MACHINE_ID_KEY, machineId);
  }
  let machineLabel = localStorage.getItem(LS_MACHINE_LABEL_KEY);
  if (!machineLabel) {
    const isMac =
      typeof navigator !== 'undefined' && /mac/i.test(navigator.platform || navigator.userAgent);
    machineLabel = isMac ? 'Mac-кабинет' : 'Рабочий ПК';
    localStorage.setItem(LS_MACHINE_LABEL_KEY, machineLabel);
  }
  return { machineId, machineLabel };
}

export function setMachineLabel(label: string): void {
  if (typeof localStorage === 'undefined') return;
  const trimmed = label.trim();
  if (trimmed) {
    localStorage.setItem(LS_MACHINE_LABEL_KEY, trimmed);
  }
}

export function getAutoMirrorEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(LS_AUTO_MIRROR_KEY) === 'true';
}

export function setAutoMirrorEnabled(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LS_AUTO_MIRROR_KEY, enabled ? 'true' : 'false');
  notifyStorageStatus();
}

function getLastSyncMap(): Record<string, string> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LS_LAST_SYNC_META_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function setLastSyncTimestamp(role: DiskFolderRole, iso: string): void {
  if (typeof localStorage === 'undefined') return;
  const map = getLastSyncMap();
  map[role] = iso;
  try {
    localStorage.setItem(LS_LAST_SYNC_META_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
  notifyStorageStatus();
}

function notifyStorageStatus(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORAGE_ENGINE_STATUS_EVENT));
  }
}

function openFsDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(FS_DB_NAME, FS_DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(FS_STORE)) {
          db.createObjectStore(FS_STORE, { keyPath: 'role' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function saveBrowserHandle(
  role: DiskFolderRole,
  handle: FileSystemDirectoryHandle
): Promise<void> {
  const db = await openFsDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(FS_STORE, 'readwrite');
      const record: StoredHandleRecord = {
        role,
        handle,
        name: handle.name,
        updatedAt: new Date().toISOString(),
      };
      tx.objectStore(FS_STORE).put(record);
      tx.oncomplete = () => {
        db.close();
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

async function getBrowserHandle(role: DiskFolderRole): Promise<StoredHandleRecord | null> {
  const db = await openFsDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(FS_STORE, 'readonly');
      const req = tx.objectStore(FS_STORE).get(role);
      req.onsuccess = () => {
        const res = (req.result as StoredHandleRecord | undefined) ?? null;
        db.close();
        resolve(res);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

async function deleteBrowserHandle(role: DiskFolderRole): Promise<void> {
  const db = await openFsDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(FS_STORE, 'readwrite');
      tx.objectStore(FS_STORE).delete(role);
      tx.oncomplete = () => {
        db.close();
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

async function ensureBrowserHandlePermission(
  handle: FileSystemDirectoryHandle,
  requestIfNeeded: boolean
): Promise<boolean> {
  const h = handle as PermissionAwareHandle;
  try {
    if (typeof h.queryPermission === 'function') {
      const state = await h.queryPermission({ mode: 'readwrite' });
      if (state === 'granted') return true;
      if (requestIfNeeded && typeof h.requestPermission === 'function') {
        const reqState = await h.requestPermission({ mode: 'readwrite' });
        return reqState === 'granted';
      }
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function getAllFolderStatuses(): Promise<DiskFolderStatus[]> {
  const roles: DiskFolderRole[] = ['primary', 'mirror', 'backup', 'cloudSync'];
  const syncMap = getLastSyncMap();

  if (isElectronDesktop() && window.kinezioDesktop) {
    const env = await window.kinezioDesktop.getEnvironment();
    return roles.map((role) => {
      const dirPath = env.paths[role] ?? '';
      return {
        role,
        configured: Boolean(dirPath),
        label: ROLE_LABELS[role],
        pathOrName: dirPath || 'Не выбрана',
        permissionGranted: Boolean(dirPath),
        lastSyncedAt: syncMap[role],
        backend: 'electron',
      };
    });
  }

  const supported = isBrowserFsAccessSupported();
  const statuses: DiskFolderStatus[] = [];
  for (const role of roles) {
    if (!supported) {
      statuses.push({
        role,
        configured: false,
        label: ROLE_LABELS[role],
        pathOrName: 'Браузер не поддерживает прямой доступ к папкам (используйте файлы или macOS .dmg)',
        permissionGranted: false,
        lastSyncedAt: syncMap[role],
        backend: 'unavailable',
      });
      continue;
    }
    const rec = await getBrowserHandle(role);
    const granted = rec ? await ensureBrowserHandlePermission(rec.handle, false) : false;
    statuses.push({
      role,
      configured: Boolean(rec),
      label: ROLE_LABELS[role],
      pathOrName: rec ? rec.name : 'Папка не выбрана',
      permissionGranted: granted,
      lastSyncedAt: syncMap[role],
      backend: 'fs-access',
    });
  }
  return statuses;
}

export async function pickDiskFolder(role: DiskFolderRole): Promise<{
  selected: boolean;
  pathOrName?: string;
  error?: string;
}> {
  if (isElectronDesktop() && window.kinezioDesktop) {
    const res = await window.kinezioDesktop.pickDirectory(role);
    if (res.canceled || !res.path) return { selected: false };
    notifyStorageStatus();
    if (role === 'primary' || role === 'mirror') {
      await syncToDiskRole(role);
    }
    return { selected: true, pathOrName: res.path };
  }

  if (!isBrowserFsAccessSupported()) {
    return {
      selected: false,
      error:
        'Прямой выбор папок на диске поддерживается в Chrome, Edge, Яндекс Браузере и в настольной версии для macOS (.dmg). Для текущего браузера доступно сохранение и загрузка файлов вручную.',
    };
  }

  try {
    const picker = (window as DirectoryPickerWindow).showDirectoryPicker!;
    const handle = await picker({ id: `kinezio_${role}`, mode: 'readwrite' });
    await ensureBrowserHandlePermission(handle, true);
    await saveBrowserHandle(role, handle);
    notifyStorageStatus();
    if (role === 'primary' || role === 'mirror') {
      await syncToDiskRole(role);
    }
    return { selected: true, pathOrName: handle.name };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { selected: false };
    }
    return {
      selected: false,
      error: err instanceof Error ? err.message : 'Не удалось получить доступ к папке',
    };
  }
}

export async function requestBrowserFolderPermission(role: DiskFolderRole): Promise<boolean> {
  if (isElectronDesktop()) return true;
  const rec = await getBrowserHandle(role);
  if (!rec) return false;
  const ok = await ensureBrowserHandlePermission(rec.handle, true);
  notifyStorageStatus();
  return ok;
}

export async function clearDiskFolder(role: DiskFolderRole): Promise<void> {
  if (isElectronDesktop() && window.kinezioDesktop) {
    await window.kinezioDesktop.clearDirectoryPath(role);
  } else {
    await deleteBrowserHandle(role);
  }
  notifyStorageStatus();
}

export async function openFolderOnDisk(role: DiskFolderRole): Promise<boolean> {
  if (!isElectronDesktop() || !window.kinezioDesktop) return false;
  const env = await window.kinezioDesktop.getEnvironment();
  const target = env.paths[role];
  if (!target) return false;
  return window.kinezioDesktop.openFolder(target);
}

function loadLearningProgressSafe(): LearningProgressState | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_LEARNING_PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as LearningProgressState) : null;
  } catch {
    return null;
  }
}

function saveLearningProgressSafe(progress: LearningProgressState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LS_LEARNING_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // ignore
  }
}

export async function buildExchangePackage(
  cloudTarget: 'yandex' | 'google' | 'file' = 'file'
): Promise<KinezioAtlasExchangePackage> {
  const { machineId, machineLabel } = getMachineIdentity();
  const [{ patients, visits }, mmtMedia, dirMedia, directoryOverrides] = await Promise.all([
    loadPatientDatabase(),
    exportAllMmtMedia(),
    exportAllDirectoryMedia(),
    loadAllDirectoryOverrides(),
  ]);
  const studyNotes = loadStudyNotes();
  const learningProgress = loadLearningProgressSafe();

  return {
    format: 'kinezioatlas-exchange',
    schemaVersion: 2,
    appVersion: getCurrentAppVersion(),
    sourceMachineId: machineId,
    sourceMachineLabel: machineLabel,
    cloudTarget,
    exportedAt: new Date().toISOString(),
    stats: {
      patients: patients.length,
      visits: visits.length,
      studyNotes: studyNotes.length,
      directoryOverrides: Object.keys(directoryOverrides).length,
      customPhotos: mmtMedia.photos.length + dirMedia.photos.length,
    },
    data: {
      patients,
      visits,
      studyNotes,
      learningProgress,
      mmtPhotos: mmtMedia.photos,
      mmtOverlayArrows: mmtMedia.overlayArrows,
      directoryPhotos: dirMedia.photos,
      directoryOverlayArrows: dirMedia.overlayArrows,
      directoryOverrides,
    },
  };
}

function parseIncomingSnapshot(jsonText: string): KinezioAtlasExchangePackage {
  const parsed = JSON.parse(jsonText) as Partial<KinezioAtlasExchangePackage> & {
    version?: number;
    patients?: PatientProfile[];
    visits?: PatientVisitRecord[];
  };

  if (parsed.format === 'kinezioatlas-exchange' && parsed.data) {
    return {
      format: 'kinezioatlas-exchange',
      schemaVersion: 2,
      appVersion: parsed.appVersion ?? '1.0.0',
      sourceMachineId: parsed.sourceMachineId ?? 'unknown',
      sourceMachineLabel: parsed.sourceMachineLabel ?? 'Внешний ПК',
      exportedAt: parsed.exportedAt ?? new Date().toISOString(),
      stats: {
        patients: parsed.data.patients?.length ?? 0,
        visits: parsed.data.visits?.length ?? 0,
        studyNotes: parsed.data.studyNotes?.length ?? 0,
        directoryOverrides: Object.keys(parsed.data.directoryOverrides ?? {}).length,
        customPhotos:
          (parsed.data.mmtPhotos?.length ?? 0) + (parsed.data.directoryPhotos?.length ?? 0),
      },
      data: {
        patients: Array.isArray(parsed.data.patients) ? parsed.data.patients : [],
        visits: Array.isArray(parsed.data.visits) ? parsed.data.visits : [],
        studyNotes: Array.isArray(parsed.data.studyNotes) ? parsed.data.studyNotes : [],
        learningProgress: parsed.data.learningProgress ?? null,
        mmtPhotos: Array.isArray(parsed.data.mmtPhotos) ? parsed.data.mmtPhotos : [],
        mmtOverlayArrows: parsed.data.mmtOverlayArrows ?? {},
        directoryPhotos: Array.isArray(parsed.data.directoryPhotos)
          ? parsed.data.directoryPhotos
          : [],
        directoryOverlayArrows: parsed.data.directoryOverlayArrows ?? {},
        directoryOverrides: parsed.data.directoryOverrides ?? {},
      },
    };
  }

  // Legacy v1 PatientDatabaseSnapshot compatibility
  if (Array.isArray(parsed.patients) && Array.isArray(parsed.visits)) {
    return {
      format: 'kinezioatlas-exchange',
      schemaVersion: 2,
      appVersion: '1.0.0',
      sourceMachineId: 'legacy-v1',
      sourceMachineLabel: 'Резервная копия базы пациентов (v1)',
      exportedAt: parsed.exportedAt ?? new Date().toISOString(),
      stats: {
        patients: parsed.patients.length,
        visits: parsed.visits.length,
        studyNotes: 0,
        directoryOverrides: 0,
        customPhotos: 0,
      },
      data: {
        patients: parsed.patients,
        visits: parsed.visits,
        studyNotes: [],
        learningProgress: null,
        mmtPhotos: [],
        mmtOverlayArrows: {},
        directoryPhotos: [],
        directoryOverlayArrows: {},
        directoryOverrides: {},
      },
    };
  }

  throw new Error('Неизвестный формат файла данных КинезиоАтлас.');
}

export async function previewExchangePackage(jsonText: string): Promise<ExchangePreviewDiff> {
  const pkg = parseIncomingSnapshot(jsonText);
  const [{ patients: curPatients, visits: curVisits }, curOverrides] = await Promise.all([
    loadPatientDatabase(),
    loadAllDirectoryOverrides(),
  ]);
  const curNotes = loadStudyNotes();

  const patMap = new Map(curPatients.map((p) => [p.id, p]));
  let newPatients = 0;
  let updatedPatients = 0;
  for (const p of pkg.data.patients) {
    const prev = patMap.get(p.id);
    if (!prev) newPatients++;
    else if ((p.updatedAt ?? '') > (prev.updatedAt ?? '')) updatedPatients++;
  }

  const visSet = new Set(curVisits.map((v) => v.id));
  const newVisits = pkg.data.visits.filter((v) => !visSet.has(v.id)).length;

  const noteSet = new Set(curNotes.map((n) => n.id));
  const newNotes = pkg.data.studyNotes.filter((n) => !noteSet.has(n.id)).length;

  let newOverrides = 0;
  for (const key of Object.keys(pkg.data.directoryOverrides)) {
    if (!curOverrides[key]) newOverrides++;
  }

  return {
    sourceMachineLabel: pkg.sourceMachineLabel,
    exportedAt: pkg.exportedAt,
    appVersion: pkg.appVersion,
    formatLabel:
      pkg.sourceMachineId === 'legacy-v1'
        ? 'Архив пациентов v1'
        : 'Полный пакет обмена КинезиоАтлас v2',
    incomingPatients: pkg.data.patients.length,
    incomingVisits: pkg.data.visits.length,
    incomingNotes: pkg.data.studyNotes.length,
    incomingOverrides: Object.keys(pkg.data.directoryOverrides).length,
    incomingPhotos: pkg.data.mmtPhotos.length + pkg.data.directoryPhotos.length,
    newPatients,
    updatedPatients,
    newVisits,
    newOverrides,
    newNotes,
  };
}

export async function importExchangePackage(
  jsonText: string,
  mode: 'merge' | 'replace' = 'merge'
): Promise<SyncMergeReport> {
  const pkg = parseIncomingSnapshot(jsonText);
  const { patients: curPatients, visits: curVisits } = await loadPatientDatabase();
  const curPatMap = new Map(curPatients.map((p) => [p.id, p]));
  const curVisMap = new Map(curVisits.map((v) => [v.id, v]));

  let patientsAdded = 0;
  let patientsUpdated = 0;
  let visitsAdded = 0;
  let visitsUpdated = 0;

  for (const p of pkg.data.patients) {
    const prev = curPatMap.get(p.id);
    if (!prev) patientsAdded++;
    else if (mode === 'replace' || (p.updatedAt ?? '') > (prev.updatedAt ?? '')) patientsUpdated++;
  }
  for (const v of pkg.data.visits) {
    const prev = curVisMap.get(v.id);
    if (!prev) visitsAdded++;
    else if (mode === 'replace' || (v.updatedAt ?? '') > (prev.updatedAt ?? '')) visitsUpdated++;
  }

  let finalPatients: PatientProfile[];
  let finalVisits: PatientVisitRecord[];

  if (mode === 'replace') {
    const replaced = await replacePatientDatabase(pkg.data.patients, pkg.data.visits);
    finalPatients = replaced.patients;
    finalVisits = replaced.visits;
  } else {
    const merged = await importDatabaseSnapshot(
      JSON.stringify({
        version: 1,
        exportedAt: pkg.exportedAt,
        patients: pkg.data.patients,
        visits: pkg.data.visits,
      })
    );
    finalPatients = merged.patients;
    finalVisits = merged.visits;
  }

  // Merge or replace Study Notes
  let notesAdded = 0;
  let notesUpdated = 0;
  if (pkg.data.studyNotes.length > 0 || mode === 'replace') {
    const curNotes = mode === 'replace' ? [] : loadStudyNotes();
    const noteMap = new Map<string, StudyNote>(curNotes.map((n) => [n.id, n]));
    for (const n of pkg.data.studyNotes) {
      if (!n || typeof n.id !== 'string') continue;
      const prev = noteMap.get(n.id);
      if (!prev) {
        notesAdded++;
        noteMap.set(n.id, n);
      } else if (mode === 'replace' || (n.updatedAt ?? '') > (prev.updatedAt ?? '')) {
        notesUpdated++;
        noteMap.set(n.id, n);
      }
    }
    saveStudyNotes(
      Array.from(noteMap.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    );
  }

  // Merge learning progress (keep highest unlockedStep and union/best results)
  if (pkg.data.learningProgress) {
    const curProg = mode === 'replace' ? null : loadLearningProgressSafe();
    if (!curProg) {
      saveLearningProgressSafe(pkg.data.learningProgress);
    } else {
      const mergedResults = { ...curProg.results };
      for (const [k, res] of Object.entries(pkg.data.learningProgress.results ?? {})) {
        const prev = mergedResults[k];
        if (!prev || res.scorePct > prev.scorePct) {
          mergedResults[k] = res;
        }
      }
      saveLearningProgressSafe({
        unlockedStep: Math.max(curProg.unlockedStep, pkg.data.learningProgress.unlockedStep ?? 1),
        results: mergedResults,
      });
    }
  }

  // Import media (MMT + Directory)
  const [mmtRes, dirRes] = await Promise.all([
    importMmtMediaBatch(pkg.data.mmtPhotos, pkg.data.mmtOverlayArrows, mode),
    importDirectoryMediaBatch(pkg.data.directoryPhotos, pkg.data.directoryOverlayArrows, mode),
  ]);

  // Import Directory content overrides
  const ovRes = await importDirectoryOverridesBatch(pkg.data.directoryOverrides, mode);

  return {
    mode,
    sourceMachineLabel: pkg.sourceMachineLabel,
    exportedAt: pkg.exportedAt,
    patientsAdded,
    patientsUpdated,
    visitsAdded,
    visitsUpdated,
    notesAdded,
    notesUpdated,
    photosAdded: mmtRes.photosAdded + dirRes.photosAdded,
    overridesAdded: ovRes.added,
    overridesUpdated: ovRes.updated,
    totalPatients: finalPatients.length,
    totalVisits: finalVisits.length,
  };
}

async function writeTextToRoleFolder(
  role: DiskFolderRole,
  filename: string,
  content: string,
  requestPermission: boolean
): Promise<{ ok: boolean; location?: string; error?: string }> {
  if (isElectronDesktop() && window.kinezioDesktop) {
    const env = await window.kinezioDesktop.getEnvironment();
    const dirPath = env.paths[role];
    if (!dirPath) return { ok: false, error: 'Папка не выбрана' };
    const res = await window.kinezioDesktop.writeTextFile(dirPath, filename, content);
    if (!res.ok) return { ok: false, error: res.error || 'Ошибка записи на диск' };
    setLastSyncTimestamp(role, new Date().toISOString());
    return { ok: true, location: res.fullPath || `${dirPath}/${filename}` };
  }

  const rec = await getBrowserHandle(role);
  if (!rec) return { ok: false, error: 'Папка не выбрана' };
  const granted = await ensureBrowserHandlePermission(rec.handle, requestPermission);
  if (!granted) {
    return { ok: false, error: 'Требуется подтвердить разрешение на запись в выбранную папку' };
  }
  try {
    const fileHandle = await rec.handle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    setLastSyncTimestamp(role, new Date().toISOString());
    return { ok: true, location: `${rec.name}/${filename}` };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Ошибка записи файла в папку',
    };
  }
}

async function listFilesInRoleFolder(
  role: DiskFolderRole,
  requestPermission = false
): Promise<BackupFileMeta[]> {
  if (isElectronDesktop() && window.kinezioDesktop) {
    const env = await window.kinezioDesktop.getEnvironment();
    const dirPath = env.paths[role];
    if (!dirPath) return [];
    const files = await window.kinezioDesktop.listFiles(dirPath);
    return files
      .filter((f) => f.filename.endsWith('.json'))
      .map((f) => ({ ...f, sourceBackend: 'electron' as const }))
      .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  }

  const rec = await getBrowserHandle(role);
  if (!rec) return [];
  const granted = await ensureBrowserHandlePermission(rec.handle, requestPermission);
  if (!granted) return [];

  const handle = rec.handle as PermissionAwareHandle;
  if (typeof handle.values !== 'function') return [];

  const items: BackupFileMeta[] = [];
  for await (const entry of handle.values()) {
    if (entry.kind === 'file' && entry.name.endsWith('.json')) {
      const file = await (entry as FileSystemFileHandle).getFile();
      items.push({
        filename: entry.name,
        sizeBytes: file.size,
        modifiedAt: new Date(file.lastModified).toISOString(),
        sourceBackend: 'fs-access',
      });
    }
  }
  return items.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

async function readTextFromRoleFolder(
  role: DiskFolderRole,
  filename: string
): Promise<string> {
  if (isElectronDesktop() && window.kinezioDesktop) {
    const env = await window.kinezioDesktop.getEnvironment();
    const dirPath = env.paths[role];
    if (!dirPath) throw new Error('Папка не выбрана');
    const res = await window.kinezioDesktop.readTextFile(dirPath, filename);
    if (!res.ok || typeof res.content !== 'string') {
      throw new Error(res.error || 'Не удалось прочитать файл');
    }
    return res.content;
  }

  const rec = await getBrowserHandle(role);
  if (!rec) throw new Error('Папка не выбрана');
  const granted = await ensureBrowserHandlePermission(rec.handle, true);
  if (!granted) throw new Error('Нет доступа к чтению выбранной папки');
  const fileHandle = await rec.handle.getFileHandle(filename);
  const file = await fileHandle.getFile();
  return file.text();
}

export async function syncToDiskRole(
  role: 'primary' | 'mirror',
  requestPermission = true
): Promise<{ ok: boolean; location?: string; error?: string }> {
  const pkg = await buildExchangePackage('file');
  const filename =
    role === 'primary' ? 'kinezioatlas-primary-db.json' : 'kinezioatlas-mirror-latest.json';
  return writeTextToRoleFolder(role, filename, JSON.stringify(pkg, null, 2), requestPermission);
}

export async function createDiskBackup(): Promise<{
  ok: boolean;
  filename: string;
  location?: string;
  viaDownload: boolean;
  error?: string;
}> {
  const pkg = await buildExchangePackage('file');
  const now = new Date();
  const stamp = `${now.toISOString().slice(0, 10)}_${now
    .toTimeString()
    .slice(0, 8)
    .replace(/:/g, '-')}`;
  const filename = `kinezioatlas-backup-${stamp}.json`;
  const jsonText = JSON.stringify(pkg, null, 2);

  const statuses = await getAllFolderStatuses();
  const backupStatus = statuses.find((s) => s.role === 'backup');
  if (backupStatus?.configured) {
    const writeRes = await writeTextToRoleFolder('backup', filename, jsonText, true);
    if (writeRes.ok) {
      return { ok: true, filename, location: writeRes.location, viaDownload: false };
    }
  }

  // Fallback to browser download
  downloadTextFile(filename, jsonText);
  return { ok: true, filename, viaDownload: true };
}

export async function listDiskBackups(): Promise<BackupFileMeta[]> {
  return listFilesInRoleFolder('backup', false);
}

export async function restoreBackupFromDisk(filename: string): Promise<SyncMergeReport> {
  const text = await readTextFromRoleFolder('backup', filename);
  return importExchangePackage(text, 'replace');
}

export async function exportCloudExchange(
  provider: 'yandex' | 'google' | 'file'
): Promise<{ ok: boolean; filename: string; location?: string; viaDownload: boolean }> {
  const pkg = await buildExchangePackage(provider);
  const safeLabel = pkg.sourceMachineLabel
    .replace(/[^a-zA-Zа-яА-Я0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24) || 'PC';
  const stamp = `${new Date().toISOString().slice(0, 10)}_${new Date()
    .toTimeString()
    .slice(0, 5)
    .replace(':', '-')}`;
  const filename = `kinezioatlas-sync-${safeLabel}-${stamp}.kinezio.json`;
  const jsonText = JSON.stringify(pkg, null, 2);

  const statuses = await getAllFolderStatuses();
  const cloudStatus = statuses.find((s) => s.role === 'cloudSync');
  if (cloudStatus?.configured) {
    const res = await writeTextToRoleFolder('cloudSync', filename, jsonText, true);
    if (res.ok) {
      return { ok: true, filename, location: res.location, viaDownload: false };
    }
  }

  downloadTextFile(filename, jsonText);
  return { ok: true, filename, viaDownload: true };
}

export async function listCloudExchangeFiles(): Promise<BackupFileMeta[]> {
  return listFilesInRoleFolder('cloudSync', false);
}

export async function readCloudExchangeFile(filename: string): Promise<string> {
  return readTextFromRoleFolder('cloudSync', filename);
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

export function setupAutoMirrorListeners(): () => void {
  if (typeof window === 'undefined') return () => {};
  let timer: ReturnType<typeof setTimeout> | null = null;

  const scheduleSync = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        const statuses = await getAllFolderStatuses();
        const primary = statuses.find((s) => s.role === 'primary');
        if (primary?.configured && primary.permissionGranted) {
          await syncToDiskRole('primary', false);
        }
        if (getAutoMirrorEnabled()) {
          const mirror = statuses.find((s) => s.role === 'mirror');
          if (mirror?.configured && mirror.permissionGranted) {
            await syncToDiskRole('mirror', false);
          }
        }
      } catch {
        // Silent background mirror guard
      }
    }, 1500);
  };

  const events = [
    PATIENT_DB_UPDATED_EVENT,
    STUDY_NOTES_UPDATED_EVENT,
    MMT_MEDIA_UPDATED_EVENT,
    DIRECTORY_MEDIA_UPDATED_EVENT,
    DIRECTORY_OVERRIDES_UPDATED_EVENT,
  ];
  events.forEach((ev) => window.addEventListener(ev, scheduleSync));
  return () => {
    if (timer) clearTimeout(timer);
    events.forEach((ev) => window.removeEventListener(ev, scheduleSync));
  };
}
