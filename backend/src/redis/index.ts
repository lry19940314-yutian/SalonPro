// ============================================================================
// 美業 SaaS 智慧管理系統 — Redis 模塊入口
// ============================================================================
// 功能：匯出所有 Redis 相關服務、類型、配置
// ============================================================================

// -------- 服務導出 --------
export { RedisClient } from './client';
export { CacheService } from './cache.service';
export { LockService } from './lock.service';
export { CacheGuardService } from './guard.service';

// -------- 類型導出 --------
export type {
  RedisConfig,
  RedisConnectionConfig,
  CacheConfig,
  CacheTTLConfig,
  LockConfig,
  LockScenarioConfig,
  PersistenceConfig,
  KeyPrefixConfig,
  CacheOptions,
  CacheResult,
  LockOptions,
  LockResult,
  BloomFilterOptions,
  MutexOptions,
  CacheStats,
  PubSubMessage,
} from './types';

// -------- 枚舉導出 --------
export {
  CacheKeyPrefix,
  AppointmentCacheKey,
  MemberCacheKey,
  PerformanceCacheKey,
  ConfigCacheKey,
  LockKey,
  PubSubChannel,
} from './types';

// -------- 配置導出 --------
export { default as redisConfig } from '../config/config.redis';

/**
 * Redis 模塊初始化函數
 * 在應用啟動時調用，完成布隆過濾器初始化等預熱工作
 */
export async function initRedisModule(): Promise<void> {
  console.info('[RedisModule] Redis 模塊初始化開始...');
  // 具體初始化邏輯由各服務的 @Init 方法處理
  console.info('[RedisModule] Redis 模塊初始化完成');
}
