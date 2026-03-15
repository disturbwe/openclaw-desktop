const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('openclaw', {
  // Gateway 管理
  gateway: {
    start: () => ipcRenderer.invoke('gateway:start'),
    stop: () => ipcRenderer.invoke('gateway:stop'),
    restart: () => ipcRenderer.invoke('gateway:restart'),
    status: () => ipcRenderer.invoke('gateway:status'),
    detailedStatus: () => ipcRenderer.invoke('gateway:detailedStatus'),

    // 监听状态变化
    onStatusChange: (callback) => {
      const handler = (event, data) => callback(data);
      ipcRenderer.on('gateway:status-update', handler);
      // 返回取消订阅函数
      return () => ipcRenderer.removeListener('gateway:status-update', handler);
    },

    // 配置
    getConfig: () => ipcRenderer.invoke('gateway:getConfig'),
    updateConfig: (config) => ipcRenderer.invoke('gateway:updateConfig', config),

    // 日志
    getLogs: () => ipcRenderer.invoke('gateway:getLogs'),
    getLogFiles: () => ipcRenderer.invoke('gateway:getLogFiles'),
    readLogFile: (filename) => ipcRenderer.invoke('gateway:readLogFile', filename)
  },

  // 应用控制
  app: {
    quit: () => ipcRenderer.invoke('app:quit'),
    minimize: () => ipcRenderer.invoke('app:minimize')
  },

  // 导航监听
  onNavigate: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('navigate', handler);
    return () => ipcRenderer.removeListener('navigate', handler);
  },

  // 主动导航
  navigate: (path) => ipcRenderer.invoke('navigate', path),

  // 平台信息
  platform: process.platform,

  // 版本信息
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});