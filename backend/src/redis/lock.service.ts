// ============================================================================
// 美業 SaaS 智慧管理系統 — Redis 分布式鎖服務
// ============================================================================
// 功能：基於 Redis 的分布式鎖實現，解決預約衝突、重複預約、庫存超賣
// ============================================================================

import { Provide, Scope, ScopeEnum, Inject, Init } from '@midwayjs/core';
import { RedisClient } from './client';
import redisConfig from '../config/config.redis';
import type { LockOptions, LockResult, RedisConfig } from './types';

/**
 * 分布式鎖服務
 *
 * 核心業務場景：
 * 1. 預約衝突：同一美容師同一時段只能有一個預約
 * 2. 重複預約：同一會員不能在同一時段重複預約
 * 3. 庫存超賣：庫存扣減時的並發控制
 *
 * 使用 Redlock 算法思想，單節點 Redis 使用 SET NX PX 實現
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class LockService {
  @Inject()
  private redisClient: RedisClient;

  private config: RedisConfig;

  @Init()
  init(): void {
    this.config = redisConfig;
  }

  // ========================================================================
  // 基礎鎖操作
  // ========================================================================

  /**
   * 獲取分布式鎖
   *
   * 使用 SET NX PX 命令實現原子操作：
   * - NX：鍵不存在時才設置（互斥）
   * - PX：設置過期時間（自動解鎖，防止死鎖）
   *
   * @param key 鎖鍵名
   * @param options 鎖選項
   * @returns 鎖結果
   */
  async acquireLock(key: string, options: LockOptions = {}): Promise<LockResult> {
    const {
      timeout = this.config.lock.defaultTimeout,
      retryInterval = 100,
      maxRetries = 0,
      prefix = this.config.lock.keyPrefix,
    } = options;

    const lockKey = `${prefix}${key}`;
    // 生成唯一鎖標識：時間戳 + 隨機字符串
    const lockValue = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${process.pid}`;

    let retries = 0;
    while (maxRetries === 0 || retries <= maxRetries) {
      try {
        const result = await this.redisClient.getClient().set(
          lockKey,
          lockValue,
          'PX',
          timeout,
          'NX',
        );
        this.redisClient.incrementCommandCount();

        if (result === 'OK') {
          return {
            success: true,
            value: lockValue,
            key: lockKey,
            ttl: timeout,
          };
        }

        // 鎖已被佔用
        if (maxRetries === 0) {
          // 不重試，直接返回
          return {
            success: false,
            value: '',
            key: lockKey,
            ttl: 0,
          };
        }

        // 等待後重試
        retries++;
        if (retries <= maxRetries) {
          await this.sleep(retryInterval);
        }
      } catch (err) {
        console.error(`[Lock] 獲取鎖失敗 key=${lockKey}:`, err);
        return {
          success: false,
          value: '',
          key: lockKey,
          ttl: 0,
        };
      }
    }

    return {
      success: false,
      value: '',
      key: lockKey,
      ttl: 0,
    };
  }

  /**
   * 釋放分布式鎖
   *
   * 使用 Lua 腳本確保原子性：
   * 只有鎖的持有者才能釋放鎖（防止誤刪其他線程的鎖）
   */
  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    // Lua 腳本：比較 value 是否匹配，匹配則刪除
    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;

    try {
      const result = await this.redisClient.getClient().eval(script, 1, lockKey, lockValue);
      this.redisClient.incrementCommandCount();
      return result === 1;
    } catch (err) {
      console.error(`[Lock] 釋放鎖失敗 key=${lockKey}:`, err);
      return false;
    }
  }

  /**
   * 安全執行加鎖操作
   *
   * 自動獲取鎖、執行業務邏輯、釋放鎖
   * 使用 try-finally 確保鎖一定會被釋放
   *
   * @param key 鎖鍵名
   * @param task 業務邏輯函數
   * @param options 鎖選項
   * @returns 業務邏輯返回值
   */
  async withLock<T>(
    key: string,
    task: () => Promise<T>,
    options: LockOptions = {},
  ): Promise<T | null> {
    const lockResult = await this.acquireLock(key, options);

    if (!lockResult.success) {
      console.warn(`[Lock] 獲取鎖失敗，無法執行操作 key=${key}`);
      return null;
    }

    try {
      return await task();
    } finally {
      await this.releaseLock(lockResult.key, lockResult.value);
    }
  }

  // ========================================================================
  // 業務場景鎖
  // ========================================================================

  /**
   * 預約創建鎖
   * 防止同一美容師同一時段被重複預約
   *
   * @param beauticianId 美容師 ID
   * @param date 預約日期 (YYYY-MM-DD)
   * @param timeSlot 時段標識
   */
  async acquireAppointmentLock(
    beauticianId: number,
    date: string,
    timeSlot: string,
  ): Promise<LockResult> {
    const key = `appt:create:${beauticianId}:${date}:${timeSlot}`;
    return this.acquireLock(key, {
      timeout: this.config.lock.scenarios.appointment.create,
      maxRetries: 10,
      retryInterval: 200,
    });
  }

  /**
   * 預約取消鎖
   * 防止並發取消操作導致狀態不一致
   */
  async acquireAppointmentCancelLock(appointmentId: number): Promise<LockResult> {
    const key = `appt:cancel:${appointmentId}`;
    return this.acquireLock(key, {
      timeout: this.config.lock.scenarios.appointment.cancel,
      maxRetries: 5,
      retryInterval: 100,
    });
  }

  /**
   * 預約修改鎖
   * 防止並發修改操作導致數據衝突
   */
  async acquireAppointmentModifyLock(appointmentId: number): Promise<LockResult> {
    const key = `appt:modify:${appointmentId}`;
    return this.acquireLock(key, {
      timeout: this.config.lock.scenarios.appointment.modify,
      maxRetries: 5,
      retryInterval: 100,
    });
  }

  /**
   * 庫存扣減鎖
   * 防止庫存超賣（超賣防護核心）
   *
   * @param productId 產品 ID
   * @param batchNo 批次號（可選）
   */
  async acquireInventoryLock(
    productId: number,
    batchNo?: string,
  ): Promise<LockResult> {
    const key = batchNo
      ? `inv:pick:${productId}:${batchNo}`
      : `inv:pick:${productId}`;
    return this.acquireLock(key, {
      timeout: this.config.lock.scenarios.inventory.pick,
      maxRetries: 20,
      retryInterval: 100,
    });
  }

  /**
   * 庫存盤點鎖
   * 盤點期間禁止出入庫操作
   */
  async acquireInventoryCheckLock(shopId: number): Promise<LockResult> {
    const key = `inv:check:${shopId}`;
    return this.acquireLock(key, {
      timeout: this.config.lock.scenarios.inventory.check,
      maxRetries: 0, // 不重試，盤點鎖被佔用直接返回失敗
    });
  }

  /**
   * 會員資產變動鎖
   * 防止並發操作導致會員資產不一致
   */
  async acquireMemberAssetLock(memberId: number): Promise<LockResult> {
    const key = `mbr:asset:${memberId}`;
    return this.acquireLock(key, {
      timeout: this.config.lock.scenarios.member.assetChange,
      maxRetries: 10,
      retryInterval: 100,
    });
  }

  /**
   * 業績結算鎖
   * 防止重複結算
   */
  async acquirePerformanceSettleLock(
    shopId: number,
    settleDate: string,
  ): Promise<LockResult> {
    const key = `perf:settle:${shopId}:${settleDate}`;
    return this.acquireLock(key, {
      timeout: this.config.lock.scenarios.performance.settle,
      maxRetries: 3,
      retryInterval: 500,
    });
  }

  // ========================================================================
  // 鎖管理
  // ========================================================================

  /**
   * 獲取鎖的當前狀態
   */
  async getLockInfo(key: string): Promise<{
    exists: boolean;
    ttl: number;
    value: string | null;
  }> {
    try {
      const exists = await this.redisClient.getClient().exists(key);
      this.redisClient.incrementCommandCount();

      if (!exists) {
        return { exists: false, ttl: -2, value: null };
      }

      const [ttl, value] = await Promise.all([
        this.redisClient.getClient().ttl(key),
        this.redisClient.getClient().get(key),
      ]);
      this.redisClient.incrementCommandCount();

      return {
        exists: true,
        ttl,
        value,
      };
    } catch (err) {
      console.error(`[Lock] 獲取鎖信息失敗 key=${key}:`, err);
      return { exists: false, ttl: -2, value: null };
    }
  }

  /**
   * 強制釋放鎖（管理員用，謹慎使用）
   */
  async forceReleaseLock(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.getClient().del(key);
      this.redisClient.incrementCommandCount();
      console.warn(`[Lock] 強制釋放鎖 key=${key}`);
      return result === 1;
    } catch (err) {
      console.error(`[Lock] 強制釋放鎖失敗 key=${key}:`, err);
      return false;
    }
  }

  /**
   * 清理所有過期鎖（維護用）
   */
  async cleanExpiredLocks(): Promise<number> {
    try {
      const pattern = `${this.config.lock.keyPrefix}*`;
      const keys = await this.redisClient.getClient().keys(pattern);
      this.redisClient.incrementCommandCount();

      let cleaned = 0;
      for (const key of keys) {
        const ttl = await this.redisClient.getClient().ttl(key);
        this.redisClient.incrementCommandCount();
        if (ttl <= 0) {
          await this.redisClient.getClient().del(key);
          this.redisClient.incrementCommandCount();
          cleaned++;
        }
      }

      console.info(`[Lock] 清理過期鎖完成，共清理 ${cleaned} 個`);
      return cleaned;
    } catch (err) {
      console.error('[Lock] 清理過期鎖失敗:', err);
      return 0;
    }
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
