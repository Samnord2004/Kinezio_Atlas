import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackupFileMeta,
  DiskFolderRole,
  DiskFolderStatus,
  SyncMergeReport,
  UpdateCheckResult,
} from '../types/atlas';
import {
  ExchangePreviewDiff,
  buildExchangePackage,
  clearDiskFolder,
  createDiskBackup,
  downloadTextFile,
  exportCloudExchange,
  getAllFolderStatuses,
  getAutoMirrorEnabled,
  getMachineIdentity,
  importExchangePackage,
  isBrowserFsAccessSupported,
  isElectronDesktop,
  listCloudExchangeFiles,
  listDiskBackups,
  openFolderOnDisk,
  pickDiskFolder,
  previewExchangePackage,
  readCloudExchangeFile,
  requestBrowserFolderPermission,
  restoreBackupFromDisk,
  setAutoMirrorEnabled,
  setMachineLabel,
  syncToDiskRole,
  STORAGE_ENGINE_STATUS_EVENT,
} from '../utils/desktopStorageEngine';
import {
  applyServiceWorkerUpdate,
  checkForAppUpdates,
  getCurrentAppVersion,
  getLastUpdateCheck,
  getUpdateFeedUrl,
  setUpdateFeedUrl,
  validateOfflineUpdateManifest,
} from '../utils/appUpdater';
import {
  ArrowDownUp,
  Check,
  CheckCircle2,
  Cloud,
  Copy,
  Download,
  ExternalLink,
  FolderOpen,
  FolderSync,
  HardDrive,
  Laptop,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldAlert,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

interface LocalHostingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPatientsBackup?: () => void;
  onDataImported?: () => void;
  initialTab?: ModalTab;
}

export type ModalTab = 'storage' | 'cloud' | 'updates' | 'macos';

const MAC_COMMANDS = [
  {
    id: 'dist-mac',
    title: '1. Сборка готового установщика .dmg для macOS (Apple Silicon + Intel)',
    desc: 'Собирает production-бандл с относительными путями (VITE_ELECTRON=1) и упаковывает приложение в КинезиоАтлас-1.2.0-universal.dmg в папке release/. Запускается в Терминале на macOS.',
    cmd: 'npm install && npm run dist:mac',
  },
  {
    id: 'electron-start',
    title: '2. Прямой тестовый запуск настольного окна Electron на Mac',
    desc: 'Быстрая проверка настольного режима (с нативным доступом к папкам диска, зеркальным копиям и Finder) без упаковки в .dmg.',
    cmd: 'npm install && npm run electron:start',
  },
  {
    id: 'build-serve',
    title: '3. Локальный запуск браузерной версии с PWA и офлайн-кэшем',
    desc: 'Собирает все таблицы, шрифты и Service Worker в папку dist и поднимает локальный сервер на 0.0.0.0:3000.',
    cmd: 'npm install && npm run serve:local',
  },
  {
    id: 'cloudflared',
    title: '4. Внешний HTTPS-туннель через Cloudflare (для телефона / удалённого ПК)',
    desc: 'Выдаёт защищённую внешнюю ссылку https://*.trycloudflare.com без настройки роутера.',
    cmd: 'cloudflared tunnel --url http://localhost:3000',
  },
];

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
}

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export const LocalHostingModal: React.FC<LocalHostingModalProps> = ({
  isOpen,
  onClose,
  onOpenPatientsBackup,
  onDataImported,
  initialTab = 'storage',
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>(initialTab);
  const [statuses, setStatuses] = useState<DiskFolderStatus[]>([]);
  const [autoMirror, setAutoMirrorState] = useState<boolean>(() => getAutoMirrorEnabled());
  const [machineName, setMachineName] = useState<string>(() => getMachineIdentity().machineLabel);
  const [backups, setBackups] = useState<BackupFileMeta[]>([]);
  const [cloudFiles, setCloudFiles] = useState<BackupFileMeta[]>([]);
  const [detectedCloudFolders, setDetectedCloudFolders] = useState<
    Array<{ provider: 'yandex' | 'google'; label: string; path: string }>
  >([]);
  const [confirmRestoreName, setConfirmRestoreName] = useState<string | null>(null);

  // Preview & Import state
  const [pendingImportJson, setPendingImportJson] = useState<string | null>(null);
  const [pendingPreview, setPendingPreview] = useState<ExchangePreviewDiff | null>(null);
  const [lastMergeReport, setLastMergeReport] = useState<SyncMergeReport | null>(null);

  // Updater state
  const [feedUrl, setFeedUrl] = useState<string>(() => getUpdateFeedUrl());
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(() =>
    getLastUpdateCheck()
  );
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  // Feedback & copy state
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [packageSummary, setPackageSummary] = useState<{
    patients: number;
    visits: number;
    studyNotes: number;
    directoryOverrides: number;
    customPhotos: number;
  } | null>(null);

  const restoreFileRef = useRef<HTMLInputElement>(null);
  const exchangeFileRef = useRef<HTMLInputElement>(null);
  const manifestFileRef = useRef<HTMLInputElement>(null);

  const isElectron = isElectronDesktop();
  const fsSupported = isBrowserFsAccessSupported();
  const appVersion = getCurrentAppVersion();

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const showNotice = useCallback((kind: 'ok' | 'err', text: string) => {
    setBanner({ kind, text });
  }, []);

  const refreshAllStorageState = useCallback(async () => {
    const [st, pkg, bkpList, cldList] = await Promise.all([
      getAllFolderStatuses(),
      buildExchangePackage('file'),
      listDiskBackups(),
      listCloudExchangeFiles(),
    ]);
    setStatuses(st);
    setPackageSummary(pkg.stats);
    setBackups(bkpList);
    setCloudFiles(cldList);

    if (window.kinezioDesktop) {
      const env = await window.kinezioDesktop.getEnvironment();
      setDetectedCloudFolders(env.detectedCloudFolders ?? []);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    refreshAllStorageState();
    const handler = () => {
      refreshAllStorageState();
    };
    window.addEventListener(STORAGE_ENGINE_STATUS_EVENT, handler);
    return () => window.removeEventListener(STORAGE_ENGINE_STATUS_EVENT, handler);
  }, [isOpen, refreshAllStorageState]);

  if (!isOpen) return null;

  const handleSaveMachineName = () => {
    setMachineLabel(machineName);
    showNotice('ok', `Имя рабочего места сохранено: «${machineName.trim()}»`);
  };

  const handlePickFolder = async (role: DiskFolderRole) => {
    setBusyAction(`pick-${role}`);
    try {
      const res = await pickDiskFolder(role);
      if (res.error) {
        showNotice('err', res.error);
      } else if (res.selected) {
        showNotice('ok', `Папка назначена: ${res.pathOrName}`);
        await refreshAllStorageState();
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleAttachDetectedCloud = async (folderPath: string, label: string) => {
    if (!window.kinezioDesktop) return;
    await window.kinezioDesktop.setDirectoryPath('cloudSync', folderPath);
    showNotice('ok', `Подключена папка облака: ${label}`);
    await refreshAllStorageState();
  };

  const handleSyncRoleNow = async (role: 'primary' | 'mirror') => {
    setBusyAction(`sync-${role}`);
    try {
      const res = await syncToDiskRole(role, true);
      if (res.ok) {
        showNotice(
          'ok',
          role === 'primary'
            ? `Основная база сохранена на диск (${res.location})`
            : `Зеркальная копия обновлена (${res.location})`
        );
        await refreshAllStorageState();
      } else {
        showNotice('err', res.error || 'Не удалось записать файл в выбранную папку');
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleCreateBackup = async () => {
    setBusyAction('create-backup');
    try {
      const res = await createDiskBackup();
      if (res.ok) {
        showNotice(
          'ok',
          res.viaDownload
            ? `Архив резервной копии скачан: ${res.filename}`
            : `Резервная копия создана в выбранной папке: ${res.location}`
        );
        await refreshAllStorageState();
      } else {
        showNotice('err', res.error || 'Ошибка создания резервной копии');
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleRestoreBackupFromDisk = async (filename: string) => {
    setBusyAction(`restore-${filename}`);
    try {
      const report = await restoreBackupFromDisk(filename);
      setLastMergeReport(report);
      setConfirmRestoreName(null);
      onDataImported?.();
      await refreshAllStorageState();
      showNotice(
        'ok',
        `Восстановлено из копии ${filename}: карт пациентов ${report.totalPatients}, визитов ${report.totalVisits}.`
      );
    } catch (err) {
      showNotice('err', err instanceof Error ? err.message : 'Ошибка восстановления копии');
    } finally {
      setBusyAction(null);
    }
  };

  const handleRestoreBackupFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusyAction('restore-upload');
    try {
      const text = await file.text();
      const report = await importExchangePackage(text, 'replace');
      setLastMergeReport(report);
      onDataImported?.();
      await refreshAllStorageState();
      showNotice(
        'ok',
        `База полностью восстановлена из ${file.name} (${report.totalPatients} пациентов, ${report.totalVisits} приёмов).`
      );
    } catch (err) {
      showNotice('err', err instanceof Error ? err.message : 'Некорректный файл резервной копии');
    } finally {
      e.target.value = '';
      setBusyAction(null);
    }
  };

  const handleExportCloudPackage = async (provider: 'yandex' | 'google' | 'file') => {
    setBusyAction(`export-${provider}`);
    try {
      const res = await exportCloudExchange(provider);
      await refreshAllStorageState();
      if (res.viaDownload) {
        showNotice(
          'ok',
          `Файл обмена ${res.filename} сохранён в Загрузки. Загрузите его в папку на ${
            provider === 'yandex' ? 'Яндекс.Диске' : provider === 'google' ? 'Google Диске' : 'облачном диске'
          }.`
        );
      } else {
        showNotice('ok', `Файл обмена создан напрямую в облачной папке: ${res.location}`);
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleStageIncomingJson = async (text: string) => {
    try {
      const preview = await previewExchangePackage(text);
      setPendingImportJson(text);
      setPendingPreview(preview);
      setLastMergeReport(null);
    } catch (err) {
      showNotice('err', err instanceof Error ? err.message : 'Ошибка чтения файла обмена');
    }
  };

  const handleExchangeFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await handleStageIncomingJson(text);
    e.target.value = '';
  };

  const handleStageCloudDiskFile = async (filename: string) => {
    setBusyAction(`read-${filename}`);
    try {
      const text = await readCloudExchangeFile(filename);
      await handleStageIncomingJson(text);
    } catch (err) {
      showNotice('err', err instanceof Error ? err.message : 'Ошибка чтения файла из папки');
    } finally {
      setBusyAction(null);
    }
  };

  const handleApplySmartMerge = async () => {
    if (!pendingImportJson) return;
    setBusyAction('apply-merge');
    try {
      const report = await importExchangePackage(pendingImportJson, 'merge');
      setLastMergeReport(report);
      setPendingImportJson(null);
      setPendingPreview(null);
      onDataImported?.();
      await refreshAllStorageState();
      showNotice(
        'ok',
        `Объединение завершено: +${report.patientsAdded} новых карт, обновлено ${report.patientsUpdated}, правок справочника +${report.overridesAdded}.`
      );
    } catch (err) {
      showNotice('err', err instanceof Error ? err.message : 'Ошибка объединения данных');
    } finally {
      setBusyAction(null);
    }
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdates(true);
    try {
      setUpdateFeedUrl(feedUrl);
      const res = await checkForAppUpdates(feedUrl);
      setUpdateResult(res);
    } finally {
      setCheckingUpdates(false);
    }
  };

  const handleManifestFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = validateOfflineUpdateManifest(text);
      setUpdateResult(res);
      showNotice('ok', res.message);
    } catch (err) {
      showNotice('err', err instanceof Error ? err.message : 'Некорректный файл манифеста');
    } finally {
      e.target.value = '';
    }
  };

  const handleCopy = async (id: string, cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const primaryStatus = statuses.find((s) => s.role === 'primary');
  const mirrorStatus = statuses.find((s) => s.role === 'mirror');
  const backupStatus = statuses.find((s) => s.role === 'backup');
  const cloudStatus = statuses.find((s) => s.role === 'cloudSync');

  const renderFolderRow = (
    status: DiskFolderStatus | undefined,
    description: string,
    extraAction?: React.ReactNode
  ) => {
    if (!status) return null;
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900">{status.label}</div>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handlePickFolder(status.role)}
              disabled={busyAction === `pick-${status.role}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{status.configured ? 'Сменить папку' : 'Выбрать папку на диске'}</span>
            </button>
            {status.configured && !status.permissionGranted && !isElectron && (
              <button
                type="button"
                onClick={() => requestBrowserFolderPermission(status.role)}
                className="px-2.5 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-300 hover:bg-amber-100 rounded-lg cursor-pointer whitespace-nowrap"
              >
                Подтвердить доступ
              </button>
            )}
            {status.configured && isElectron && (
              <button
                type="button"
                onClick={() => openFolderOnDisk(status.role)}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer whitespace-nowrap"
              >
                Открыть в Finder
              </button>
            )}
            {status.configured && (
              <button
                type="button"
                onClick={() => clearDiskFolder(status.role)}
                className="p-1.5 text-slate-400 hover:text-rose-700 rounded-md cursor-pointer"
                title="Отвязать папку"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-[11px]">
          <div className="font-mono text-slate-700 truncate max-w-full">
            Путь: <span className="font-semibold">{status.pathOrName}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 tabular-nums shrink-0">
            {status.lastSyncedAt && <span>Синхронизация: {formatDateTime(status.lastSyncedAt)}</span>}
            {extraAction}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <HardDrive className="w-5 h-5 text-blue-700 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                Хранилище на диске, зеркало, облачный обмен и macOS (.dmg)
              </h2>
              <p className="text-xs text-slate-500 truncate">
                Версия {appVersion} · {isElectron ? 'Настольный режим (macOS / Electron)' : 'Веб / PWA режим'}
                {packageSummary && (
                  <>
                    {' '}· Пациентов: <span className="font-mono tabular-nums">{packageSummary.patients}</span> ·
                    Правок атласа: <span className="font-mono tabular-nums">{packageSummary.directoryOverrides}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center gap-1 overflow-x-auto">
          {(
            [
              { id: 'storage', label: 'Хранилище, зеркало и Backup', icon: FolderSync },
              { id: 'cloud', label: 'Обмен (Яндекс / Google Диск)', icon: Cloud },
              { id: 'updates', label: 'Обновления приложения', icon: RefreshCw },
              { id: 'macos', label: 'Сборка macOS (.dmg) и ПК', icon: Laptop },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-blue-700 border border-slate-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Notification Banner */}
        {banner && (
          <div
            className={`px-5 py-2.5 border-b text-xs flex items-center justify-between gap-2 ${
              banner.kind === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <span className="leading-relaxed">{banner.text}</span>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="text-slate-500 hover:text-slate-800 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {/* ==================== TAB 1: STORAGE, MIRROR & BACKUP ==================== */}
          {activeTab === 'storage' && (
            <div className="space-y-5">
              {!isElectron && !fsSupported && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 leading-relaxed">
                  В текущем браузере (например, Safari или Firefox) системный выбор локальной папки
                  для фоновой записи ограничен политикой браузера. Для автоматического сохранения на
                  выбранный диск и зеркалирования используйте настольное приложение macOS (.dmg) или
                  браузер на базе Chromium (Chrome / Яндекс Браузер / Edge). Кнопки скачивания и
                  загрузки резервных копий (.json) работают в любом браузере.
                </div>
              )}

              {/* Primary Disk Storage */}
              {renderFolderRow(
                primaryStatus,
                'Основная папка на диске (внутренний SSD, внешний накопитель или сетевая папка), куда сохраняется файл полной базы kinezioatlas-primary-db.json.',
                primaryStatus?.configured ? (
                  <button
                    type="button"
                    onClick={() => handleSyncRoleNow('primary')}
                    disabled={busyAction === 'sync-primary'}
                    className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    <Save className="w-3 h-3" />
                    <span>Записать сейчас</span>
                  </button>
                ) : null
              )}

              {/* Mirror Folder & Auto-Mirror Control */}
              <div className="space-y-2.5">
                {renderFolderRow(
                  mirrorStatus,
                  'Вторая независимая папка на другом диске или флешке для зеркальной копии (kinezioatlas-mirror-latest.json), защищающей от потери данных.',
                  mirrorStatus?.configured ? (
                    <button
                      type="button"
                      onClick={() => handleSyncRoleNow('mirror')}
                      disabled={busyAction === 'sync-mirror'}
                      className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline cursor-pointer"
                    >
                      <FolderSync className="w-3 h-3" />
                      <span>Обновить зеркало</span>
                    </button>
                  ) : null
                )}

                <label className="flex items-center justify-between gap-3 p-3.5 bg-white border border-slate-200 rounded-xl cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-900">
                      Автоматическое зеркалирование при изменениях
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Автоматически обновляет файл в папке основного хранилища и зеркальной копии
                      через 1.5 сек после сохранения карты пациента, визита, заметки, фото или правки
                      справочника.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoMirror}
                    onChange={(e) => {
                      setAutoMirrorEnabled(e.target.checked);
                      setAutoMirrorState(e.target.checked);
                    }}
                    className="w-4 h-4 accent-blue-700 shrink-0 cursor-pointer"
                  />
                </label>
              </div>

              {/* Backup Folder & Immutable Snapshots */}
              <div className="space-y-3">
                {renderFolderRow(
                  backupStatus,
                  'Архив датированных резервных копий (kinezioatlas-backup-ГГГГ-ММ-ДД.json) для отката на любую сохранённую точку.'
                )}

                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">
                        Создание и восстановление резервных копий (Backup)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Включает пациентов, визиты, заметки, прогресс обучения, фото ММТ/справочника
                        и все ваши корректировки текстов Атласа.
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCreateBackup}
                        disabled={busyAction === 'create-backup'}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Создать Backup сейчас</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => restoreFileRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Восстановить из файла...</span>
                      </button>
                      <input
                        ref={restoreFileRef}
                        type="file"
                        accept=".json,application/json"
                        onChange={handleRestoreBackupFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {backups.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                      {backups.slice(0, 8).map((b) => (
                        <div
                          key={b.filename}
                          className="px-3.5 py-2.5 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-mono font-medium text-slate-800 truncate">
                              {b.filename}
                            </div>
                            <div className="text-[11px] text-slate-500 tabular-nums">
                              {formatDateTime(b.modifiedAt)} · {formatBytes(b.sizeBytes)}
                            </div>
                          </div>
                          {confirmRestoreName === b.filename ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleRestoreBackupFromDisk(b.filename)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded cursor-pointer"
                              >
                                Подтвердить замену базы
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmRestoreName(null)}
                                className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 cursor-pointer"
                              >
                                Отмена
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmRestoreName(b.filename)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-md cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Восстановить</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 pt-1">
                      {backupStatus?.configured
                        ? 'В выбранной папке резервных копий пока нет файлов. Нажмите «Создать Backup сейчас».'
                        : 'Выберите папку для резервных копий выше или создавайте копии с сохранением через Загрузки.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 2: CLOUD EXCHANGE (YANDEX / GOOGLE DRIVE) ==================== */}
          {activeTab === 'cloud' && (
            <div className="space-y-5">
              {/* Machine identity */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900">Идентификатор этого компьютера</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Добавляется в имя файла обмена, чтобы вы видели, с какого ПК пришли данные (например: Кабинет-iMac или Ноутбук).
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={machineName}
                    onChange={(e) => setMachineName(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 w-44"
                    placeholder="Название ПК"
                  />
                  <button
                    type="button"
                    onClick={handleSaveMachineName}
                    className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    Сохранить
                  </button>
                </div>
              </div>

              {/* Cloud Folder Picker + Quick auto-detect in macOS Electron */}
              {renderFolderRow(
                cloudStatus,
                'Укажите локальную папку синхронизации Яндекс.Диска или Google Диска на этом ПК — программа будет читать и записывать пакеты обмена прямо в неё.'
              )}

              {detectedCloudFolders.length > 0 && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                  <div className="font-semibold text-blue-950">
                    Обнаружены локальные папки облачных дисков на этом Mac:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {detectedCloudFolders.map((cf) => (
                      <button
                        key={cf.path}
                        type="button"
                        onClick={() => handleAttachDetectedCloud(cf.path, cf.label)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-800 bg-white border border-blue-200 hover:bg-blue-100 rounded-lg cursor-pointer"
                      >
                        Подключить: {cf.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Export & Import Action Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Upload className="w-4 h-4 text-blue-700" />
                    <span>1. Отправить данные на другой ПК</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Упаковывает все карты пациентов, визиты, заметки, фото ММТ и правки Атласа в
                    единый файл обмена <code>.kinezio.json</code>.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleExportCloudPackage('yandex')}
                      disabled={busyAction === 'export-yandex'}
                      className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Создать файл обмена для Яндекс.Диска</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportCloudPackage('google')}
                      disabled={busyAction === 'export-google'}
                      className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Создать файл обмена для Google Диска</span>
                    </button>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <a
                      href="https://disk.yandex.ru"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-700 hover:underline"
                    >
                      <span>Открыть Яндекс.Диск</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href="https://drive.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-700 hover:underline"
                    >
                      <span>Открыть Google Диск</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <ArrowDownUp className="w-4 h-4 text-emerald-700" />
                    <span>2. Принять и объединить с другим ПК</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Умное слияние сравнивает дату изменения (<code>updatedAt</code>) каждой карты и
                    записи: новые добавляются, а более свежие изменения сохраняются без потери
                    локальной работы.
                  </p>
                  <button
                    type="button"
                    onClick={() => exchangeFileRef.current?.click()}
                    className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Выбрать файл обмена (.kinezio.json / .json)</span>
                  </button>
                  <input
                    ref={exchangeFileRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleExchangeFilePick}
                    className="hidden"
                  />

                  {cloudFiles.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-700">
                        Файлы в подключённой облачной папке:
                      </div>
                      <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                        {cloudFiles.slice(0, 6).map((cf) => (
                          <div
                            key={cf.filename}
                            className="px-2.5 py-2 flex items-center justify-between gap-2 bg-slate-50/50"
                          >
                            <div className="min-w-0">
                              <div className="font-mono text-[11px] text-slate-800 truncate">
                                {cf.filename}
                              </div>
                              <div className="text-[10px] text-slate-500 tabular-nums">
                                {formatDateTime(cf.modifiedAt)} · {formatBytes(cf.sizeBytes)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStageCloudDiskFile(cf.filename)}
                              className="px-2 py-1 text-[11px] font-medium text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded cursor-pointer shrink-0"
                            >
                              Проверить
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Diff & Merge Confirmation */}
              {pendingPreview && (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-blue-950">
                        Предпросмотр объединения данных ({pendingPreview.formatLabel})
                      </div>
                      <div className="text-[11px] text-blue-900 mt-0.5 tabular-nums">
                        Источник: <strong>{pendingPreview.sourceMachineLabel}</strong> · Выгружен:{' '}
                        {formatDateTime(pendingPreview.exportedAt)} · Версия ПО:{' '}
                        {pendingPreview.appVersion}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPendingImportJson(null);
                          setPendingPreview(null);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer"
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={handleApplySmartMerge}
                        disabled={busyAction === 'apply-merge'}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                      >
                        Объединить в текущую базу
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                    <div className="p-2 bg-white border border-blue-100 rounded-lg">
                      <div className="text-[11px] text-slate-500">Пациенты (новых / свежих)</div>
                      <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                        +{pendingPreview.newPatients} / {pendingPreview.updatedPatients}
                      </div>
                    </div>
                    <div className="p-2 bg-white border border-blue-100 rounded-lg">
                      <div className="text-[11px] text-slate-500">Новых приёмов</div>
                      <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                        +{pendingPreview.newVisits}
                      </div>
                    </div>
                    <div className="p-2 bg-white border border-blue-100 rounded-lg">
                      <div className="text-[11px] text-slate-500">Новых заметок</div>
                      <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                        +{pendingPreview.newNotes}
                      </div>
                    </div>
                    <div className="p-2 bg-white border border-blue-100 rounded-lg">
                      <div className="text-[11px] text-slate-500">Правок справочника</div>
                      <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                        +{pendingPreview.newOverrides}
                      </div>
                    </div>
                    <div className="p-2 bg-white border border-blue-100 rounded-lg">
                      <div className="text-[11px] text-slate-500">Фото в пакете</div>
                      <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                        {pendingPreview.incomingPhotos}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {lastMergeReport && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Синхронизация выполнена ({lastMergeReport.mode === 'merge' ? 'Умное слияние' : 'Полное восстановление'}):</strong>{' '}
                    пациентов +{lastMergeReport.patientsAdded} (обновлено{' '}
                    {lastMergeReport.patientsUpdated}), визитов +{lastMergeReport.visitsAdded},
                    заметок +{lastMergeReport.notesAdded}, фото +{lastMergeReport.photosAdded},
                    правок справочника +{lastMergeReport.overridesAdded}. Всего в базе сейчас:{' '}
                    {lastMergeReport.totalPatients} пациентов и {lastMergeReport.totalVisits} приёмов.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 3: UPDATES ==================== */}
          {activeTab === 'updates' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] text-slate-500">Установленная сборка</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                    КинезиоАтлас v{appVersion}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Канал: {isElectron ? 'Настольное приложение macOS (Electron)' : 'Веб / PWA с Service Worker'}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCheckUpdates}
                    disabled={checkingUpdates}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdates ? 'animate-spin' : ''}`} />
                    <span>{checkingUpdates ? 'Проверка...' : 'Проверить обновления'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => manifestFileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Офлайн-пакет (version.json)</span>
                  </button>
                  <input
                    ref={manifestFileRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleManifestFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Update Feed URL configuration */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                <label className="block font-semibold text-slate-900">
                  Источник проверки обновлений (URL файла <code>version.json</code> или GitHub Releases)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={feedUrl}
                    onChange={(e) => setFeedUrl(e.target.value)}
                    placeholder="./version.json или https://.../version.json"
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUpdateFeedUrl(feedUrl);
                      showNotice('ok', 'Адрес источника обновлений сохранён');
                    }}
                    className="px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer shrink-0"
                  >
                    Сохранить адрес
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  В веб/PWA-режиме при проверке также опрашивается кэш Service Worker, и при наличии
                  свежей сборки появляется кнопка мгновенной перезагрузки. В macOS-версии проверка
                  сравнивает удалённый <code>version.json</code> и открывает ссылку на новый <code>.dmg</code>.
                </p>
              </div>

              {updateResult && (
                <div
                  className={`p-4 border rounded-xl space-y-2.5 ${
                    updateResult.status === 'sw-ready' || updateResult.status === 'remote-available'
                      ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                      : updateResult.status === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-bold">{updateResult.message}</div>
                    <span className="text-[11px] font-mono tabular-nums opacity-75">
                      Проверено: {formatDateTime(updateResult.checkedAt)}
                    </span>
                  </div>

                  {updateResult.notes && updateResult.notes.length > 0 && (
                    <ul className="list-disc pl-4 space-y-1 text-xs leading-relaxed">
                      {updateResult.notes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  )}

                  {updateResult.status === 'sw-ready' && (
                    <button
                      type="button"
                      onClick={() => applyServiceWorkerUpdate()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Установить обновление и перезагрузить приложение</span>
                    </button>
                  )}

                  {updateResult.status === 'remote-available' && updateResult.downloadUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.kinezioDesktop) {
                          window.kinezioDesktop.openExternal(updateResult.downloadUrl!);
                        } else {
                          window.open(updateResult.downloadUrl, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Скачать обновление (.dmg / дистрибутив)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Current Version Release Notes */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-900">Что нового в текущей версии v{appVersion}</div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                  <li>Подготовка сборки настольного приложения для macOS в формат <code>.dmg</code> (Electron Universal).</li>
                  <li>Редактор данных всех карточек Атласа и Справочника коррекции с заметками врача и сбросом.</li>
                  <li>Выбор папок на диске для основной базы, автоматического зеркала и архива резервных копий.</li>
                  <li>Обмен пакетами <code>.kinezio.json</code> между ПК через Яндекс.Диск и Google Диск с умным слиянием.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ==================== TAB 4: MACOS .DMG PACKAGING & LOCAL HOSTING ==================== */}
          {activeTab === 'macos' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-950 leading-relaxed">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Важно о сборке файла .dmg для macOS:</strong> формирование бинарного
                  образа диска Apple (<code>.dmg</code>) требует системной утилиты macOS{' '}
                  <code>hdiutil</code>, поэтому финальный файл <code>.dmg</code> собирается
                  непосредственно на компьютере Mac (командой <code>npm run dist:mac</code>) либо
                  автоматически в GitHub Actions на раннере <code>macos-14</code> (файл{' '}
                  <code>.github/workflows/build-macos-dmg.yml</code> уже подготовлен в проекте).
                  Конфигурация Electron (<code>electron/main.cjs</code>,{' '}
                  <code>electron/preload.cjs</code>, <code>build/entitlements.mac.plist</code> и{' '}
                  <code>electron-builder</code>) полностью настроена.
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-800 leading-relaxed">
                <div className="font-semibold text-slate-900">
                  Перед запуском команд в Терминале macOS:
                </div>
                <ol className="list-decimal pl-5 space-y-1 text-slate-700">
                  <li>
                    Убедитесь, что установлен <strong>Node.js 20+</strong> (проверка:{' '}
                    <code>node -v</code>).
                  </li>
                  <li>
                    Перейдите в распакованную папку проекта, где лежит файл{' '}
                    <code>package.json</code> (например: <code>cd ~/Downloads/kinezioatlas</code>).
                    Запуск из домашней папки <code>~</code> без перехода в проект вызовет ошибку{' '}
                    <code>npm error</code>.
                  </li>
                </ol>
              </div>

              <div className="space-y-3">
                {MAC_COMMANDS.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/60 space-y-2"
                  >
                    <div className="font-semibold text-slate-900">{item.title}</div>
                    <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                    <div className="flex items-center justify-between gap-2 bg-slate-900 text-slate-100 rounded-md px-3 py-2 font-mono text-[11px]">
                      <code className="overflow-x-auto whitespace-nowrap">{item.cmd}</code>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.cmd)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-white shrink-0 cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Скопировано</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Копировать</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          {onOpenPatientsBackup ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPatientsBackup();
              }}
              className="px-3.5 py-2 text-xs font-medium text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg cursor-pointer"
            >
              Открыть раздел «Пациенты» →
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                downloadTextFile(
                  `KinezioAtlas-manifest-v${appVersion}.json`,
                  JSON.stringify(
                    {
                      version: appVersion,
                      releaseDate: new Date().toISOString().slice(0, 10),
                      notes: ['Локальный снимок версии КинезиоАтлас'],
                    },
                    null,
                    2
                  )
                );
              }}
              className="px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Экспорт version.json
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
