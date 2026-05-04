// ============================================================================
// 美業 SaaS 智慧管理系統 — Redis 類型定義
// ============================================================================
// 功能：Redis 模塊相關的 TypeScript 類型與介面定義
// ============================================================================

// -------- Redis 配置類型 --------

export interface RedisConnectionConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  maxRetriesPerRequest: number;
  retryStrategy: (times: number) => number | null;
  connectTimeout: number;
  commandTimeout: number;
  keepAlive: number;
  lazyConnect: boolean;
  enableAutoPipelining: boolean;
  enableOfflineQueue: boolean;
}

export interface CacheTTLConfig {
  appointment: {
    detail: number;
    list: number;
    todayList: number;
    stats: number;
  };
  member: {
    profile: number;
    asset: number;
    level: number;
    list: number;
  };
  performance: {
    daily: number;
    monthly: number;
    commission: number;
    rank: number;
  };
  config: {
    shop: number;
    service: number;
    product: number;
    system: number;
  };
  permission: {
    role: number;
    permissions: number;
  };
}

export interface BloomFilterConfig {
  expectedInsertions: number;
  falsePositiveRate: number;
}

export interface MutexConfig {
  lockTimeout: number;
  retryInterval: number;
  maxRetries: number;
}

export interface CacheConfig {
  defaultTTL: number;
  ttl: CacheTTLConfig;
  bloomFilter: BloomFilterConfig;
  mutex: MutexConfig;
}

export interface LockScenarioConfig {
  create: number;
  cancel: number;
  modify: number;
}

export interface InventoryLockConfig {
  pick: number;
  transfer: number;
  check: number;
}

export interface LockConfig {
  defaultTimeout: number;
  scenarios: {
    appointment: LockScenarioConfig;
    inventory: InventoryLockConfig;
    performance: {
      settle: number;
    };
    member: {
      assetChange: number;
    };
  };
  keyPrefix: string;
}

export interface RDBSaveConfig {
  seconds: number;
  changes: number;
}

export interface RDBSaveConfig {
  seconds: number;
  changes: number;
}

export interface RDBConfig {
  enabled: boolean;
  save: RDBSaveConfig[];
  filename: string;
  dir: string;
}

export interface AOFConfig {
  enabled: boolean;
  filename: string;
  dir: string;
  appendfsync: 'always' | 'everysec' | 'no';
  noAppendfsyncOnRewrite: boolean;
  autoRewrite: {
    minSize: string;
    minGrowthPercent: number;
  };
}

export interface PersistenceConfig {
  rdb: RDBConfig;
  aof: AOFConfig;
}

export interface KeyPrefixConfig {
  appointment: string;
  member: string;
  performance: string;
  config: string;
  permission: string;
  lock: string;
  session: string;
  rateLimit: string;
}

export interface RedisConfig {
  redis: RedisConnectionConfig;
  cache: CacheConfig;
  lock: LockConfig;
  persistence: PersistenceConfig;
  keyPrefix: KeyPrefixConfig;
}

// -------- 緩存相關類型 --------

export interface CacheOptions {
  /** 過期時間（秒），覆蓋默認 TTL */
  ttl?: number;
  /** 是否使用布隆過濾器防穿透 */
  useBloomFilter?: boolean;
  /** 是否啟用互斥鎖防擊穿 */
  useMutex?: boolean;
  /** 前綴鍵名 */
  prefix?: string;
}

export interface CacheResult<T> {
  /** 緩存數據 */
  data: T;
  /** 是否來自緩存 */
  fromCache: boolean;
  /** 緩存鍵名 */
  key: string;
  /** 剩餘存活時間（秒），-1 表示永不過期，-2 表示已過期 */
  ttl?: number;
}

// -------- 分布式鎖相關類型 --------

export interface LockOptions {
  /** 鎖超時時間（毫秒） */
  timeout?: number;
  /** 獲取鎖的重試間隔（毫秒） */
  retryInterval?: number;
  /** 最大重試次數 */
  maxRetries?: number;
  /** 鎖前綴 */
  prefix?: string;
}

export interface LockResult {
  /** 是否成功獲取鎖 */
  success: boolean;
  /** 鎖標識值（用於解鎖驗證） */
  value: string;
  /** 鎖鍵名 */
  key: string;
  /** 鎖超時時間（毫秒） */
  ttl: number;
}

// -------- 緩存穿透/擊穿防護類型 --------

export interface BloomFilterOptions {
  /** 預期插入數量 */
  expectedInsertions?: number;
  /** 誤判率 */
  falsePositiveRate?: number;
}

export interface MutexOptions {
  /** 互斥鎖超時（毫秒） */
  lockTimeout?: number;
  /** 重試間隔（毫秒） */
  retryInterval?: number;
  /** 最大重試次數 */
  maxRetries?: number;
}

// -------- 業務緩存鍵枚舉 --------

export enum CacheKeyPrefix {
  APPOINTMENT = 'appt:',
  MEMBER = 'mbr:',
  PERFORMANCE = 'perf:',
  CONFIG = 'cfg:',
  PERMISSION = 'perm:',
  SESSION = 'sess:',
  RATE_LIMIT = 'rl:',
}

export enum AppointmentCacheKey {
  DETAIL = 'appt:detail:',
  LIST = 'appt:list:',
  TODAY_LIST = 'appt:today:',
  STATS = 'appt:stats:',
}

export enum MemberCacheKey {
  PROFILE = 'mbr:profile:',
  ASSET = 'mbr:asset:',
  LEVEL = 'mbr:level:',
  LIST = 'mbr:list:',
}

export enum PerformanceCacheKey {
  DAILY = 'perf:daily:',
  MONTHLY = 'perf:monthly:',
  COMMISSION = 'perf:commission:',
  RANK = 'perf:rank:',
}

export enum ConfigCacheKey {
  SHOP = 'cfg:shop:',
  SERVICE = 'cfg:service:',
  PRODUCT = 'cfg:product:',
  SYSTEM = 'cfg:system:',
}

// -------- 分布式鎖鍵名枚舉 --------

export enum LockKey {
  APPOINTMENT_CREATE = 'lock:appt:create:',
  APPOINTMENT_CANCEL = 'lock:appt:cancel:',
  APPOINTMENT_MODIFY = 'lock:appt:modify:',
  INVENTORY_PICK = 'lock:inv:pick:',
  INVENTORY_TRANSFER = 'lock:inv:transfer:',
  INVENTORY_CHECK = 'lock:inv:check:',
  PERFORMANCE_SETTLE = 'lock:perf:settle:',
  MEMBER_ASSET = 'lock:mbr:asset:',
}

// -------- 緩存統計 --------

export interface CacheStats {
  /** 緩存命中次數 */
  hits: number;
  /** 緩存未命中次數 */
  misses: number;
  /** 緩存命中率 */
  hitRate: number;
  /** 當前緩存鍵數量 */
  keyCount: number;
  /** 緩存佔用內存 */
  usedMemory: string;
}

// -------- 發布/訂閱消息類型 --------

export interface PubSubMessage {
  /** 消息類型 */
  type: string;
  /** 業務 ID */
  businessId: string | number;
  /** 門店 ID */
  shopId: number;
  /** 操作時間戳 */
  timestamp: number;
  /** 附加數據 */
  payload?: Record<string, unknown>;
}

export enum PubSubChannel {
  /** 預約變更通知 */
  APPOINTMENT_CHANGE = 'channel:appointment:change',
  /** 會員資料變更通知 */
  MEMBER_CHANGE = 'channel:member:change',
  /** 配置變更通知 */
  CONFIG_CHANGE = 'channel:config:change',
  /** 緩存失效通知 */
  CACHE_INVALIDATE = 'channel:cache:invalidate',
}
