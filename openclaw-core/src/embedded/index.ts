/**
 * OpenClaw Embedded Gateway API
 *
 * This module provides a simplified API for embedding OpenClaw Gateway
 * into desktop applications (Electron, Tauri, etc.)
 */

import type { GatewayServer, GatewayServerOptions } from "../gateway/server.impl.js";
import type { OpenClawConfig } from "../config/config.js";
import type { LogLevel } from "../logging/levels.js";
import { subscribeToLogs, type LogEntry } from "../logging/subsystem.js";

// Re-export types from subsystem
export type { LogEntry } from "../logging/subsystem.js";

export interface GatewayStatus {
  state: "starting" | "running" | "stopping" | "stopped" | "error";
  port: number;
  uptime: number;
  connections: number;
  channels: Record<string, ChannelStatus>;
  lastError?: string;
}

export interface ChannelStatus {
  enabled: boolean;
  connected: boolean;
  error?: string;
}

export interface EmbeddedGatewayOptions {
  /** Gateway port (default: 18789) */
  port?: number;

  /** Custom config file path */
  configPath?: string;

  /** Custom config object (overrides file) */
  config?: Partial<OpenClawConfig>;

  /** Log callback */
  onLog?: (entry: LogEntry) => void;

  /** Status change callback */
  onStatusChange?: (status: GatewayStatus) => void;

  /** Ready callback */
  onReady?: () => void;

  /** Error callback */
  onError?: (error: Error) => void;

  /** Gateway server options (passed to startGatewayServer) */
  serverOptions?: GatewayServerOptions;
}

export interface EmbeddedGateway {
  /** Start the gateway */
  start(): Promise<void>;

  /** Stop the gateway */
  stop(reason?: string): Promise<void>;

  /** Get current status */
  getStatus(): GatewayStatus;

  /** Get current config */
  getConfig(): OpenClawConfig | null;

  /** Update config (hot reload if possible) */
  updateConfig(config: Partial<OpenClawConfig>): Promise<void>;

  /** Subscribe to logs */
  subscribeToLogs(callback: (entry: LogEntry) => void): () => void;
}

// ============================================================================
// Implementation
// ============================================================================

let currentStatus: GatewayStatus = {
  state: "stopped",
  port: 18789,
  uptime: 0,
  connections: 0,
  channels: {},
};
let statusCheckInterval: ReturnType<typeof setInterval> | null = null;
let startTime: number | null = null;

// Re-export subscribeToLogs from subsystem
export { subscribeToLogs } from "../logging/subsystem.js";

/**
 * Create an embedded gateway instance
 */
export async function createEmbeddedGateway(
  opts: EmbeddedGatewayOptions = {}
): Promise<EmbeddedGateway> {
  const { startGatewayServer } = await import("../gateway/server.impl.js");
  const { loadConfig, writeConfigFile } = await import("../config/config.js");
  const { createSubsystemLogger } = await import("../logging/subsystem.js");

  const port = opts.port ?? 18789;
  let server: GatewayServer | null = null;
  let config: OpenClawConfig | null = null;

  const log = createSubsystemLogger("embedded");

  // Subscribe logs if callback provided
  let logUnsubscribe: (() => void) | null = null;
  if (opts.onLog) {
    logUnsubscribe = subscribeToLogs(opts.onLog);
  }

  // Update status helper
  const updateStatus = (updates: Partial<GatewayStatus>) => {
    currentStatus = { ...currentStatus, ...updates };
    if (opts.onStatusChange) {
      opts.onStatusChange(currentStatus);
    }
  };

  // Start status check interval
  const startStatusCheck = () => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
    statusCheckInterval = setInterval(() => {
      if (startTime) {
        updateStatus({
          uptime: Date.now() - startTime,
        });
      }
    }, 5000);
  };

  // Stop status check interval
  const stopStatusCheck = () => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      statusCheckInterval = null;
    }
  };

  return {
    async start(): Promise<void> {
      if (server) {
        log.warn("Gateway already running");
        return;
      }

      updateStatus({ state: "starting", port });
      log.info(`Starting embedded gateway on port ${port}`);

      try {
        // Load config
        config = loadConfig();

        // Start gateway server
        server = await startGatewayServer(port, opts.serverOptions);
        startTime = Date.now();

        updateStatus({
          state: "running",
          port,
          uptime: 0,
        });
        startStatusCheck();

        log.info(`Gateway started successfully on port ${port}`);

        if (opts.onReady) {
          opts.onReady();
        }
      } catch (error) {
        const err = error as Error;
        updateStatus({
          state: "error",
          lastError: err.message,
        });
        log.error(`Failed to start gateway: ${err.message}`);

        if (opts.onError) {
          opts.onError(err);
        }
        throw err;
      }
    },

    async stop(reason = "User requested"): Promise<void> {
      if (!server) {
        log.warn("Gateway not running");
        return;
      }

      updateStatus({ state: "stopping" });
      log.info(`Stopping gateway: ${reason}`);

      try {
        await server.close({ reason });
        server = null;
        startTime = null;
        stopStatusCheck();

        updateStatus({
          state: "stopped",
          uptime: 0,
        });

        log.info("Gateway stopped");
      } catch (error) {
        const err = error as Error;
        updateStatus({
          state: "error",
          lastError: err.message,
        });
        log.error(`Failed to stop gateway: ${err.message}`);
        throw err;
      }
    },

    getStatus(): GatewayStatus {
      return { ...currentStatus };
    },

    getConfig(): OpenClawConfig | null {
      return config;
    },

    async updateConfig(newConfig: Partial<OpenClawConfig>): Promise<void> {
      if (!config) {
        throw new Error("Gateway not started");
      }

      const merged = { ...config, ...newConfig };
      await writeConfigFile(merged);
      config = merged;

      log.info("Config updated (some changes may require restart)");
    },

    subscribeToLogs(callback: (entry: LogEntry) => void): () => void {
      return subscribeToLogs(callback);
    },
  };
}

// Re-export types
export type { GatewayServerOptions } from "../gateway/server.impl.js";
export type { OpenClawConfig } from "../config/config.js";