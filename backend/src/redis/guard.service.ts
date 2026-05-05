// ============================================================================
// 美業 SaaS 智慧管理系統 — 緩存穿透/擊穿防護服務
// ============================================================================
// 功能：布隆過濾器防穿透、互斥鎖防擊穿、空值緩存、熱點 key 識別
// ============================================================================

import { Provide, Scope, ScopeEnum, Inject, Init } from '@midwayjs/core';
import { RedisClient } from './client';
import { CacheService } from './cache.service';
import redisConfig from '../config/config.redis';
import type { RedisConfig, BloomFilterOptions, MutexOptions } from './types';

/**
 * 緩存防護服務
 *
 * 解決三大緩存問題：
 * 1. 緩存穿透：查詢不存在數據，繞過緩存直接打擊 DB
 *    - 解決方案：布隆過濾器 + 空值緩存
 *
 * 2. 緩存擊穿：熱點 key 過期瞬間，大量請求同時打到 DB
 *    - 解決方案：互斥鎖 + 後台異步刷新
 *
 * 3. 緩存雪崩：大量 key 同時過期，DB 壓力暴增
 *    - 解決方案：TTL 隨機化 + 多級緩存
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class CacheGuardService {
  @Inject()
  private redisClient: RedisClient;

  @Inject()
  private cacheService: CacheService;

  private config: RedisConfig;

  // 空值緩存標記
  private readonly NULL_VALUE = '__NULL__';
  // 空值緩存 TTL（秒），比正常緩存短
  private readonly NULL_TTL = 60;

  @Init()
  init(): void {
    this.config = redisConfig;
  }

  // ========================================================================
  // 1. 緩存穿透防護
  // ========================================================================

  /**
   * 初始化業務布隆過濾器
   *
   * @param businessPrefix 業務前綴（如 appointment, member）
   * @param options 布隆過濾器選項
   */
  async initBusinessBloomFilter(
    businessPrefix: string,
    options?: BloomFilterOptions,
  ): Promise<void> {
    const bloomKey = `bloom:${businessPrefix}`;
    await this.cacheService.initBloomFilter(
      bloomKey,
      options?.falsePositiveRate,
      options?.expectedInsertions,
    );
    console.info(`[CacheGuard] 業務布隆過濾器初始化完成: ${bloomKey}`);
  }

  /**
   * 註冊業務 ID 到布隆過濾器
   * 在新增業務數據時調用
   *
   * @param businessPrefix 業務前綴
   * @param businessId 業務 ID
   */
  async registerBusinessId(
    businessPrefix: string,
    businessId: string | number,
  ): Promise<void> {
    const bloomKey = `bloom:${businessPrefix}`;
    await this.cacheService.bloomAdd(bloomKey, String(businessId));
  }

  /**
   * 批量註冊業務 ID
   */
  async registerBusinessIds(
    businessPrefix: string,
    ids: (string | number)[],
  ): Promise<void> {
    const bloomKey = `bloom:${businessPrefix}`;
    const items = ids.map(id => String(id));
    await this.cacheService.bloomMAdd(bloomKey, items);
  }

  /**
   * 檢查業務 ID 是否存在（布隆過濾器）
   * @returns true=可能存在，false=一定不存在
   */
  async checkBusinessIdExists(
    businessPrefix: string,
    businessId: string | number,
  ): Promise<boolean> {
    const bloomKey = `bloom:${businessPrefix}`;
    return this.cacheService.bloomExists(bloomKey, String(businessId));
  }

  /**
   * 安全查詢（含穿透防護）
   *
   * 流程：
   * 1. 查緩存 -> 命中返回
   * 2. 布隆過濾器檢查 -> 不存在則返回空（穿透防護）
   * 3. 查 DB -> 結果為空則緩存空值（防範惡意穿透）
   * 4. 回填緩存
   *
   * @param cacheKey 緩存鍵
   * @param bloomPrefix 布隆過濾器前綴
   * @param businessId 業務 ID
   * @param fetchFn 回源查詢函數
   * @param ttl 緩存 TTL（秒）
   */
  async safeQuery<T>(
    cacheKey: string,
    bloomPrefix: string,
    businessId: string | number,
    fetchFn: () => Promise<T | null>,
    ttl?: number,
  ): Promise<T | null> {
    // 0. 檢查 Redis 是否可用，不可用時直接回源查詢 DB（優雅降級）
    if (!this.redisClient.isReady()) {
      return await fetchFn();
    }

    // 1. 查緩存
    const cached = await this.cacheService.get<T>(cacheKey);
    if (cached !== null) {
      // 檢查是否為空值緩存
      if (this.isNullValue(cached)) {
        return null;
      }
      return cached;
    }

    // 2. 布隆過濾器檢查（快速過濾不存在的 key）
    const bloomKey = `bloom:${bloomPrefix}`;
    const bloomExists = await this.cacheService.bloomExists(bloomKey, String(businessId));
    if (!bloomExists) {
      // 布隆過濾器確定不存在，直接返回 null
      return null;
    }

    // 3. 回源查詢 DB
    const data = await fetchFn();

    // 4. 回填緩存
    if (data === null || data === undefined) {
      // 空值緩存：防止惡意穿透
      await this.cacheService.set(cacheKey, this.NULL_VALUE, this.NULL_TTL);
      return null;
    }

    await this.cacheService.set(cacheKey, data, ttl);
    return data;
  }

  // ========================================================================
  // 2. 緩存擊穿防護
  // ========================================================================

  /**
   * 熱點 key 查詢（含擊穿防護）
   *
   * 使用互斥鎖確保只有一個請求回源查詢 DB，
   * 其他請求等待或返回舊緩存
   *
   * @param cacheKey 緩存鍵
   * @param fetchFn 回源查詢函數
   * @param ttl 緩存 TTL（秒）
   * @param mutexOptions 互斥鎖選項
   */
  async hotKeyQuery<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    ttl?: number,
    mutexOptions?: MutexOptions,
  ): Promise<T> {
    const lockTimeout = mutexOptions?.lockTimeout ?? this.config.cache.mutex.lockTimeout;
    const retryInterval = mutexOptions?.retryInterval ?? this.config.cache.mutex.retryInterval;
    const maxRetries = mutexOptions?.maxRetries ?? this.config.cache.mutex.maxRetries;

    // 1. 嘗試從緩存獲取
    const cached = await this.cacheService.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // 2. 嘗試獲取互斥鎖
    const lockKey = `mutex:hot:${cacheKey}`;
    const lockValue = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      const locked = await this.redisClient.getClient().set(
        lockKey,
        lockValue,
        'PX',
        lockTimeout,
        'NX',
      );
      this.redisClient.incrementCommandCount();

      if (locked === 'OK') {
        // 獲取到鎖，執行回源查詢
        try {
          // 再次檢查緩存（雙重檢查鎖定）
          const doubleCheck = await this.cacheService.get<T>(cacheKey);
          if (doubleCheck !== null) {
            return doubleCheck;
          }

          const data = await fetchFn();
          if (data !== null && data !== undefined) {
            await this.cacheService.set(cacheKey, data, ttl);
          }
          return data;
        } finally {
          // 釋放鎖
          await this.redisClient.getClient().del(lockKey);
          this.redisClient.incrementCommandCount();
        }
      }

      // 3. 未獲取到鎖，等待重試
      for (let i = 0; i < maxRetries; i++) {
        await this.sleep(retryInterval);
        const retryData = await this.cacheService.get<T>(cacheKey);
        if (retryData !== null) {
          return retryData;
        }
      }

      // 重試次數耗盡，直接回源
      const data = await fetchFn();
      if (data !== null && data !== undefined) {
        await this.cacheService.set(cacheKey, data, ttl);
      }
      return data;
    } catch (err) {
      console.error(`[CacheGuard] 熱點 key 查詢失敗 key=${cacheKey}:`, err);
      // 異常時直接回源，保證可用性
      return fetchFn();
    }
  }

  // ========================================================================
  // 3. 緩存雪崩防護
  // ========================================================================

  /**
   * 獲取隨機化 TTL
   * 在基礎 TTL 上增加隨機偏移，防止大量 key 同時過期
   *
   * @param baseTtl 基礎 TTL（秒）
   * @param jitterRange 隨機偏移範圍（秒），默認為基礎 TTL 的 10%
   */
  getRandomizedTtl(baseTtl: number, jitterRange?: number): number {
    const range = jitterRange ?? Math.max(60, Math.floor(baseTtl * 0.1));
    const jitter = Math.floor(Math.random() * range);
    return baseTtl + jitter;
  }

  /**
   * 設置帶隨機 TTL 的緩存（防雪崩）
   */
  async setWithRandomTtl(
    key: string,
    value: unknown,
    baseTtl: number,
  ): Promise<void> {
    const ttl = this.getRandomizedTtl(baseTtl);
    await this.cacheService.set(key, value, ttl);
  }

  // ========================================================================
  // 4. 後台異步緩存刷新
  // ========================================================================

  /**
   * 後台異步刷新緩存
   * 在緩存過期前主動刷新，減少擊穿概率
   *
   * @param cacheKey 緩存鍵
   * @param fetchFn 回源查詢函數
   * @param ttl 緩存 TTL（秒）
   * @param refreshThreshold 刷新閾值（秒），剩餘 TTL 低於此值時觸發刷新
   */
  async refreshCacheAsync(
    cacheKey: string,
    fetchFn: () => Promise<unknown>,
    ttl: number,
    refreshThreshold?: number,
  ): Promise<void> {
    try {
      const threshold = refreshThreshold ?? Math.floor(ttl * 0.2);
      const remainTtl = await this.cacheService.ttl(cacheKey);

      // 緩存不存在或即將過期時刷新
      if (remainTtl < 0 || remainTtl < threshold) {
        const lockKey = `refresh:${cacheKey}`;
        const locked = await this.redisClient.getClient().set(
          lockKey,
          '1',
          'PX',
          5000,
          'NX',
        );
        this.redisClient.incrementCommandCount();

        if (locked === 'OK') {
          try {
            const data = await fetchFn();
            if (data !== null && data !== undefined) {
              await this.cacheService.set(cacheKey, data, ttl);
              console.info(`[CacheGuard] 後台刷新緩存成功: ${cacheKey}`);
            }
          } finally {
            await this.redisClient.getClient().del(lockKey);
            this.redisClient.incrementCommandCount();
          }
        }
      }
    } catch (err) {
      // 後台刷新失敗不影響主流程
      console.warn(`[CacheGuard] 後台刷新緩存失敗 key=${cacheKey}:`, err);
    }
  }

  // ========================================================================
  // 5. 熱點 key 識別與監控
  // ========================================================================

  /**
   * 記錄 key 訪問頻率（用於熱點識別）
   * 使用 Redis HyperLogLog 近似計數
   */
  async recordKeyAccess(key: string): Promise<void> {
    const hourKey = `hot:${new Date().getHours()}:${key}`;
    try {
      await this.redisClient.getClient().pfadd(hourKey, Date.now().toString());
      this.redisClient.incrementCommandCount();
      // 設置 2 小時過期，自動清理
      await this.redisClient.getClient().expire(hourKey, 7200);
      this.redisClient.incrementCommandCount();
    } catch {
      // 記錄失敗不影響主流程
    }
  }

  /**
   * 獲取熱點 key 列表
   * @param threshold 訪問次數閾值
   */
  async getHotKeys(threshold: number = 100): Promise<string[]> {
    try {
      const pattern = 'hot:*';
      const keys = await this.redisClient.getClient().keys(pattern);
      this.redisClient.incrementCommandCount();

      const hotKeys: string[] = [];
      for (const key of keys) {
        const count = await this.redisClient.getClient().pfcount(key);
        this.redisClient.incrementCommandCount();
        if (count >= threshold) {
          // 提取原始 key 名稱
          const originalKey = key.split(':').slice(2).join(':');
          hotKeys.push(originalKey);
        }
      }

      return [...new Set(hotKeys)];
    } catch (err) {
      console.error('[CacheGuard] 獲取熱點 key 列表失敗:', err);
      return [];
    }
  }

  // ========================================================================
  // 6. 工具方法
  // ========================================================================

  /**
   * 判斷是否為空值緩存
   */
  private isNullValue(value: unknown): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === 'string' && value === this.NULL_VALUE) {
      return true;
    }
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
