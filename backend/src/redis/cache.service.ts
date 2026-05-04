// ============================================================================
// 美業 SaaS 智慧管理系統 — Redis 緩存服務
// ============================================================================
// 功能：統一的緩存讀寫、過期管理、批量操作、緩存統計
// ============================================================================

import { Provide, Scope, ScopeEnum, Inject, Init } from '@midwayjs/core';
import { RedisClient } from './client';
import redisConfig from '../config/config.redis';
import type {
  CacheOptions,
  CacheResult,
  CacheStats,
  RedisConfig,
} from './types';

/**
 * Redis 緩存服務
 * 封裝所有緩存操作，支援自動序列化/反序列化、TTL 管理、批量操作
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class CacheService {
  @Inject()
  private redisClient: RedisClient;

  private config: RedisConfig;

  @Init()
  init(): void {
    this.config = redisConfig;
  }

  // ========================================================================
  // 基本緩存操作
  // ========================================================================

  /**
   * 獲取緩存
   * @param key 緩存鍵
   * @returns 緩存值，不存在返回 null
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.getClient().get(key);
      this.redisClient.incrementCommandCount();

      if (value === null) {
        return null;
      }

      return this.deserialize<T>(value);
    } catch (err) {
      console.error(`[Cache] 獲取緩存失敗 key=${key}:`, err);
      return null;
    }
  }

  /**
   * 設置緩存
   * @param key 緩存鍵
   * @param value 緩存值
   * @param ttl 過期時間（秒），不傳則使用默認 TTL
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const serialized = this.serialize(value);
      const expireTime = ttl ?? this.config.cache.defaultTTL;

      if (expireTime > 0) {
        await this.redisClient.getClient().setex(key, expireTime, serialized);
      } else {
        // ttl <= 0 表示永不過期
        await this.redisClient.getClient().set(key, serialized);
      }

      this.redisClient.incrementCommandCount();
    } catch (err) {
      console.error(`[Cache] 設置緩存失敗 key=${key}:`, err);
    }
  }

  /**
   * 刪除緩存
   * @param keys 一個或多個緩存鍵
   */
  async del(...keys: string[]): Promise<number> {
    try {
      const result = await this.redisClient.getClient().del(...keys);
      this.redisClient.incrementCommandCount();
      return result;
    } catch (err) {
      console.error(`[Cache] 刪除緩存失敗 keys=${keys.join(',')}:`, err);
      return 0;
    }
  }

  /**
   * 判斷緩存是否存在
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.getClient().exists(key);
      this.redisClient.incrementCommandCount();
      return result === 1;
    } catch (err) {
      console.error(`[Cache] 檢查緩存存在失敗 key=${key}:`, err);
      return false;
    }
  }

  /**
   * 獲取緩存剩餘存活時間
   * @returns 秒數，-1 表示永不過期，-2 表示鍵不存在
   */
  async ttl(key: string): Promise<number> {
    try {
      const result = await this.redisClient.getClient().ttl(key);
      this.redisClient.incrementCommandCount();
      return result;
    } catch {
      return -2;
    }
  }

  /**
   * 獲取緩存並自動刷新 TTL
   * @param key 緩存鍵
   * @param ttl 新的過期時間（秒），不傳則保留原 TTL
   */
  async getAndRefresh<T = unknown>(key: string, ttl?: number): Promise<T | null> {
    try {
      const value = await this.get<T>(key);
      if (value !== null) {
        const expireTime = ttl ?? this.config.cache.defaultTTL;
        await this.redisClient.getClient().expire(key, expireTime);
        this.redisClient.incrementCommandCount();
      }
      return value;
    } catch (err) {
      console.error(`[Cache] 刷新緩存失敗 key=${key}:`, err);
      return null;
    }
  }

  // ========================================================================
  // 緩存穿透防護 - 布隆過濾器操作
  // ========================================================================

  /**
   * 初始化布隆過濾器
   * 使用 Redis 4.0+ 的 BF.RESERVE 命令
   */
  async initBloomFilter(
    key: string,
    errorRate?: number,
    capacity?: number,
  ): Promise<void> {
    try {
      const rate = errorRate ?? this.config.cache.bloomFilter.falsePositiveRate;
      const cap = capacity ?? this.config.cache.bloomFilter.expectedInsertions;
      await this.redisClient.getClient().call('BF.RESERVE', key, rate, cap);
      this.redisClient.incrementCommandCount();
      console.info(`[Cache] 布隆過濾器初始化: key=${key}, errorRate=${rate}, capacity=${cap}`);
    } catch (err: unknown) {
      // BF.RESERVE 在過濾器已存在時會報錯，忽略
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('already exists')) {
        return;
      }
      console.warn(`[Cache] 布隆過濾器初始化失敗 key=${key}:`, err);
    }
  }

  /**
   * 向布隆過濾器添加元素
   */
  async bloomAdd(key: string, item: string): Promise<void> {
    try {
      await this.redisClient.getClient().call('BF.ADD', key, item);
      this.redisClient.incrementCommandCount();
    } catch (err) {
      console.error(`[Cache] 布隆過濾器添加失敗 key=${key}, item=${item}:`, err);
    }
  }

  /**
   * 批量向布隆過濾器添加元素
   */
  async bloomMAdd(key: string, items: string[]): Promise<void> {
    try {
      await this.redisClient.getClient().call('BF.MADD', key, ...items);
      this.redisClient.incrementCommandCount();
    } catch (err) {
      console.error(`[Cache] 布隆過濾器批量添加失敗 key=${key}:`, err);
    }
  }

  /**
   * 檢查元素是否存在於布隆過濾器中
   * @returns true=可能存在（有誤判率），false=一定不存在
   */
  async bloomExists(key: string, item: string): Promise<boolean> {
    try {
      const result = await this.redisClient.getClient().call('BF.EXISTS', key, item);
      this.redisClient.incrementCommandCount();
      return result === 1;
    } catch (err) {
      console.error(`[Cache] 布隆過濾器檢查失敗 key=${key}, item=${item}:`, err);
      return false;
    }
  }

  // ========================================================================
  // 緩存擊穿防護 - 互斥鎖
  // ========================================================================

  /**
   * 嘗試獲取互斥鎖（用於緩存重建）
   * @param key 鎖鍵名
   * @param timeout 鎖超時（毫秒）
   * @returns 是否成功獲取鎖
   */
  async acquireMutexLock(key: string, timeout?: number): Promise<boolean> {
    const lockTimeout = timeout ?? this.config.cache.mutex.lockTimeout;
    const lockKey = `mutex:${key}`;
    const lockValue = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      const result = await this.redisClient.getClient().set(
        lockKey,
        lockValue,
        'PX',
        lockTimeout,
        'NX',
      );
      this.redisClient.incrementCommandCount();
      return result === 'OK';
    } catch (err) {
      console.error(`[Cache] 獲取互斥鎖失敗 key=${lockKey}:`, err);
      return false;
    }
  }

  /**
   * 釋放互斥鎖
   */
  async releaseMutexLock(key: string): Promise<void> {
    const lockKey = `mutex:${key}`;
    try {
      await this.redisClient.getClient().del(lockKey);
      this.redisClient.incrementCommandCount();
    } catch (err) {
      console.error(`[Cache] 釋放互斥鎖失敗 key=${lockKey}:`, err);
    }
  }

  // ========================================================================
  // 高級緩存操作
  // ========================================================================

  /**
   * 安全獲取緩存（含穿透/擊穿防護）
   * 1. 先查緩存，命中直接返回
   * 2. 未命中時檢查布隆過濾器（如啟用）
   * 3. 嘗試獲取互斥鎖（如啟用），防止緩存擊穿
   * 4. 回源查詢數據庫並回填緩存
   *
   * @param key 緩存鍵
   * @param fetchFn 回源查詢函數
   * @param options 緩存選項
   * @returns 緩存結果
   */
  async remember<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<CacheResult<T>> {
    const {
      ttl,
      useBloomFilter = false,
      useMutex = false,
      prefix,
    } = options;

    const fullKey = prefix ? `${prefix}${key}` : key;

    // 1. 嘗試從緩存獲取
    const cached = await this.get<T>(fullKey);
    if (cached !== null) {
      const remainTtl = await this.ttl(fullKey);
      return {
        data: cached,
        fromCache: true,
        key: fullKey,
        ttl: remainTtl,
      };
    }

    // 2. 布隆過濾器檢查（快速過濾不存在 key）
    if (useBloomFilter) {
      const bloomKey = `bloom:${prefix || ''}`;
      const exists = await this.bloomExists(bloomKey, key);
      if (!exists) {
        // 布隆過濾器確定不存在，直接返回 null
        return {
          data: null as unknown as T,
          fromCache: false,
          key: fullKey,
          ttl: -2,
        };
      }
    }

    // 3. 互斥鎖防擊穿
    if (useMutex) {
      const locked = await this.acquireMutexLock(fullKey);
      if (locked) {
        try {
          // 獲取到鎖，執行回源查詢
          const data = await fetchFn();
          if (data !== null && data !== undefined) {
            await this.set(fullKey, data, ttl);
          }
          return {
            data,
            fromCache: false,
            key: fullKey,
          };
        } finally {
          await this.releaseMutexLock(fullKey);
        }
      } else {
        // 未獲取到鎖，等待後重試
        const { retryInterval, maxRetries } = this.config.cache.mutex;
        for (let i = 0; i < maxRetries; i++) {
          await this.sleep(retryInterval);
          const retryData = await this.get<T>(fullKey);
          if (retryData !== null) {
            return {
              data: retryData,
              fromCache: true,
              key: fullKey,
            };
          }
        }
        // 重試次數耗盡，直接回源
        const data = await fetchFn();
        if (data !== null && data !== undefined) {
          await this.set(fullKey, data, ttl);
        }
        return {
          data,
          fromCache: false,
          key: fullKey,
        };
      }
    }

    // 4. 無防護，直接回源
    const data = await fetchFn();
    if (data !== null && data !== undefined) {
      await this.set(fullKey, data, ttl);
    }
    return {
      data,
      fromCache: false,
      key: fullKey,
    };
  }

  /**
   * 批量獲取緩存
   */
  async mget<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redisClient.getClient().mget(keys);
      this.redisClient.incrementCommandCount();
      return values.map(v => (v ? this.deserialize<T>(v) : null));
    } catch (err) {
      console.error(`[Cache] 批量獲取緩存失敗 keys=${keys.join(',')}:`, err);
      return keys.map(() => null);
    }
  }

  /**
   * 批量設置緩存
   */
  async mset(items: Record<string, unknown>, ttl?: number): Promise<void> {
    try {
      const pipeline = this.redisClient.getClient().pipeline();
      const expireTime = ttl ?? this.config.cache.defaultTTL;

      for (const [key, value] of Object.entries(items)) {
        const serialized = this.serialize(value);
        if (expireTime > 0) {
          pipeline.setex(key, expireTime, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      }

      await pipeline.exec();
      this.redisClient.incrementCommandCount();
    } catch (err) {
      console.error(`[Cache] 批量設置緩存失敗:`, err);
    }
  }

  // ========================================================================
  // 模式匹配操作
  // ========================================================================

  /**
   * 根據模式查找鍵
   * @param pattern 匹配模式，如 appt:detail:*
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      const result = await this.redisClient.getClient().keys(pattern);
      this.redisClient.incrementCommandCount();
      return result;
    } catch (err) {
      console.error(`[Cache] 查找鍵失敗 pattern=${pattern}:`, err);
      return [];
    }
  }

  /**
   * 根據模式刪除緩存
   * @param pattern 匹配模式
   */
  async delByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;
      const result = await this.del(...keys);
      return result;
    } catch (err) {
      console.error(`[Cache] 模式刪除緩存失敗 pattern=${pattern}:`, err);
      return 0;
    }
  }

  // ========================================================================
  // 緩存統計
  // ========================================================================

  /**
   * 獲取緩存統計信息
   */
  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redisClient.getClient().info('stats');
      const memoryInfo = await this.redisClient.getMemoryUsage();
      const keyCount = await this.redisClient.getKeyCount();

      // 解析命中率
      const hitsMatch = info.match(/keyspace_hits:(\d+)/);
      const missesMatch = info.match(/keyspace_misses:(\d+)/);
      const hits = hitsMatch ? parseInt(hitsMatch[1], 10) : 0;
      const misses = missesMatch ? parseInt(missesMatch[1], 10) : 0;
      const total = hits + misses;
      const hitRate = total > 0 ? hits / total : 0;

      return {
        hits,
        misses,
        hitRate,
        keyCount,
        usedMemory: memoryInfo.usedMemory,
      };
    } catch (err) {
      console.error('[Cache] 獲取緩存統計失敗:', err);
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        keyCount: 0,
        usedMemory: 'N/A',
      };
    }
  }

  /**
   * 清空所有緩存（謹慎使用）
   */
  async flushAll(): Promise<void> {
    try {
      await this.redisClient.getClient().flushdb();
      this.redisClient.incrementCommandCount();
      console.warn('[Cache] 已清空所有緩存');
    } catch (err) {
      console.error('[Cache] 清空緩存失敗:', err);
    }
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  /**
   * 序列化數據
   */
  private serialize(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value);
  }

  /**
   * 反序列化數據
   */
  private deserialize<T>(value: string): T {
    try {
      return JSON.parse(value) as T;
    } catch {
      // 非 JSON 字符串，直接返回
      return value as unknown as T;
    }
  }

  /**
   * 延遲工具
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
