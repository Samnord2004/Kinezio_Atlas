const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kinezioDesktop', {
  isElectron: true,
  getEnvironment: () => ipcRenderer.invoke('kinezio:get-environment'),
  pickDirectory: (role, defaultPath) =>
    ipcRenderer.invoke('kinezio:pick-directory', role, defaultPath),
  setDirectoryPath: (role, dirPath) =>
    ipcRenderer.invoke('kinezio:set-directory-path', role, dirPath),
  clearDirectoryPath: (role) => ipcRenderer.invoke('kinezio:clear-directory-path', role),
  writeTextFile: (dirPath, filename, content) =>
    ipcRenderer.invoke('kinezio:write-text-file', dirPath, filename, content),
  readTextFile: (dirPath, filename) =>
    ipcRenderer.invoke('kinezio:read-text-file', dirPath, filename),
  listFiles: (dirPath) => ipcRenderer.invoke('kinezio:list-files', dirPath),
  openFolder: (dirPath) => ipcRenderer.invoke('kinezio:open-folder', dirPath),
  openExternal: (url) => ipcRenderer.invoke('kinezio:open-external', url),
  requestMicrophoneAccess: () => ipcRenderer.invoke('kinezio:request-microphone'),
  openMicrophoneSettings: () => ipcRenderer.invoke('kinezio:open-mic-settings'),
  checkForUpdates: (feedUrl) => ipcRenderer.invoke('kinezio:check-updates', feedUrl),
  openUpdatePackage: () => ipcRenderer.invoke('kinezio:open-update-package'),
  speechCacheRead: (cacheKey) => ipcRenderer.invoke('kinezio:speech-cache-read', cacheKey),
  speechCacheWrite: (cacheKey, bytes, contentType) =>
    ipcRenderer.invoke('kinezio:speech-cache-write', cacheKey, bytes, contentType),
});
