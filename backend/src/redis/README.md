# 美業 SaaS 智慧管理系統 — Redis 模塊文檔

> 版本：v1.0  
> 框架：Midway.js + ioredis  
> 功能：緩存管理、分布式鎖、緩存防護

---

## 目錄

1. [模塊架構](#1-模塊架構)
2. [配置文件](#2-配置文件)
3. [核心服務](#3-核心服務)
4. [緩存策略](#4-緩存策略)
5. [分布式鎖](#5-分布式鎖)
6. [緩存防護](#6-緩存防護)
7. [業務使用示例](#7-業務使用示例)
8. [Redis 持久化配置](#8-redis-持久化配置)

---

## 1. 模塊架構

```
backend/src/
├── config/
│   └── config.redis.ts          # Redis 配置（連接、緩存、鎖、持久化）
├── redis/
│   ├── index.ts                 # 模塊入口，匯出所有服務與類型
│   ├── types.ts                 # TypeScript 類型定義
│   ├── client.ts                # Redis 客戶端封裝（連接池、健康檢查）
│   ├── cache.service.ts         # 緩存服務（讀寫、TTL、批量操作）
│   ├── lock.service.ts          # 分布式鎖服務（預約、庫存、資產）
│   ├── guard.service.ts         # 緩存防護服務（穿透/擊穿/雪崩）
│   └── example.service.ts       # 業務使用示例
├── configuration.ts             # Midway.js 應用配置
├── package.json                 # 依賴管理
├── tsconfig.json                # TypeScript 配置
└── .env                         # 環境變數
```

---

## 2. 配置文件

[`config.redis.ts`](../config/config.redis.ts) 包含所有 Redis 相關配置：

### 2.1 連接配置

| 參數 | 默認值 | 說明 |
|------|--------|------|
| `host` | `127.0.0.1` | Redis 服務器地址 |
| `port` | `6379` | Redis 端口 |
| `password` | `''` | 密碼認證 |
| `db` | `0` | 數據庫索引 |
| `connectTimeout` | `10000` | 連接超時（毫秒） |
| `commandTimeout` | `5000` | 命令超時（毫秒） |

### 2.2 重試策略

採用**指數退避**算法：
- 第 1 次重試：延遲 1 秒
- 第 2 次重試：延遲 2 秒
- 第 3 次重試：延遲 4 秒
- ...
- 最多重試 6 次，之後停止

### 2.3 緩存 TTL 配置

| 業務模組 | 緩存場景 | TTL |
|----------|----------|-----|
| 預約 | 詳情 | 5 分鐘 |
| 預約 | 列表 | 2 分鐘 |
| 預約 | 今日預約 | 1 分鐘 |
| 預約 | 統計 | 10 分鐘 |
| 會員 | 資料 | 10 分鐘 |
| 會員 | 資產 | 5 分鐘 |
| 會員 | 等級 | 1 小時 |
| 業績 | 日報 | 10 分鐘 |
| 業績 | 月報 | 30 分鐘 |
| 配置 | 門店 | 1 小時 |
| 配置 | 系統 | 2 小時 |

---

## 3. 核心服務

### 3.1 [`RedisClient`](client.ts) — 客戶端封裝

- 管理主連接 + 訂閱連接（雙連接架構）
- 自動重連機制
- 健康檢查（`ping()`）
- 內存監控（`getMemoryUsage()`）
- 連接狀態查詢

### 3.2 [`CacheService`](cache.service.ts) — 緩存服務

- `get<T>(key)` — 獲取緩存
- `set(key, value, ttl?)` — 設置緩存
- `del(...keys)` — 刪除緩存
- `remember<T>(key, fetchFn, options)` — 安全緩存讀取（含防護）
- `mget/mset` — 批量操作
- `keys/delByPattern` — 模式匹配操作
- `getStats()` — 緩存統計

### 3.3 [`LockService`](lock.service.ts) — 分布式鎖服務

- `acquireLock(key, options)` — 獲取鎖
- `releaseLock(key, value)` — 釋放鎖（Lua 腳本保證原子性）
- `withLock<T>(key, task, options)` — 自動加鎖/解鎖執行
- 業務場景鎖：`acquireAppointmentLock`、`acquireInventoryLock` 等

### 3.4 [`CacheGuardService`](guard.service.ts) — 緩存防護服務

- 布隆過濾器防穿透
- 互斥鎖防擊穿
- TTL 隨機化防雪崩
- 後台異步緩存刷新
- 熱點 key 識別

---

## 4. 緩存策略

### 4.1 緩存穿透防護

```typescript
// 初始化布隆過濾器
await cacheGuardService.initBusinessBloomFilter('appointment');

// 註冊業務 ID
await cacheGuardService.registerBusinessId('appointment', 10001);

// 安全查詢（自動穿透防護）
const data = await cacheGuardService.safeQuery(
  cacheKey, 'appointment', businessId, fetchFn, ttl
);
```

### 4.2 緩存擊穿防護

```typescript
// 熱點 key 查詢（互斥鎖防擊穿）
const data = await cacheGuardService.hotKeyQuery(
  cacheKey, fetchFn, ttl
);
```

### 4.3 緩存雪崩防護

```typescript
// 設置隨機 TTL 防雪崩
await cacheGuardService.setWithRandomTtl(key, value, baseTtl);
```

---

## 5. 分布式鎖

### 5.1 鎖的設計原則

1. **互斥性**：使用 `SET NX` 確保同一時刻只有一個客戶端持有鎖
2. **自動解鎖**：使用 `PX` 設置過期時間，防止死鎖
3. **安全釋放**：使用 Lua 腳本比較 value 後再 DEL，防止誤刪
4. **可重入性**：鎖標識包含時間戳 + 隨機字符串 + PID

### 5.2 業務場景鎖超時

| 業務場景 | 鎖超時 | 重試次數 |
|----------|--------|----------|
| 創建預約 | 5 秒 | 10 次 |
| 取消預約 | 5 秒 | 5 次 |
| 庫存扣減 | 3 秒 | 20 次 |
| 庫存盤點 | 5 秒 | 0 次（不重試） |
| 會員資產 | 3 秒 | 10 次 |
| 業績結算 | 10 秒 | 3 次 |

### 5.3 使用示例

```typescript
// 方式一：手動加鎖/解鎖
const lock = await lockService.acquireAppointmentLock(beauticianId, date, timeSlot);
if (lock.success) {
  try {
    // 業務邏輯
  } finally {
    await lockService.releaseLock(lock.key, lock.value);
  }
}

// 方式二：自動加鎖/解鎖（推薦）
const result = await lockService.withLock(
  `inv:pick:${productId}`,
  async () => {
    // 業務邏輯，自動加鎖，完成後自動解鎖
    return { success: true };
  },
  { timeout: 3000, maxRetries: 20 }
);
```

---

## 6. 緩存防護

### 6.1 三層防護架構

```
請求 → ① 緩存查詢（命中返回）
     → ② 布隆過濾器（不存在則拒絕）
     → ③ 互斥鎖（防止擊穿）
     → ④ 回源 DB 查詢
     → ⑤ 回填緩存
```

### 6.2 空值緩存

對於查詢結果為 null 的場景，緩存空值標記 `__NULL__`，TTL 為 60 秒，防止惡意穿透。

### 6.3 後台異步刷新

在緩存過期前（剩餘 TTL < 20%），主動觸發後台刷新，減少緩存擊穿概率。

---

## 7. 業務使用示例

### 7.1 預約服務

```typescript
// 創建預約（含分布式鎖防重複預約）
const result = await appointmentService.createAppointment(
  beauticianId, memberId, date, timeSlot, serviceItemId
);

// 獲取預約詳情（含緩存穿透防護）
const detail = await appointmentService.getAppointmentDetail(appointmentId);
```

### 7.2 會員服務

```typescript
// 會員消費扣款（含分布式鎖防並發）
const result = await memberService.deductMemberBalance(memberId, amount);

// 獲取會員資料（10 分鐘緩存）
const profile = await memberService.getMemberProfile(memberId);
```

### 7.3 庫存服務

```typescript
// 領料出庫（含分布式鎖防超賣）
const result = await inventoryService.pickProduct(productId, quantity, batchNo);
```

### 7.4 業績服務

```typescript
// 獲取月業績統計（30 分鐘緩存）
const stats = await performanceService.getMonthlyPerformance(beauticianId, '2026-05');

// 業績結算（含分布式鎖防重複結算）
const result = await performanceService.settlePerformance(shopId, '2026-05-04');
```

---

## 8. Redis 持久化配置

### 8.1 RDB 快照

| 條件 | 觸發時機 |
|------|----------|
| 900 秒內 ≥ 1 次變更 | 每 15 分鐘 |
| 300 秒內 ≥ 10 次變更 | 每 5 分鐘 |
| 60 秒內 ≥ 10000 次變更 | 每 1 分鐘 |

### 8.2 AOF 持久化

- 策略：`everysec`（每秒同步，兼顧性能與安全）
- 自動重寫：文件超過 64MB 且增長超過 100% 時觸發
- 重寫期間不執行 fsync，避免阻塞

### 8.3 數據恢復優先級

```
AOF → RDB → 無持久化
```

AOF 文件比 RDB 快照包含更完整的數據，重啟時優先使用 AOF 恢復。
