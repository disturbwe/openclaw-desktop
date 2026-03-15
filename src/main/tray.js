const { Tray, Menu, nativeImage, app, BrowserWindow } = require('electron');
const path = require('path');
const log = require('electron-log');

let tray = null;

function createTray(mainWindow, gatewayManager) {
  // 创建托盘图标
  const iconPath = path.join(__dirname, '../../assets/icon.png');
  let icon;

  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      // 如果图标加载失败，创建一个简单的图标
      icon = nativeImage.createEmpty();
    }
  } catch (e) {
    log.warn('Failed to load tray icon:', e);
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  updateTrayMenu(mainWindow, gatewayManager, 'unknown');

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  return tray;
}

function updateTrayMenu(mainWindow, gatewayManager, gatewayStatus) {
  const statusEmoji = {
    'running': '🟢',
    'stopped': '🔴',
    'starting': '🟡',
    'stopping': '🟡',
    'error': '🔴',
    'unknown': '⚪'
  };

  const emoji = statusEmoji[gatewayStatus] || '⚪';

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `${emoji} OpenClaw Desktop`,
      enabled: false
    },
    {
      type: 'separator'
    },
    {
      label: '显示窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: `Gateway: ${gatewayStatus === 'running' ? '运行中' : gatewayStatus === 'stopped' ? '已停止' : gatewayStatus}`,
      enabled: false
    },
    {
      label: '启动 Gateway',
      enabled: gatewayStatus === 'stopped',
      click: () => {
        if (gatewayManager) {
          gatewayManager.start();
        }
      }
    },
    {
      label: '停止 Gateway',
      enabled: gatewayStatus === 'running',
      click: () => {
        if (gatewayManager) {
          gatewayManager.stop();
        }
      }
    },
    {
      label: '重启 Gateway',
      enabled: gatewayStatus === 'running',
      click: () => {
        if (gatewayManager) {
          gatewayManager.restart();
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip(`OpenClaw Desktop - Gateway: ${gatewayStatus}`);
  tray.setContextMenu(contextMenu);
}

module.exports = function(mainWindow, gatewayManager) {
  // 设置状态变化回调
  if (gatewayManager && gatewayManager.setOnStatusChange) {
    gatewayManager.setOnStatusChange((status) => {
      updateTrayMenu(mainWindow, gatewayManager, status);
    });
  }

  // 初始创建托盘
  const tray = createTray(mainWindow, gatewayManager);

  // 定期更新状态
  setInterval(() => {
    if (gatewayManager && gatewayManager.getStatus) {
      updateTrayMenu(mainWindow, gatewayManager, gatewayManager.getStatus());
    }
  }, 5000);

  return tray;
};