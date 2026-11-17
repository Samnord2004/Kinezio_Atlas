import { PatientProfile, PatientVisitRecord } from '../types/atlas';

const DB_NAME = 'kinezioatlas_offline_db_v1';
const DB_VERSION = 1;
const STORE_PATIENTS = 'patients';
const STORE_VISITS = 'visits';
const LS_FALLBACK_KEY = 'kinezioatlas_patients_fallback_v1';

export interface PatientDatabaseSnapshot {
  version: 1;
  exportedAt: string;
  patients: PatientProfile[];
  visits: PatientVisitRecord[];
}

function readLocalFallback(): PatientDatabaseSnapshot {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PatientDatabaseSnapshot>;
      return {
        version: 1,
        exportedAt: parsed.exportedAt ?? new Date().toISOString(),
        patients: Array.isArray(parsed.patients) ? parsed.patients : [],
        visits: Array.isArray(parsed.visits) ? parsed.visits : [],
      };
    }
  } catch {
    // Ignore storage read errors
  }
  return { version: 1, exportedAt: new Date().toISOString(), patients: [], visits: [] };
}

function writeLocalFallback(patients: PatientProfile[], visits: PatientVisitRecord[]): void {
  try {
    const payload: PatientDatabaseSnapshot = {
      version: 1,
      exportedAt: new Date().toISOString(),
      patients,
      visits,
    };
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota errors
  }
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_PATIENTS)) {
          db.createObjectStore(STORE_PATIENTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_VISITS)) {
          const visitStore = db.createObjectStore(STORE_VISITS, { keyPath: 'id' });
          visitStore.createIndex('patientId', 'patientId', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function getAllFromStore<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) ?? []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

function putInStore<T>(db: IDBDatabase, storeName: string, value: T): Promise<void> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

function deleteFromStore(db: IDBDatabase, storeName: string, key: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function loadPatientDatabase(): Promise<{
  patients: PatientProfile[];
  visits: PatientVisitRecord[];
}> {
  const db = await openDatabase();
  const fallback = readLocalFallback();

  if (!db) {
    return {
      patients: sortPatients(fallback.patients),
      visits: sortVisits(fallback.visits),
    };
  }

  let patients = await getAllFromStore<PatientProfile>(db, STORE_PATIENTS);
  let visits = await getAllFromStore<PatientVisitRecord>(db, STORE_VISITS);

  // Hydrate IndexedDB from localStorage fallback if IDB is empty
  if (patients.length === 0 && fallback.patients.length > 0) {
    for (const p of fallback.patients) {
      await putInStore(db, STORE_PATIENTS, p);
    }
    patients = fallback.patients;
  }
  if (visits.length === 0 && fallback.visits.length > 0) {
    for (const v of fallback.visits) {
      await putInStore(db, STORE_VISITS, v);
    }
    visits = fallback.visits;
  }

  db.close();
  writeLocalFallback(patients, visits);

  return {
    patients: sortPatients(patients),
    visits: sortVisits(visits),
  };
}

export const PATIENT_DB_UPDATED_EVENT = 'kinezioatlas:patient-db-updated';

function notifyPatientDbUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PATIENT_DB_UPDATED_EVENT));
  }
}

export async function savePatientProfile(patient: PatientProfile): Promise<void> {
  const db = await openDatabase();
  if (db) {
    await putInStore(db, STORE_PATIENTS, patient);
    db.close();
  }
  const snap = readLocalFallback();
  const nextPatients = [patient, ...snap.patients.filter((p) => p.id !== patient.id)];
  writeLocalFallback(nextPatients, snap.visits);
  notifyPatientDbUpdated();
}

export async function deletePatientProfile(patientId: string): Promise<void> {
  const db = await openDatabase();
  if (db) {
    await deleteFromStore(db, STORE_PATIENTS, patientId);
    const visits = await getAllFromStore<PatientVisitRecord>(db, STORE_VISITS);
    for (const v of visits) {
      if (v.patientId === patientId) {
        await deleteFromStore(db, STORE_VISITS, v.id);
      }
    }
    db.close();
  }
  const snap = readLocalFallback();
  writeLocalFallback(
    snap.patients.filter((p) => p.id !== patientId),
    snap.visits.filter((v) => v.patientId !== patientId)
  );
  notifyPatientDbUpdated();
}

export async function savePatientVisit(visit: PatientVisitRecord): Promise<void> {
  const db = await openDatabase();
  if (db) {
    await putInStore(db, STORE_VISITS, visit);
    db.close();
  }
  const snap = readLocalFallback();
  const nextVisits = [visit, ...snap.visits.filter((v) => v.id !== visit.id)];
  writeLocalFallback(snap.patients, nextVisits);
  notifyPatientDbUpdated();
}

export async function deletePatientVisit(visitId: string): Promise<void> {
  const db = await openDatabase();
  if (db) {
    await deleteFromStore(db, STORE_VISITS, visitId);
    db.close();
  }
  const snap = readLocalFallback();
  writeLocalFallback(
    snap.patients,
    snap.visits.filter((v) => v.id !== visitId)
  );
  notifyPatientDbUpdated();
}

function clearStore(db: IDBDatabase, storeName: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function replacePatientDatabase(
  patients: PatientProfile[],
  visits: PatientVisitRecord[]
): Promise<{ patients: PatientProfile[]; visits: PatientVisitRecord[] }> {
  const sortedPatients = sortPatients(patients);
  const sortedVisits = sortVisits(visits);

  const db = await openDatabase();
  if (db) {
    await clearStore(db, STORE_PATIENTS);
    await clearStore(db, STORE_VISITS);
    for (const p of sortedPatients) await putInStore(db, STORE_PATIENTS, p);
    for (const v of sortedVisits) await putInStore(db, STORE_VISITS, v);
    db.close();
  }
  writeLocalFallback(sortedPatients, sortedVisits);
  notifyPatientDbUpdated();
  return { patients: sortedPatients, visits: sortedVisits };
}

export async function importDatabaseSnapshot(
  jsonText: string
): Promise<{ patients: PatientProfile[]; visits: PatientVisitRecord[]; addedCount: number }> {
  const parsed = JSON.parse(jsonText) as Partial<PatientDatabaseSnapshot> & {
    format?: string;
    data?: { patients?: PatientProfile[]; visits?: PatientVisitRecord[] };
  };
  const incomingPatients = Array.isArray(parsed.patients)
    ? parsed.patients
    : Array.isArray(parsed.data?.patients)
    ? parsed.data.patients
    : null;
  const incomingVisits = Array.isArray(parsed.visits)
    ? parsed.visits
    : Array.isArray(parsed.data?.visits)
    ? parsed.data.visits
    : null;

  if (!incomingPatients || !incomingVisits) {
    throw new Error('Некорректный формат файла резервной копии.');
  }

  const current = await loadPatientDatabase();
  const patientMap = new Map<string, PatientProfile>();
  current.patients.forEach((p) => patientMap.set(p.id, p));
  let addedCount = 0;

  incomingPatients.forEach((p) => {
    if (p && typeof p.id === 'string' && typeof p.fullName === 'string') {
      const existing = patientMap.get(p.id);
      if (!existing) {
        addedCount++;
        patientMap.set(p.id, p);
      } else if ((p.updatedAt ?? '') >= (existing.updatedAt ?? '')) {
        patientMap.set(p.id, p);
      }
    }
  });

  const visitMap = new Map<string, PatientVisitRecord>();
  current.visits.forEach((v) => visitMap.set(v.id, v));
  incomingVisits.forEach((v) => {
    if (v && typeof v.id === 'string' && typeof v.patientId === 'string') {
      const existing = visitMap.get(v.id);
      if (!existing || (v.updatedAt ?? '') >= (existing.updatedAt ?? '')) {
        visitMap.set(v.id, v);
      }
    }
  });

  const mergedPatients = sortPatients(Array.from(patientMap.values()));
  const mergedVisits = sortVisits(Array.from(visitMap.values()));

  const db = await openDatabase();
  if (db) {
    for (const p of mergedPatients) await putInStore(db, STORE_PATIENTS, p);
    for (const v of mergedVisits) await putInStore(db, STORE_VISITS, v);
    db.close();
  }
  writeLocalFallback(mergedPatients, mergedVisits);
  notifyPatientDbUpdated();

  return { patients: mergedPatients, visits: mergedVisits, addedCount };
}

export function createEntityId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function sortPatients(list: PatientProfile[]): PatientProfile[] {
  return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function sortVisits(list: PatientVisitRecord[]): PatientVisitRecord[] {
  return [...list].sort((a, b) =>
    `${b.visitDate}_${b.updatedAt}`.localeCompare(`${a.visitDate}_${a.updatedAt}`)
  );
}

