// ============================================================================
// 美業 SaaS 智慧管理系統 — Redis 客戶端封裝
// ============================================================================
// 功能：基於 ioredis 的連接池管理、客戶端實例封裝、健康檢查
// ============================================================================

import { Provide, Scope, ScopeEnum, Init, Destroy } from '@midwayjs/core';
import Redis from 'ioredis';
import redisConfig from '../config/config.redis';

/**
 * Redis 客戶端封裝類
 * 提供連接池管理、自動重連、健康檢查、指標監控
 */
@Provide()
@Scope(ScopeEnum.Singleton) // 單例模式，全局共享一個連接池
export class RedisClient {
  private client: Redis;
  private subscriber: Redis; // 用於發布/訂閱的獨立連接
  private isConnected = false;
  private connectTime: Date | null = null;
  private commandCount = 0;

  // -------- 初始化與銷毀 --------

  @Init()
  async init(): Promise<void> {
    const cfg = redisConfig.redis;
    const { host, port, password, db, maxRetriesPerRequest, retryStrategy,
            connectTimeout, commandTimeout, keepAlive, enableAutoPipelining,
            enableOfflineQueue, lazyConnect } = cfg;

    // 創建主連接（用於常規命令）
    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      db,
      maxRetriesPerRequest,
      retryStrategy,
      connectTimeout,
      commandTimeout,
      keepAlive,
      enableAutoPipelining,
      enableOfflineQueue,
      lazyConnect,
      name: 'salon-pro-main',
    });

    // 創建訂閱連接（用於 Pub/Sub，需保持長連接）
    this.subscriber = new Redis({
      host,
      port,
      password: password || undefined,
      db,
      maxRetriesPerRequest,
      retryStrategy,
      connectTimeout,
      commandTimeout,
      keepAlive,
      enableAutoPipelining: false,
      enableOfflineQueue,
      lazyConnect,
      name: 'salon-pro-subscriber',
    });

    // 綁定事件監聽
    this.bindEvents(this.client, '主連接');
    this.bindEvents(this.subscriber, '訂閱連接');

    // 非延遲連接模式下，等待連接就緒
    if (!lazyConnect) {
      await this.waitForConnection(this.client, '主連接');
      await this.waitForConnection(this.subscriber, '訂閱連接');
    }

    this.connectTime = new Date();
    console.info('[Redis] 客戶端初始化完成');
  }

  @Destroy()
  async destroy(): Promise<void> {
    try {
      await this.client.quit();
      await this.subscriber.quit();
      this.isConnected = false;
      console.info('[Redis] 客戶端已安全關閉');
    } catch (err) {
      console.error('[Redis] 關閉客戶端時出錯:', err);
      // 強制斷開
      this.client.disconnect();
      this.subscriber.disconnect();
    }
  }

  // -------- 事件綁定 --------

  private bindEvents(client: Redis, label: string): void {
    client.on('connect', () => {
      console.info(`[Redis] ${label} - 正在連接...`);
    });

    client.on('ready', () => {
      this.isConnected = true;
      console.info(`[Redis] ${label} - 連接就緒`);
    });

    client.on('error', (err: Error) => {
      console.error(`[Redis] ${label} - 錯誤:`, err.message);
    });

    client.on('close', () => {
      console.warn(`[Redis] ${label} - 連接關閉`);
    });

    client.on('reconnecting', (delay: number) => {
      console.warn(`[Redis] ${label} - 正在重連，延遲 ${delay}ms`);
    });

    client.on('end', () => {
      this.isConnected = false;
      console.error(`[Redis] ${label} - 連接終止`);
    });
  }

  // -------- 連接等待 --------

  private async waitForConnection(client: Redis, label: string): Promise<void> {
    const timeoutMs = redisConfig.redis.connectTimeout || 10000;
    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn(`[Redis] ${label} 連接超時（${timeoutMs}ms），將以降級模式運行`);
        resolve(); // 超時不拋錯，優雅降級
      }, timeoutMs);

      client.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });

      client.once('error', (err: Error) => {
        clearTimeout(timeout);
        console.warn(`[Redis] ${label} 連接錯誤: ${err.message}，將以降級模式運行`);
        resolve(); // 錯誤不拋錯，優雅降級
      });
    });
  }

  // -------- 公開方法 --------

  /**
   * 獲取 Redis 客戶端實例
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * 檢查 Redis 是否已連接
   */
  isReady(): boolean {
    return this.isConnected;
  }

  /**
   * 獲取訂閱用 Redis 客戶端實例
   */
  getSubscriber(): Redis {
    return this.subscriber;
  }

  /**
   * 健康檢查
   * @returns 是否正常連接
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * 獲取連接狀態
   */
  getStatus(): {
    connected: boolean;
    connectTime: Date | null;
    commandCount: number;
    mainStatus: string;
    subStatus: string;
  } {
    return {
      connected: this.isConnected,
      connectTime: this.connectTime,
      commandCount: this.commandCount,
      mainStatus: this.client.status,
      subStatus: this.subscriber.status,
    };
  }

  /**
   * 遞增命令計數器（由各 Service 調用）
   */
  incrementCommandCount(): void {
    this.commandCount++;
  }

  /**
   * 獲取 Redis 服務器信息
   */
  async info(section?: string): Promise<string> {
    return section
      ? this.client.info(section)
      : this.client.info();
  }

  /**
   * 獲取內存使用情況
   */
  async getMemoryUsage(): Promise<{
    usedMemory: string;
    peakMemory: string;
    fragmentation: string;
  }> {
    const info = await this.client.info('memory');
    const lines = info.split('\r\n');
    const getValue = (key: string): string => {
      const line = lines.find((l: string) => l.startsWith(key));
      return line ? line.split(':')[1] : 'N/A';
    };

    return {
      usedMemory: getValue('used_memory_human'),
      peakMemory: getValue('used_memory_peak_human'),
      fragmentation: getValue('mem_fragmentation_ratio'),
    };
  }

  /**
   * 獲取所有鍵的數量
   */
  async getKeyCount(dbIndex?: number): Promise<number> {
    if (dbIndex !== undefined) {
      await this.client.select(dbIndex);
    }
    const info = await this.client.info('keyspace');
    // 解析 keyspace 信息
    const match = info.match(/db\d+:keys=(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
}
