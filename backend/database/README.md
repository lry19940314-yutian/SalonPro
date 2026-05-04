# 美業 SaaS 智慧管理系統 — 數據庫設計文檔

> 版本：v1.0  
> 數據庫：MySQL 8.0  
> 字符集：`utf8mb4` / `utf8mb4_unicode_ci`  
> 引擎：InnoDB（支援事務與外鍵）

---

## 目錄

1. [ER 關係總覽](#1-er-關係總覽)
2. [模組劃分](#2-模組劃分)
3. [表結構說明](#3-表結構說明)
4. [安全設計](#4-安全設計)
5. [索引策略](#5-索引策略)
6. [初始化順序](#6-初始化順序)

---

## 1. ER 關係總覽

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    shop      │────>│     staff        │────>│    schedule      │
│   (門店)     │     │    (員工)        │     │   (場務表)       │
└──────┬───────┘     └────────┬─────────┘     └────────┬─────────┘
       │                      │                        │
       │                      │                        │
       ├──────────────────────┤                        │
       │                      │                        │
       ▼                      ▼                        ▼
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   member     │────>│   appointment    │────>│  appointment_item│
│   (會員)     │     │  (預約訂單)      │     │  (預約明細)      │
└──────┬───────┘     └────────┬─────────┘     └──────────────────┘
       │                      │
       ▼                      ▼
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ member_asset │     │   performance    │────>│   commission     │
│  (會員資產)  │     │   (業績記錄)     │     │  (抽成明細)      │
└──────────────┘     └──────────────────┘     └──────────────────┘

┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│service_item  │     │    product       │────>│   inventory      │
│ (服務項目)   │     │   (產品)         │     │  (庫存記錄)      │
└──────────────┘     └────────┬─────────┘     └────────┬─────────┘
                              │                        │
                              ▼                        ▼
                       ┌──────────────────┐     ┌──────────────────┐
                       │   pick_order     │────>│   pick_item      │
                       │   (領料單)       │     │  (領料明細)      │
                       └──────────────────┘     └──────────────────┘
```

---

## 2. 模組劃分

| 模組 | 包含表 | 說明 |
|------|--------|------|
| **組織權限** | `shop`, `role`, `permission`, `role_permission`, `staff`, `staff_shop` | SaaS 多租戶、RBAC 權限模型 |
| **服務商品** | `service_category`, `service_item`, `product_category`, `product` | 服務項目與銷售產品管理 |
| **會員 CRM** | `member`, `member_level`, `member_asset`, `member_asset_log` | 會員資料、等級、資產管理 |
| **票券** | `coupon`, `member_coupon` | 優惠券定義與發放 |
| **場務** | `schedule`, `leave` | 美容師排班與請假管理 |
| **預約** | `appointment`, `appointment_item`, `appointment_payment` | 核心交易流程 |
| **業績** | `performance`, `commission`, `commission_settlement` | 業績歸屬與抽成計算 |
| **庫存** | `inventory`, `inventory_log`, `pick_order`, `pick_item` | 進銷存與領料管理 |
| **作品集** | `portfolio` | 美容師作品展示 |
| **通知** | `notification` | 系統通知與提醒 |
| **系統** | `operation_log`, `system_config` | 審計日誌與配置 |

---

## 3. 表結構說明

### 3.1 組織權限模組

#### [`shop`](init/01-schema.sql#L20) — 門店表
SaaS 多租戶核心表，每個門店為一個獨立租戶。`code` 為客戶代碼，用於登錄識別。

#### [`role`](init/01-schema.sql#L38) — 角色表
系統角色定義，內建 `super_admin`（超級管理員）、`manager`（店長）、`beautician`（美容師）。

#### [`permission`](init/01-schema.sql#L52) — 權限表
功能權限定義，採用 `module:action` 命名規範（如 `schedule:view`）。

#### [`role_permission`](init/01-schema.sql#L68) — 角色權限關聯表
角色與權限的多對多關係。

#### [`staff`](init/01-schema.sql#L82) — 員工表
門店員工核心資料。密碼以 **bcrypt** 加密存儲，敏感資料欄位需加密處理。

#### [`staff_shop`](init/01-schema.sql#L107) — 員工門店關聯表
支援未來跨店權限擴展。

### 3.2 服務商品模組

#### [`service_category`](init/01-schema.sql#L124) — 服務分類表
服務項目分類（剪髮、染髮、燙髮、護理等）。

#### [`service_item`](init/01-schema.sql#L140) — 服務項目表
門店提供的各項美容服務，包含時長、價格、抽成規則、場務表顯示顏色。

#### [`product_category`](init/01-schema.sql#L166) — 產品分類表
銷售產品分類。

#### [`product`](init/01-schema.sql#L181) — 產品表
門店銷售或使用的產品，包含條碼、品牌、規格、成本價、售價。

### 3.3 會員模組

#### [`member`](init/01-schema.sql#L206) — 會員表
會員核心資料表。**手機號碼以 AES-256 加密存儲**，同時保存 SHA-256 雜湊用於查重與索引。

#### [`member_level`](init/01-schema.sql#L240) — 會員等級表
會員等級與權益定義（普通會員、銀卡、金卡、鑽石）。

#### [`member_asset`](init/01-schema.sql#L256) — 會員資產表
管理會員的儲值金（balance）、課程券（course）、積分（points）、優惠券（coupon）。

#### [`member_asset_log`](init/01-schema.sql#L278) — 會員資產變動日誌
所有資產增減操作的審計日誌，用於對帳。

### 3.4 票券模組

#### [`coupon`](init/01-schema.sql#L300) — 優惠券定義表
門店定義的優惠活動（折扣、折抵、贈送）。

#### [`member_coupon`](init/01-schema.sql#L322) — 會員持有優惠券表
會員領取與使用記錄，包含兌換碼與到期管理。

### 3.5 場務模組

#### [`schedule`](init/01-schema.sql#L345) — 場務表
美容師每日排班，包含上下班時間、休息時段、時段狀態。為預約衝突檢測的基礎。

#### [`leave`](init/01-schema.sql#L371) — 請假記錄表
美容師請假申請與店長審批流程。

### 3.6 預約模組（核心交易）

#### [`appointment`](init/01-schema.sql#L396) — 預約訂單表
**系統最核心的交易表**，串聯會員、美容師、服務項目、業績歸屬。包含完整的金額計算與狀態流轉。

狀態機：`pending → confirmed → in_progress → completed`  
可中斷至：`cancelled` 或 `no_show`

#### [`appointment_item`](init/01-schema.sql#L429) — 預約項目明細表
一筆預約可包含多個服務或產品，支援指定不同美容師執行不同項目。

#### [`appointment_payment`](init/01-schema.sql#L452) — 預約支付記錄表
支援一筆預約多次支付（如訂金 + 尾款）。

### 3.7 業績模組

#### [`performance`](init/01-schema.sql#L475) — 業績記錄表
每筆預約產生的業績，按美容師歸屬。包含業績金額、抽成比例與金額。

#### [`commission`](init/01-schema.sql#L501) — 抽成明細表
美容師抽成計算結果，支援服務抽成、商品抽成、獎金、扣款。

#### [`commission_settlement`](init/01-schema.sql#L523) — 抽成結算表
按月或按週的週期性結算記錄。

### 3.8 庫存模組

#### [`inventory`](init/01-schema.sql#L550) — 庫存記錄表
門店產品庫存，支援批次管理、最低庫存預警、有效期管理。

#### [`inventory_log`](init/01-schema.sql#L576) — 庫存變動日誌
所有入庫、出庫、盤點操作的審計日誌。

#### [`pick_order`](init/01-schema.sql#L600) — 領料單
美容師領料申請，需店長審批。

#### [`pick_item`](init/01-schema.sql#L624) — 領料明細表
領料單中的產品明細。

### 3.9 作品集模組

#### [`portfolio`](init/01-schema.sql#L642) — 作品集表
美容師上傳的作品圖片/影片，可關聯服務項目。

### 3.10 通知模組

#### [`notification`](init/01-schema.sql#L665) — 通知記錄表
系統通知、預約提醒、行銷推播，支援多種發送渠道。

### 3.11 系統模組

#### [`operation_log`](init/01-schema.sql#L694) — 操作日誌表
所有重要操作的審計追蹤。

#### [`system_config`](init/01-schema.sql#L716) — 系統配置表
門店級別的 Key-Value 配置。

---

## 4. 安全設計

### 4.1 密碼加密
- 員工密碼使用 **bcrypt**（`$2a$10$` 成本因子）加密存儲
- 密碼欄位長度為 `VARCHAR(255)` 以支援 bcrypt 輸出

### 4.2 敏感數據加密
- 會員手機號碼使用 **AES-256** 加密存儲（`VARCHAR(255)`）
- 同時保存 **SHA-256** 雜湊（`phone_hash`）用於查重與索引
- 應用層加解密，數據庫僅存儲密文

### 4.3 權限控制
- 基於 RBAC（Role-Based Access Control）模型
- 三層權限校驗：JWT → 角色 → 數據範圍
- 店長可查看全店數據，美容師僅限個人數據

### 4.4 審計追蹤
- `operation_log` 記錄所有重要操作
- `member_asset_log` 記錄資產變動
- `inventory_log` 記錄庫存變動

---

## 5. 索引策略

### 5.1 主鍵設計
- 所有表使用 `BIGINT AUTO_INCREMENT` 作為主鍵
- 業務唯一標識使用 `UNIQUE KEY`（如 `order_no`、`member_no`）

### 5.2 外鍵索引
- 所有 `FK` 欄位均建立索引
- 外鍵使用 `RESTRICT` 或 `CASCADE` 策略，視業務需求決定

### 5.3 複合索引（查詢優化）
- 預約查詢：`(shop_id, appointment_date)`、`(staff_id, appointment_date)`
- 場務表查詢：`(shop_id, date)`、`(staff_id, date, status)`
- 業績統計：`(shop_id, performance_date)`、`(staff_id, performance_date)`
- 會員查詢：`(shop_id, level_id)`、`(shop_id, last_visit)`

### 5.4 唯一約束
| 表 | 唯一鍵 | 說明 |
|----|--------|------|
| `shop` | `code` | 客戶代碼唯一 |
| `staff` | `username` | 登錄帳號唯一 |
| `member` | `member_no`, `phone_hash` | 會員編號與電話雜湊唯一 |
| `appointment` | `order_no` | 訂單編號唯一 |
| `schedule` | `(staff_id, date)` | 每位美容師每日一條排班 |
| `pick_order` | `pick_no` | 領料單號唯一 |
| `member_coupon` | `code` | 優惠券兌換碼唯一 |
| `system_config` | `(shop_id, config_key)` | 門店配置鍵唯一 |

---

## 6. 初始化順序

```bash
# 1. 建庫建表
mysql -u root -p < database/init/01-schema.sql

# 2. 建立索引與外鍵
mysql -u root -p < database/init/02-indexes.sql

# 3. 導入種子數據
mysql -u root -p < database/init/03-seed-data.sql
```

### 執行注意事項

1. **外鍵約束**：`02-indexes.sql` 需在 `01-schema.sql` 之後執行
2. **種子數據**：`03-seed-data.sql` 依賴前兩個腳本的表結構
3. **生產環境**：建議將外鍵約束與索引合併至 `01-schema.sql` 以減少 ALTER 操作
4. **密碼重置**：種子數據中的預設密碼為 `admin123`，上線前請務必修改

---

## 附錄：表總覽

| # | 表名 | 中文名 | 模組 | 核心欄位數 |
|---|------|--------|------|-----------|
| 1 | `shop` | 門店表 | 組織權限 | 10 |
| 2 | `role` | 角色表 | 組織權限 | 6 |
| 3 | `permission` | 權限表 | 組織權限 | 7 |
| 4 | `role_permission` | 角色權限關聯表 | 組織權限 | 4 |
| 5 | `staff` | 員工表 | 組織權限 | 16 |
| 6 | `staff_shop` | 員工門店關聯表 | 組織權限 | 5 |
| 7 | `service_category` | 服務分類表 | 服務商品 | 7 |
| 8 | `service_item` | 服務項目表 | 服務商品 | 16 |
| 9 | `product_category` | 產品分類表 | 服務商品 | 7 |
| 10 | `product` | 產品表 | 服務商品 | 16 |
| 11 | `member` | 會員表 | 會員 CRM | 21 |
| 12 | `member_level` | 會員等級表 | 會員 CRM | 10 |
| 13 | `member_asset` | 會員資產表 | 會員 CRM | 13 |
| 14 | `member_asset_log` | 會員資產變動日誌 | 會員 CRM | 11 |
| 15 | `coupon` | 優惠券定義表 | 票券 | 13 |
| 16 | `member_coupon` | 會員持有優惠券表 | 票券 | 11 |
| 17 | `schedule` | 場務表 | 場務 | 14 |
| 18 | `leave` | 請假記錄表 | 場務 | 12 |
| 19 | `appointment` | 預約訂單表 | 預約（核心） | 22 |
| 20 | `appointment_item` | 預約項目明細表 | 預約 | 12 |
| 21 | `appointment_payment` | 預約支付記錄表 | 預約 | 10 |
| 22 | `performance` | 業績記錄表 | 業績 | 16 |
| 23 | `commission` | 抽成明細表 | 業績 | 11 |
| 24 | `commission_settlement` | 抽成結算表 | 業績 | 15 |
| 25 | `inventory` | 庫存記錄表 | 庫存 | 13 |
| 26 | `inventory_log` | 庫存變動日誌 | 庫存 | 11 |
| 27 | `pick_order` | 領料單 | 庫存 | 12 |
| 28 | `pick_item` | 領料明細表 | 庫存 | 7 |
| 29 | `portfolio` | 作品集表 | 作品集 | 11 |
| 30 | `notification` | 通知記錄表 | 通知 | 15 |
| 31 | `operation_log` | 操作日誌表 | 系統 | 11 |
| 32 | `system_config` | 系統配置表 | 系統 | 6 |

> **合計：32 張表**
