import { AppVersionManifest, UpdateCheckResult } from '../types/atlas';

const LS_UPDATE_FEED_KEY = 'kinezioatlas_update_feed_url_v1';
const LS_LAST_UPDATE_CHECK_KEY = 'kinezioatlas_last_update_check_v1';

export function getCurrentAppVersion(): string {
  return typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__ ? __APP_VERSION__ : '1.4.0';
}

async function resolveDownloadUrlForCurrentArch(
  manifest: Partial<AppVersionManifest>
): Promise<string | undefined> {
  let arch: string | undefined;
  let underRosetta = false;
  if (typeof window !== 'undefined' && window.kinezioDesktop?.getEnvironment) {
    try {
      const env = await window.kinezioDesktop.getEnvironment();
      arch = env.arch;
      underRosetta = Boolean(env.runningUnderARM64Translation);
    } catch {
      // ignore
    }
  }

  if (arch === 'arm64' || underRosetta) {
    return (
      manifest.dmgArm64Url ||
      manifest.dmgUniversalUrl ||
      manifest.dmgUrl ||
      manifest.zipUrl ||
      manifest.releasesPageUrl
    );
  }
  if (arch === 'x64') {
    return (
      manifest.dmgX64Url ||
      manifest.dmgUniversalUrl ||
      manifest.dmgUrl ||
      manifest.zipUrl ||
      manifest.releasesPageUrl
    );
  }
  return (
    manifest.dmgUniversalUrl ||
    manifest.dmgUrl ||
    manifest.dmgArm64Url ||
    manifest.dmgX64Url ||
    manifest.zipUrl ||
    manifest.releasesPageUrl
  );
}

export function getUpdateFeedUrl(): string {
  if (typeof localStorage === 'undefined') return './version.json';
  return localStorage.getItem(LS_UPDATE_FEED_KEY) || './version.json';
}

export function setUpdateFeedUrl(url: string): void {
  if (typeof localStorage === 'undefined') return;
  const trimmed = url.trim();
  if (!trimmed) {
    localStorage.removeItem(LS_UPDATE_FEED_KEY);
  } else {
    localStorage.setItem(LS_UPDATE_FEED_KEY, trimmed);
  }
}

export function compareSemver(a: string, b: string): number {
  const clean = (v: string) =>
    v
      .replace(/^v/i, '')
      .split('-')[0]
      .split('.')
      .map((n) => parseInt(n, 10) || 0);
  const pa = clean(a);
  const pb = clean(b);
  const len = Math.max(pa.length, pb.length, 3);
  for (let i = 0; i < len; i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

export async function checkServiceWorkerUpdate(): Promise<{
  supported: boolean;
  waitingReady: boolean;
}> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return { supported: false, waitingReady: false };
  }
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return { supported: true, waitingReady: false };
    await reg.update();
    if (reg.waiting) {
      return { supported: true, waitingReady: true };
    }
    if (reg.installing) {
      await new Promise<void>((resolve) => {
        const sw = reg.installing;
        if (!sw) {
          resolve();
          return;
        }
        const timeout = setTimeout(resolve, 2500);
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' || sw.state === 'redundant') {
            clearTimeout(timeout);
            resolve();
          }
        });
      });
      return { supported: true, waitingReady: Boolean(reg.waiting) };
    }
    return { supported: true, waitingReady: false };
  } catch {
    return { supported: false, waitingReady: false };
  }
}

export async function applyServiceWorkerUpdate(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg?.waiting) {
    return new Promise<boolean>((resolve) => {
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return;
        reloaded = true;
        resolve(true);
        window.location.reload();
      });
      reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
      setTimeout(() => {
        if (!reloaded) {
          window.location.reload();
        }
      }, 1500);
    });
  }
  window.location.reload();
  return true;
}

export async function checkForAppUpdates(customFeedUrl?: string): Promise<UpdateCheckResult> {
  const currentVersion = getCurrentAppVersion();
  const feedUrl = (customFeedUrl ?? getUpdateFeedUrl()).trim() || './version.json';
  const checkedAt = new Date().toISOString();

  // 1. Check Service Worker update in browser/PWA mode
  const swCheck = await checkServiceWorkerUpdate();
  if (swCheck.waitingReady) {
    const res: UpdateCheckResult = {
      status: 'sw-ready',
      currentVersion,
      latestVersion: currentVersion,
      checkedAt,
      message: 'Загружена новая версия кэша приложения (Service Worker). Нажмите «Установить и перезагрузить».',
    };
    saveLastCheck(res);
    return res;
  }

  // 2. If running inside Electron desktop app, ask Electron main process first for remote HTTP(S) feeds
  if (typeof window !== 'undefined' && window.kinezioDesktop && /^https?:\/\//i.test(feedUrl)) {
    try {
      const electronRes = await window.kinezioDesktop.checkForUpdates(feedUrl);
      if (electronRes.ok && electronRes.manifest?.version) {
        const remoteVer = electronRes.manifest.version;
        const cmp = compareSemver(remoteVer, currentVersion);
        const res: UpdateCheckResult = {
          status: cmp > 0 ? 'remote-available' : 'up-to-date',
          currentVersion,
          latestVersion: remoteVer,
          checkedAt,
          releaseDate: electronRes.manifest.releaseDate,
          notes: electronRes.manifest.notes,
          downloadUrl: await resolveDownloadUrlForCurrentArch(electronRes.manifest),
          message:
            cmp > 0
              ? `Доступна новая версия ${remoteVer} (текущая ${currentVersion}).`
              : `Установлена актуальная версия ${currentVersion}.`,
        };
        saveLastCheck(res);
        return res;
      }
    } catch {
      // Fallback to standard fetch below
    }
  }

  // 3. Fetch version.json manifest
  try {
    const bustUrl = feedUrl.includes('?')
      ? `${feedUrl}&t=${Date.now()}`
      : `${feedUrl}?t=${Date.now()}`;
    const resp = await fetch(bustUrl, { cache: 'no-store' });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    const manifest = (await resp.json()) as Partial<AppVersionManifest>;
    if (!manifest.version) {
      throw new Error('В манифесте отсутствует поле version');
    }
    const cmp = compareSemver(manifest.version, currentVersion);
    const res: UpdateCheckResult = {
      status: cmp > 0 ? 'remote-available' : 'up-to-date',
      currentVersion,
      latestVersion: manifest.version,
      checkedAt,
      releaseDate: manifest.releaseDate,
      notes: Array.isArray(manifest.notes) ? manifest.notes : undefined,
      downloadUrl: await resolveDownloadUrlForCurrentArch(manifest),
      message:
        cmp > 0
          ? `Доступна новая версия ${manifest.version} (текущая ${currentVersion}).`
          : `Установлена актуальная версия ${currentVersion}.`,
    };
    saveLastCheck(res);
    return res;
  } catch (err) {
    const res: UpdateCheckResult = {
      status: 'error',
      currentVersion,
      latestVersion: currentVersion,
      checkedAt,
      message:
        err instanceof Error
          ? `Не удалось проверить обновления (${err.message}). Проверьте подключение или адрес источника обновлений.`
          : 'Не удалось проверить обновления.',
    };
    saveLastCheck(res);
    return res;
  }
}

export function validateOfflineUpdateManifest(jsonText: string): UpdateCheckResult {
  const currentVersion = getCurrentAppVersion();
  const checkedAt = new Date().toISOString();
  const manifest = JSON.parse(jsonText) as Partial<AppVersionManifest>;
  if (!manifest.version || typeof manifest.version !== 'string') {
    throw new Error('Файл манифеста обновления должен содержать поле "version".');
  }
  const cmp = compareSemver(manifest.version, currentVersion);
  return {
    status: cmp > 0 ? 'remote-available' : 'up-to-date',
    currentVersion,
    latestVersion: manifest.version,
    checkedAt,
    releaseDate: manifest.releaseDate,
    notes: Array.isArray(manifest.notes) ? manifest.notes : undefined,
    downloadUrl:
      manifest.dmgUniversalUrl ||
      manifest.dmgUrl ||
      manifest.dmgArm64Url ||
      manifest.dmgX64Url ||
      manifest.zipUrl ||
      manifest.releasesPageUrl,
    message:
      cmp > 0
        ? `Обнаружен пакет версии ${manifest.version} (новее текущей ${currentVersion}).`
        : `Файл содержит версию ${manifest.version} (текущая ${currentVersion} актуальна).`,
  };
}

function saveLastCheck(res: UpdateCheckResult): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LS_LAST_UPDATE_CHECK_KEY, JSON.stringify(res));
  } catch {
    // ignore
  }
}

export function createSimulatedUpdateTestResult(): UpdateCheckResult {
  const currentVersion = getCurrentAppVersion();
  const parts = currentVersion
    .replace(/^v/i, '')
    .split('.')
    .map((n) => parseInt(n, 10) || 0);
  const nextPatch = `${parts[0] ?? 1}.${parts[1] ?? 3}.${(parts[2] ?? 0) + 1}`;
  return {
    status: 'remote-available',
    currentVersion,
    latestVersion: nextPatch,
    checkedAt: new Date().toISOString(),
    releaseDate: new Date().toISOString().slice(0, 10),
    notes: [
      `Тестовая симуляция проверки обновлений (сравнение Semver: ${currentVersion} → ${nextPatch}).`,
      'Проверяет отображение уведомления, списка изменений, кнопки скачивания .dmg и напоминания о Backup.',
      'В реальной работе этот же интерфейс срабатывает при публикации нового public/version.json или GitHub Release.',
    ],
    message: `Тест-режим: обнаружена новая версия ${nextPatch} (текущая ${currentVersion}).`,
  };
}

export function getLastUpdateCheck(): UpdateCheckResult | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_LAST_UPDATE_CHECK_KEY);
    return raw ? (JSON.parse(raw) as UpdateCheckResult) : null;
  } catch {
    return null;
  }
}
