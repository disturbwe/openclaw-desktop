const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const log = require('electron-log');

// 禁用硬件加速 (需要在 app.ready 之前调用)
try {
  if (app && typeof app.disableHardwareAcceleration === 'function') {
    app.disableHardwareAcceleration();
  }
} catch (e) {
  // Ignore
}

const PORT = 7000;
const VITE_DEV_SERVER = 'http://localhost:5173';

// 判断是否为开发模式
const isDev = process.env.NODE_ENV === 'development';

let loadingWindow = null;
let mainWindow = null;

// 单实例锁
let gotTheLock = true;
try {
  if (app && typeof app.requestSingleInstanceLock === 'function') {
    gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
    }
  }
} catch (e) {
  log.warn('Single instance lock not available:', e.message);
}

if (gotTheLock) {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Loading 窗口 HTML
const LOADING_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a24 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #fff;
      overflow: hidden;
    }
    .logo {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 24px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 3px solid rgba(99, 102, 241, 0.2);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .text {
      margin-top: 24px;
      font-size: 14px;
      color: #71717a;
      letter-spacing: 0.5px;
    }
    .status {
      margin-top: 12px;
      font-size: 12px;
      color: #52525b;
    }
  </style>
</head>
<body>
  <div class="logo">OpenClaw</div>
  <div class="spinner"></div>
  <div class="text">Starting OpenClaw...</div>
  <div class="status" id="status">Initializing...</div>
</body>
</html>
`;

function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    resizable: false,
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  loadingWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(LOADING_HTML)}`);
  loadingWindow.show();

  return loadingWindow;
}

function updateLoadingStatus(status) {
  if (loadingWindow && loadingWindow.webContents) {
    loadingWindow.webContents.executeJavaScript(
      `document.getElementById('status').textContent = '${status}';`
    ).catch(() => {});
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'OpenClaw Desktop',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#0a0a0f',
    show: false
  });

  // 加载 React 渲染器 - 开发模式使用 Vite 服务器，生产模式使用构建文件
  if (isDev) {
    mainWindow.loadURL(VITE_DEV_SERVER);
    log.info('Loading from Vite dev server:', VITE_DEV_SERVER);
  } else {
    const rendererPath = path.join(__dirname, '../../dist/renderer/index.html');
    mainWindow.loadURL(`file://${rendererPath}`);
    log.info('Loading from built file:', rendererPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log.info('Window ready and shown');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 最小化到托盘而不是关闭
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

async function startDashboardServer() {
  const { startServer } = require('./dashboard-server');

  const openclawDir = path.join(os.homedir(), '.openclaw');
  const workspaceDir = process.env.WORKSPACE_DIR || os.homedir();

  try {
    await startServer({
      port: PORT,
      openclawDir,
      workspaceDir,
      agentId: 'main',
      htmlPath: path.join(__dirname, '../renderer/index.html')
    });
    log.info(`Dashboard server started on port ${PORT}`);
  } catch (err) {
    log.error('Failed to start dashboard server:', err);
  }
}

// IPC handlers
ipcMain.handle('gateway:status', () => {
  const gateway = require('./embedded-gateway');
  return gateway.getStatus();
});

ipcMain.handle('gateway:detailedStatus', () => {
  const gateway = require('./embedded-gateway');
  return gateway.getDetailedStatus();
});

ipcMain.handle('gateway:start', async () => {
  const gateway = require('./embedded-gateway');
  return await gateway.start();
});

ipcMain.handle('gateway:stop', async () => {
  const gateway = require('./embedded-gateway');
  return await gateway.stop();
});

ipcMain.handle('gateway:restart', async () => {
  const gateway = require('./embedded-gateway');
  return await gateway.restart();
});

// 配置相关
ipcMain.handle('gateway:getConfig', () => {
  const gateway = require('./embedded-gateway');
  return gateway.getConfig();
});

ipcMain.handle('gateway:updateConfig', async (_event, config) => {
  const gateway = require('./embedded-gateway');
  return await gateway.updateConfig(config);
});

// 日志相关
ipcMain.handle('gateway:getLogs', () => {
  const gateway = require('./embedded-gateway');
  return gateway.getLogs ? gateway.getLogs() : [];
});

ipcMain.handle('gateway:getLogFiles', () => {
  const gateway = require('./embedded-gateway');
  return gateway.getLogFiles ? gateway.getLogFiles() : [];
});

ipcMain.handle('gateway:readLogFile', (_event, filename) => {
  const gateway = require('./embedded-gateway');
  return gateway.readLogFile ? gateway.readLogFile(filename) : '';
});

// 窗口截图
ipcMain.handle('window:screenshot', async () => {
  if (mainWindow && mainWindow.webContents) {
    const image = await mainWindow.webContents.capturePage()
    return image.toPNG().toString('base64')
  }
  return null
})

// 导航
ipcMain.handle('navigate', async (_event, path) => {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('navigate', { path });
  }
  return null;
});

// 状态变化推送
function setupStatusPush() {
  const gateway = require('./embedded-gateway');
  gateway.setOnStatusChange((status, error) => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('gateway:status-update', { status, error });
    }
  });
}

app.whenReady().then(async () => {
  log.info('App ready');

  // 1. 显示 Loading 窗口
  createLoadingWindow();
  updateLoadingStatus('Starting dashboard server...');

  // 2. 启动 Dashboard 服务器
  await startDashboardServer();

  // 3. 启动 Gateway 并等待就绪
  updateLoadingStatus('Starting gateway...');
  try {
    const gatewayManager = require('./embedded-gateway');
    await gatewayManager.start();
    log.info('Gateway started successfully');
    updateLoadingStatus('Gateway ready!');
  } catch (err) {
    log.error('Failed to start Gateway:', err);
    updateLoadingStatus('Gateway failed to start');
  }

  // 4. 短暂延迟后关闭 Loading 窗口
  await new Promise(resolve => setTimeout(resolve, 500));

  if (loadingWindow) {
    loadingWindow.close();
    loadingWindow = null;
  }

  // 5. 创建主窗口
  createWindow();

  // 6. 创建托盘
  try {
    const createTray = require('./tray');
    const gatewayManager = require('./embedded-gateway');
    createTray(mainWindow, gatewayManager);
    setupStatusPush();
  } catch (err) {
    log.warn('Failed to create tray:', err);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

// 导出 mainWindow 供 dashboard-server 使用
function getMainWindow() {
  return mainWindow;
}

module.exports = { getMainWindow };