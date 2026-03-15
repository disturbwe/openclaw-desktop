const { spawn, exec, execSync } = require('child_process');
const path = require('path');
const http = require('http');
const log = require('electron-log');

const GATEWAY_PORT = 18789;
const CHECK_INTERVAL = 5000; // 5秒检查一次

let gatewayProcess = null;
let statusCheckInterval = null;
let currentStatus = 'stopped';

// 状态回调
let onStatusChange = null;

function setStatus(newStatus) {
  if (currentStatus !== newStatus) {
    currentStatus = newStatus;
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
    log.info(`Gateway status changed to: ${newStatus}`);
  }
}

function getStatus() {
  return currentStatus;
}

function setOnStatusChange(callback) {
  onStatusChange = callback;
}

// 检查 Gateway 是否运行
async function checkGatewayRunning() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: GATEWAY_PORT,
      path: '/',
      method: 'GET',
      timeout: 2000
    }, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// 启动 Gateway
async function start() {
  if (currentStatus === 'running') {
    log.info('Gateway already running');
    return true;
  }

  if (currentStatus === 'starting') {
    log.info('Gateway already starting');
    return false;
  }

  setStatus('starting');
  log.info('Starting OpenClaw Gateway...');

  try {
    // 检查是否已经在运行
    const alreadyRunning = await checkGatewayRunning();
    if (alreadyRunning) {
      setStatus('running');
      log.info('Gateway was already running');
      return true;
    }

    // Windows 使用 npx openclaw gateway start
    if (process.platform === 'win32') {
      // 使用 spawn 启动后台进程
      gatewayProcess = spawn('npx', ['openclaw', 'gateway', 'start'], {
        shell: true,
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });

      gatewayProcess.unref();
    } else {
      // Linux/macOS
      gatewayProcess = spawn('openclaw', ['gateway', 'start'], {
        detached: true,
        stdio: 'ignore'
      });

      gatewayProcess.unref();
    }

    // 等待启动
    let attempts = 0;
    const maxAttempts = 30; // 30秒超时

    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 1000));
      const running = await checkGatewayRunning();
      if (running) {
        setStatus('running');
        startStatusCheck();
        log.info('Gateway started successfully');
        return true;
      }
      attempts++;
    }

    setStatus('error');
    log.error('Gateway failed to start within timeout');
    return false;

  } catch (error) {
    log.error('Failed to start Gateway:', error);
    setStatus('error');
    return false;
  }
}

// 停止 Gateway
async function stop() {
  if (currentStatus === 'stopped') {
    log.info('Gateway already stopped');
    return true;
  }

  setStatus('stopping');
  log.info('Stopping OpenClaw Gateway...');

  try {
    // 停止状态检查
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      statusCheckInterval = null;
    }

    // 使用 openclaw gateway stop 命令
    if (process.platform === 'win32') {
      execSync('npx openclaw gateway stop', { shell: true, timeout: 10000 });
    } else {
      execSync('openclaw gateway stop', { timeout: 10000 });
    }

    // 等待停止
    let attempts = 0;
    const maxAttempts = 15;

    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 1000));
      const running = await checkGatewayRunning();
      if (!running) {
        setStatus('stopped');
        log.info('Gateway stopped successfully');
        return true;
      }
      attempts++;
    }

    setStatus('error');
    log.error('Gateway failed to stop within timeout');
    return false;

  } catch (error) {
    log.error('Failed to stop Gateway:', error);
    // 即使命令失败，检查实际状态
    const running = await checkGatewayRunning();
    if (!running) {
      setStatus('stopped');
      return true;
    }
    setStatus('error');
    return false;
  }
}

// 重启 Gateway
async function restart() {
  log.info('Restarting OpenClaw Gateway...');
  await stop();
  await new Promise(r => setTimeout(r, 2000)); // 等待2秒
  return await start();
}

// 开始定期状态检查
function startStatusCheck() {
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval);
  }

  statusCheckInterval = setInterval(async () => {
    const running = await checkGatewayRunning();
    setStatus(running ? 'running' : 'stopped');
  }, CHECK_INTERVAL);
}

// 初始化时检查状态
async function init() {
  const running = await checkGatewayRunning();
  setStatus(running ? 'running' : 'stopped');
  if (running) {
    startStatusCheck();
  }
}

// 导出
module.exports = {
  start,
  stop,
  restart,
  getStatus,
  setOnStatusChange,
  init
};

// 自动初始化
init();