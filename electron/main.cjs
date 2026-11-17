const { app, BrowserWindow, dialog, ipcMain, Menu, shell, net, session, systemPreferences } = require('electron');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');

const CONFIG_FILENAME = 'kinezioatlas-storage-config.json';

function getConfigFilePath() {
  return path.join(app.getPath('userData'), CONFIG_FILENAME);
}

function readStorageConfig() {
  try {
    const raw = fs.readFileSync(getConfigFilePath(), 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorageConfig(config) {
  try {
    fs.mkdirSync(path.dirname(getConfigFilePath()), { recursive: true });
    fs.writeFileSync(getConfigFilePath(), JSON.stringify(config, null, 2), 'utf8');
  } catch {
    // ignore
  }
}

function detectLocalCloudFolders() {
  const home = os.homedir();
  const candidates = [
    { provider: 'yandex', label: 'Яндекс.Диск (~/Yandex.Disk.localized)', path: path.join(home, 'Yandex.Disk.localized') },
    { provider: 'yandex', label: 'Яндекс.Диск (~/Yandex.Disk)', path: path.join(home, 'Yandex.Disk') },
    { provider: 'google', label: 'Google Диск (~/Google Drive)', path: path.join(home, 'Google Drive') },
    { provider: 'google', label: 'Google Диск (~/Мой диск)', path: path.join(home, 'Мой диск') },
  ];

  // macOS FileProvider CloudStorage locations
  const cloudStorageDir = path.join(home, 'Library', 'CloudStorage');
  if (fs.existsSync(cloudStorageDir)) {
    try {
      const entries = fs.readdirSync(cloudStorageDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const lower = entry.name.toLowerCase();
        if (lower.includes('googledrive')) {
          candidates.push({
            provider: 'google',
            label: `Google Диск (${entry.name})`,
            path: path.join(cloudStorageDir, entry.name),
          });
        } else if (lower.includes('yandex')) {
          candidates.push({
            provider: 'yandex',
            label: `Яндекс.Диск (${entry.name})`,
            path: path.join(cloudStorageDir, entry.name),
          });
        }
      }
    } catch {
      // ignore
    }
  }

  return candidates.filter((item) => {
    try {
      return fs.existsSync(item.path) && fs.statSync(item.path).isDirectory();
    } catch {
      return false;
    }
  });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about', label: 'О программе КинезиоАтлас' },
              { type: 'separator' },
              { role: 'services', label: 'Службы' },
              { type: 'separator' },
              { role: 'hide', label: 'Скрыть' },
              { role: 'hideOthers', label: 'Скрыть остальные' },
              { role: 'unhide', label: 'Показать все' },
              { type: 'separator' },
              { role: 'quit', label: 'Выйти из КинезиоАтлас' },
            ],
          },
        ]
      : []),
    {
      label: 'Файл',
      submenu: [isMac ? { role: 'close', label: 'Закрыть окно' } : { role: 'quit', label: 'Выход' }],
    },
    {
      label: 'Правка',
      submenu: [
        { role: 'undo', label: 'Отменить' },
        { role: 'redo', label: 'Повторить' },
        { type: 'separator' },
        { role: 'cut', label: 'Вырезать' },
        { role: 'copy', label: 'Копировать' },
        { role: 'paste', label: 'Вставить' },
        { role: 'selectAll', label: 'Выделить всё' },
      ],
    },
    {
      label: 'Вид',
      submenu: [
        { role: 'reload', label: 'Обновить' },
        { role: 'resetZoom', label: 'Исходный масштаб' },
        { role: 'zoomIn', label: 'Увеличить' },
        { role: 'zoomOut', label: 'Уменьшить' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Полноэкранный режим' },
        { role: 'toggleDevTools', label: 'Инструменты разработчика' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    title: 'КинезиоАтлас',
    backgroundColor: '#f8fafc',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  const allowedPermissions = new Set([
    'media',
    'microphone',
    'audioCapture',
    'speech-recognition',
    'clipboard-sanitized-write',
    'notifications',
  ]);
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    return allowedPermissions.has(permission);
  });
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(allowedPermissions.has(permission));
  });

  buildMenu();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('kinezio:get-environment', async () => {
  const cfg = readStorageConfig();
  return {
    platform: process.platform,
    arch: process.arch,
    appVersion: app.getVersion(),
    userDataPath: app.getPath('userData'),
    machineLabel: os.hostname() || 'Mac-кабинет',
    detectedCloudFolders: detectLocalCloudFolders(),
    paths: cfg.paths || {},
  };
});

ipcMain.handle('kinezio:pick-directory', async (event, role, defaultPath) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const res = await dialog.showOpenDialog(win, {
    title: 'Выберите папку на диске для КинезиоАтлас',
    defaultPath: defaultPath || app.getPath('documents'),
    properties: ['openDirectory', 'createDirectory'],
  });
  if (res.canceled || !res.filePaths || res.filePaths.length === 0) {
    return { canceled: true };
  }
  const chosen = res.filePaths[0];
  const cfg = readStorageConfig();
  cfg.paths = { ...(cfg.paths || {}), [role]: chosen };
  writeStorageConfig(cfg);
  return { canceled: false, path: chosen };
});

ipcMain.handle('kinezio:set-directory-path', async (_event, role, dirPath) => {
  const cfg = readStorageConfig();
  cfg.paths = { ...(cfg.paths || {}), [role]: dirPath };
  writeStorageConfig(cfg);
  return true;
});

ipcMain.handle('kinezio:clear-directory-path', async (_event, role) => {
  const cfg = readStorageConfig();
  if (cfg.paths && cfg.paths[role]) {
    delete cfg.paths[role];
    writeStorageConfig(cfg);
  }
  return true;
});

ipcMain.handle('kinezio:write-text-file', async (_event, dirPath, filename, content) => {
  try {
    const safeName = path.basename(filename);
    const fullPath = path.join(dirPath, safeName);
    await fsp.mkdir(dirPath, { recursive: true });
    await fsp.writeFile(fullPath, content, 'utf8');
    return { ok: true, fullPath };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
});

ipcMain.handle('kinezio:read-text-file', async (_event, dirPath, filename) => {
  try {
    const safeName = path.basename(filename);
    const fullPath = path.join(dirPath, safeName);
    const content = await fsp.readFile(fullPath, 'utf8');
    return { ok: true, content };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
});

ipcMain.handle('kinezio:list-files', async (_event, dirPath) => {
  try {
    const entries = await fsp.readdir(dirPath, { withFileTypes: true });
    const out = [];
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const fullPath = path.join(dirPath, entry.name);
      const stat = await fsp.stat(fullPath);
      out.push({
        filename: entry.name,
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      });
    }
    return out;
  } catch {
    return [];
  }
});

ipcMain.handle('kinezio:open-folder', async (_event, dirPath) => {
  if (!dirPath) return false;
  const res = await shell.openPath(dirPath);
  return res === '';
});

ipcMain.handle('kinezio:open-external', async (_event, url) => {
  if (!url) return false;
  await shell.openExternal(url);
  return true;
});

ipcMain.handle('kinezio:request-microphone', async () => {
  if (process.platform !== 'darwin') {
    return { status: 'granted', granted: true };
  }
  const current = systemPreferences.getMediaAccessStatus('microphone');
  if (current === 'granted') {
    return { status: 'granted', granted: true };
  }
  if (current === 'not-determined') {
    const granted = await systemPreferences.askForMediaAccess('microphone');
    return {
      status: systemPreferences.getMediaAccessStatus('microphone'),
      granted,
    };
  }
  return { status: current, granted: false };
});

ipcMain.handle('kinezio:open-mic-settings', async () => {
  if (process.platform === 'darwin') {
    await shell.openExternal(
      'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone'
    );
    return true;
  }
  return false;
});

ipcMain.handle('kinezio:check-updates', async (_event, feedUrl) => {
  return new Promise((resolve) => {
    try {
      const request = net.request(feedUrl);
      let body = '';
      request.on('response', (response) => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          resolve({ ok: false, error: `HTTP ${response.statusCode}` });
          return;
        }
        response.on('data', (chunk) => {
          body += chunk.toString('utf8');
        });
        response.on('end', () => {
          try {
            const manifest = JSON.parse(body);
            resolve({ ok: true, manifest });
          } catch (e) {
            resolve({ ok: false, error: 'Некорректный JSON манифеста обновлений' });
          }
        });
      });
      request.on('error', (err) => {
        resolve({ ok: false, error: err.message });
      });
      request.end();
    } catch (err) {
      resolve({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });
});
