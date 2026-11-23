/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __APP_VERSION__: string;

interface KinezioDesktopBridge {
  isElectron: boolean;
  getEnvironment: () => Promise<{
    platform: string;
    arch: string;
    runningUnderARM64Translation?: boolean;
    osRelease?: string;
    appVersion: string;
    userDataPath: string;
    machineLabel: string;
    detectedCloudFolders: Array<{ provider: 'yandex' | 'google'; label: string; path: string }>;
    paths: Record<string, string>;
  }>;
  pickDirectory: (role: string, defaultPath?: string) => Promise<{ canceled: boolean; path?: string }>;
  setDirectoryPath: (role: string, dirPath: string) => Promise<boolean>;
  clearDirectoryPath: (role: string) => Promise<boolean>;
  writeTextFile: (dirPath: string, filename: string, content: string) => Promise<{ ok: boolean; fullPath?: string; error?: string }>;
  readTextFile: (dirPath: string, filename: string) => Promise<{ ok: boolean; content?: string; error?: string }>;
  listFiles: (dirPath: string) => Promise<Array<{ filename: string; sizeBytes: number; modifiedAt: string }>>;
  openFolder: (dirPath: string) => Promise<boolean>;
  openExternal: (url: string) => Promise<boolean>;
  requestMicrophoneAccess: () => Promise<{ status: string; granted: boolean }>;
  openMicrophoneSettings: () => Promise<boolean>;
  checkForUpdates: (feedUrl: string) => Promise<{
    ok: boolean;
    manifest?: {
      version: string;
      releaseDate?: string;
      notes?: string[];
      dmgUrl?: string;
      dmgArm64Url?: string;
      dmgX64Url?: string;
      dmgUniversalUrl?: string;
      zipUrl?: string;
      releasesPageUrl?: string;
    };
    error?: string;
  }>;
  openUpdatePackage?: () => Promise<{
    canceled: boolean;
    ok: boolean;
    filePath?: string;
    error?: string;
  }>;
  speechCacheRead?: (cacheKey: string) => Promise<{
    ok: boolean;
    bytes?: Uint8Array;
    contentType?: string;
  }>;
  speechCacheWrite?: (
    cacheKey: string,
    bytes: Uint8Array,
    contentType?: string
  ) => Promise<{ ok: boolean; error?: string }>;
}

interface Window {
  kinezioDesktop?: KinezioDesktopBridge;
}
