// ============================================================================
// 美業 SaaS 智慧管理系統 — Redis 配置
// ============================================================================
// 功能：Redis 連接配置、連接池設定、持久化策略、緩存過期策略
// ============================================================================

import { RedisConfig } from '../redis/types';

const redisConfig: RedisConfig = {
  redis: {
    // -------- 基本連接配置 --------
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),

    // -------- 連接池配置 --------
    // ioredis 內建連接池，以下為連接行為控制參數
    maxRetriesPerRequest: 3,            // 每次請求最大重試次數
    retryStrategy: (times: number) => { // 自定義重試策略
      if (times > 6) {
        console.error('[Redis] 重試次數超過上限，停止重試');
        return null; // 停止重試
      }
      // 指數退避：1s, 2s, 4s, 8s, 16s, 32s
      const delay = Math.min(1000 * Math.pow(2, times - 1), 30000);
      console.warn(`[Redis] 連接重試第 ${times} 次，延遲 ${delay}ms`);
      return delay;
    },

    // -------- 超時配置 --------
    connectTimeout: 10000,   // 連接超時（毫秒）
    commandTimeout: 5000,    // 命令執行超時（毫秒）
    keepAlive: 30000,        // TCP keep-alive（毫秒）

    // -------- 性能優化 --------
    lazyConnect: false,      // 是否延遲連接（false = 啟動時自動連接）
    enableAutoPipelining: true,  // 自動管道化，減少網絡往返
    enableOfflineQueue: true,    // 離線隊列，斷線時暫存命令
  },

  // -------- 緩存過期策略配置 --------
  cache: {
    // 默認過期時間（秒）
    defaultTTL: 3600, // 1 小時

    // 各業務模組專屬 TTL（秒）
    ttl: {
      // ---- 預約數據 ----
      appointment: {
        detail: 300,        // 預約詳情：5 分鐘
        list: 120,          // 預約列表：2 分鐘
        todayList: 60,      // 今日預約：1 分鐘
        stats: 600,         // 預約統計：10 分鐘
      },

      // ---- 會員數據 ----
      member: {
        profile: 600,       // 會員資料：10 分鐘
        asset: 300,         // 會員資產：5 分鐘
        level: 3600,        // 會員等級：1 小時
        list: 300,          // 會員列表：5 分鐘
      },

      // ---- 業績統計 ----
      performance: {
        daily: 600,         // 日業績：10 分鐘
        monthly: 1800,      // 月業績：30 分鐘
        commission: 600,    // 抽成數據：10 分鐘
        rank: 1800,         // 排名：30 分鐘
      },

      // ---- 配置參數 ----
      config: {
        shop: 3600,         // 門店配置：1 小時
        service: 1800,      // 服務項目：30 分鐘
        product: 1800,      // 產品資料：30 分鐘
        system: 7200,       // 系統配置：2 小時
      },

      // ---- 權限數據 ----
      permission: {
        role: 3600,         // 角色信息：1 小時
        permissions: 3600,  // 權限列表：1 小時
      },
    },

    // -------- 緩存穿透防護 --------
    bloomFilter: {
      expectedInsertions: 100000,  // 預期插入數量
      falsePositiveRate: 0.01,     // 誤判率（1%）
    },

    // -------- 緩存擊穿防護 --------
    mutex: {
      lockTimeout: 5000,    // 互斥鎖超時（毫秒）
      retryInterval: 100,   // 重試間隔（毫秒）
      maxRetries: 50,       // 最大重試次數
    },
  },

  // -------- 分布式鎖配置 --------
  lock: {
    // 默認鎖超時時間（毫秒）
    defaultTimeout: 30000,

    // 各業務場景鎖超時（毫秒）
    scenarios: {
      appointment: {
        create: 5000,       // 創建預約：5 秒
        cancel: 5000,       // 取消預約：5 秒
        modify: 5000,       // 修改預約：5 秒
      },
      inventory: {
        pick: 3000,         // 領料：3 秒
        transfer: 3000,     // 調撥：3 秒
        check: 5000,        // 盤點：5 秒
      },
      performance: {
        settle: 10000,      // 結算：10 秒
      },
      member: {
        assetChange: 3000,  // 資產變動：3 秒
      },
    },

    // 鎖前綴，避免不同業務 key 衝突
    keyPrefix: 'lock:',
  },

  // -------- 數據持久化配置 --------
  persistence: {
    // RDB 快照（默認啟用）
    rdb: {
      enabled: true,
      save: [
        { seconds: 900, changes: 1 },    // 900 秒內至少 1 次變更
        { seconds: 300, changes: 10 },   // 300 秒內至少 10 次變更
        { seconds: 60, changes: 10000 }, // 60 秒內至少 10000 次變更
      ],
      filename: 'dump.rdb',
      dir: './data/redis',
    },

    // AOF 持久化（建議啟用以保證數據安全）
    aof: {
      enabled: true,
      filename: 'appendonly.aof',
      dir: './data/redis',
      // always / everysec / no
      appendfsync: 'everysec',
      // 是否在 AOF 重寫時不進行 fsync
      noAppendfsyncOnRewrite: true,
      // 自動重寫觸發條件
      autoRewrite: {
        minSize: '64mb',
        minGrowthPercent: 100,
      },
    },
  },

  // -------- 鍵名命名空間前綴 --------
  keyPrefix: {
    // 各模組前綴，用於分類管理 Redis 鍵
    appointment: 'appt:',
    member: 'mbr:',
    performance: 'perf:',
    config: 'cfg:',
    permission: 'perm:',
    lock: 'lock:',
    session: 'sess:',
    rateLimit: 'rl:',
  },
};

export default redisConfig;
