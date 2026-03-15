/**
 * Embedded Gateway Wrapper
 *
 * This module wraps the openclaw-core embedded gateway for use in Electron.
 * Instead of spawning a CLI process, it runs the gateway directly in-process.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const log = require('electron-log');

// Gateway configuration
const GATEWAY_PORT = 18789;
const CHECK_INTERVAL = 5000; // 5秒检查一次
const MAX_LOG_BUFFER = 2000; // 最大日志缓冲条数

// Gateway state
let gateway = null;
let statusCheckInterval = null;
let currentStatus = 'stopped';
let logUnsubscribe = null;

// 日志缓冲区
let logBuffer = [];

// Callbacks
let onStatusChange = null;
let onLog = null;

// Status helpers
function setStatus(newStatus, error = null) {
  if (currentStatus !== newStatus) {
    currentStatus = newStatus;
    if (onStatusChange) {
      onStatusChange(newStatus, error);
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

function setOnLog(callback) {
  onLog = callback;
}

/**
 * Get the path to the openclaw-core embedded module
 */
function getEmbeddedModulePath() {
  // In development, use the source directly
  const devPath = path.join(__dirname, '../../openclaw-core/dist/embedded/index.js');

  // In production, use the bundled path
  const prodPath = path.join(process.resourcesPath, 'openclaw-core/dist/embedded/index.js');

  // Try dev path first, then prod path
  const fs = require('fs');
  if (fs.existsSync(devPath)) {
    return devPath;
  }
  return prodPath;
}

/**
 * Check if gateway is running (fallback HTTP check)
 */
async function checkGatewayRunning() {
  const http = require('http');
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

/**
 * Start the embedded gateway
 */
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
  log.info('Starting OpenClaw Gateway (embedded mode)...');

  try {
    // Check if already running externally
    const alreadyRunning = await checkGatewayRunning();
    if (alreadyRunning) {
      setStatus('running');
      log.info('Gateway was already running externally');
      startStatusCheck();
      return true;
    }

    // Load the embedded module
    const embeddedPath = getEmbeddedModulePath();
    log.info(`Loading embedded module from: ${embeddedPath}`);

    const { createEmbeddedGateway } = require(embeddedPath);

    // Create the embedded gateway instance
    gateway = await createEmbeddedGateway({
      port: GATEWAY_PORT,
      onLog: (entry) => {
        // Add to buffer
        addLogToBuffer(entry);

        // Forward log entries to callback
        if (onLog) {
          onLog(entry);
        }

        // Also log to electron-log based on level
        const msg = `[${entry.subsystem}] ${entry.message}`;
        switch (entry.level) {
          case 'error':
          case 'fatal':
            log.error(msg);
            break;
          case 'warn':
            log.warn(msg);
            break;
          case 'debug':
          case 'trace':
            log.debug(msg);
            break;
          default:
            log.info(msg);
        }
      },
      onStatusChange: (status) => {
        // Map embedded status to our status
        const stateMap = {
          'starting': 'starting',
          'running': 'running',
          'stopping': 'stopping',
          'stopped': 'stopped',
          'error': 'error'
        };
        setStatus(stateMap[status.state] || status.state, status.lastError);
      },
      onReady: () => {
        log.info('Gateway is ready');
        setStatus('running');
        startStatusCheck();
      },
      onError: (error) => {
        log.error('Gateway error:', error);
        setStatus('error', error.message);
      }
    });

    // Start the gateway
    await gateway.start();

    log.info('Gateway started successfully (embedded mode)');
    return true;

  } catch (error) {
    log.error('Failed to start embedded Gateway:', error);
    setStatus('error', error.message);

    // Fallback: try CLI mode
    log.info('Falling back to CLI mode...');
    return await startCliMode();
  }
}

/**
 * Fallback: Start using CLI (original method)
 */
async function startCliMode() {
  const { spawn } = require('child_process');

  try {
    // Windows uses npx openclaw gateway start
    if (process.platform === 'win32') {
      const gatewayProcess = spawn('npx', ['openclaw', 'gateway', 'start'], {
        shell: true,
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });

      gatewayProcess.unref();
    } else {
      // Linux/macOS
      const gatewayProcess = spawn('openclaw', ['gateway', 'start'], {
        detached: true,
        stdio: 'ignore'
      });

      gatewayProcess.unref();
    }

    // Wait for startup
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 1000));
      const running = await checkGatewayRunning();
      if (running) {
        setStatus('running');
        startStatusCheck();
        log.info('Gateway started successfully (CLI mode)');
        return true;
      }
      attempts++;
    }

    setStatus('error');
    log.error('Gateway failed to start within timeout (CLI mode)');
    return false;

  } catch (error) {
    log.error('Failed to start Gateway (CLI mode):', error);
    setStatus('error', error.message);
    return false;
  }
}

/**
 * Stop the gateway
 */
async function stop() {
  if (currentStatus === 'stopped') {
    log.info('Gateway already stopped');
    return true;
  }

  setStatus('stopping');
  log.info('Stopping OpenClaw Gateway...');

  // Stop status check
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval);
    statusCheckInterval = null;
  }

  // If using embedded mode
  if (gateway) {
    try {
      await gateway.stop('User requested');
      gateway = null;
      setStatus('stopped');
      log.info('Gateway stopped successfully (embedded mode)');
      return true;
    } catch (error) {
      log.error('Failed to stop embedded Gateway:', error);
      setStatus('error', error.message);
      return false;
    }
  }

  // Fallback: CLI mode stop
  const { execSync } = require('child_process');
  try {
    if (process.platform === 'win32') {
      execSync('npx openclaw gateway stop', { shell: true, timeout: 10000 });
    } else {
      execSync('openclaw gateway stop', { timeout: 10000 });
    }

    // Wait for stop
    let attempts = 0;
    const maxAttempts = 15;

    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 1000));
      const running = await checkGatewayRunning();
      if (!running) {
        setStatus('stopped');
        log.info('Gateway stopped successfully (CLI mode)');
        return true;
      }
      attempts++;
    }

    setStatus('error');
    log.error('Gateway failed to stop within timeout');
    return false;

  } catch (error) {
    log.error('Failed to stop Gateway (CLI mode):', error);

    // Check actual status
    const running = await checkGatewayRunning();
    if (!running) {
      setStatus('stopped');
      return true;
    }
    setStatus('error', error.message);
    return false;
  }
}

/**
 * Restart the gateway
 */
async function restart() {
  log.info('Restarting OpenClaw Gateway...');
  await stop();
  await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds
  return await start();
}

/**
 * Start periodic status check
 */
function startStatusCheck() {
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval);
  }

  statusCheckInterval = setInterval(async () => {
    if (gateway) {
      // Use embedded status
      try {
        const status = gateway.getStatus();
        const state = status.state;
        if (state !== currentStatus) {
          setStatus(state, status.lastError);
        }
      } catch (error) {
        log.error('Failed to get gateway status:', error);
      }
    } else {
      // Fallback to HTTP check
      const running = await checkGatewayRunning();
      setStatus(running ? 'running' : 'stopped');
    }
  }, CHECK_INTERVAL);
}

/**
 * Get detailed gateway status
 */
function getDetailedStatus() {
  if (gateway) {
    return gateway.getStatus();
  }
  return {
    state: currentStatus,
    port: GATEWAY_PORT,
    uptime: 0,
    connections: 0,
    channels: {}
  };
}

/**
 * Get current config
 */
function getConfig() {
  if (gateway) {
    return gateway.getConfig();
  }
  return null;
}

/**
 * Update config
 */
async function updateConfig(config) {
  if (gateway) {
    return await gateway.updateConfig(config);
  }
  throw new Error('Gateway not running');
}

/**
 * Initialize on load
 */
async function init() {
  const running = await checkGatewayRunning();
  setStatus(running ? 'running' : 'stopped');
  if (running) {
    startStatusCheck();
  }
}

/**
 * Get logs from buffer
 */
function getLogs() {
  return [...logBuffer];
}

/**
 * Get log files list
 */
function getLogFiles() {
  const logDir = path.join(os.tmpdir(), 'openclaw');
  try {
    if (!fs.existsSync(logDir)) {
      return [];
    }
    const files = fs.readdirSync(logDir)
      .filter(f => f.endsWith('.log'))
      .map(f => {
        const filePath = path.join(logDir, f);
        const stat = fs.statSync(filePath);
        return {
          name: f,
          path: filePath,
          size: stat.size,
          modified: stat.mtime
        };
      })
      .sort((a, b) => b.modified - a.modified);
    return files;
  } catch (err) {
    log.error('Failed to list log files:', err);
    return [];
  }
}

/**
 * Read a specific log file
 */
function readLogFile(filename) {
  const logDir = path.join(os.tmpdir(), 'openclaw');
  const filePath = path.join(logDir, filename);

  // 安全检查：确保文件在日志目录内
  if (!filePath.startsWith(logDir)) {
    throw new Error('Invalid log file path');
  }

  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    log.error('Failed to read log file:', err);
    return null;
  }
}

/**
 * Add log entry to buffer
 */
function addLogToBuffer(entry) {
  logBuffer.push({
    ...entry,
    timestamp: entry.timestamp || Date.now()
  });

  // 保持缓冲区大小
  if (logBuffer.length > MAX_LOG_BUFFER) {
    logBuffer = logBuffer.slice(-MAX_LOG_BUFFER);
  }
}

// Export
module.exports = {
  start,
  stop,
  restart,
  getStatus,
  getDetailedStatus,
  setOnStatusChange,
  setOnLog,
  getConfig,
  updateConfig,
  init,
  getLogs,
  getLogFiles,
  readLogFile
};

// Auto-initialize
init();