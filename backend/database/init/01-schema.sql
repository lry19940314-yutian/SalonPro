-- ============================================================================
-- 美業 SaaS 智慧管理系統 - 數據庫表結構設計
-- 版本: v1.0
-- 數據庫: MySQL 8.0
-- 字符集: utf8mb4 / utf8mb4_unicode_ci
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `salon_pro`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `salon_pro`;

-- ============================================================================
-- 1. 組織權限模組
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1.1 shop — 門店表
--     SaaS 多租戶核心，每個門店為一個獨立租戶
-- --------------------------------------------------------------------------
CREATE TABLE `shop` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '門店 ID（主鍵）',
  `code`            VARCHAR(20)     NOT NULL                COMMENT '客戶代碼（登錄用，唯一標識）',
  `name`            VARCHAR(100)    NOT NULL                COMMENT '門店名稱',
  `phone`           VARCHAR(20)     DEFAULT NULL            COMMENT '聯繫電話',
  `address`         VARCHAR(255)    DEFAULT NULL            COMMENT '門店地址',
  `logo`            VARCHAR(255)    DEFAULT NULL            COMMENT '門店 Logo URL',
  `status`          TINYINT         NOT NULL DEFAULT 1      COMMENT '狀態：1=啟用，0=停用',
  `business_hours`  JSON            DEFAULT NULL            COMMENT '營業時間配置（JSON 格式）',
  `commission_rules` JSON           DEFAULT NULL            COMMENT '抽成規則配置（JSON 格式）',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_shop_code` (`code`),
  INDEX `idx_shop_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='門店表 — SaaS 多租戶核心';

-- --------------------------------------------------------------------------
-- 1.2 role — 角色表
--     系統角色定義（店長 / 美容師），支援未來擴展
-- --------------------------------------------------------------------------
CREATE TABLE `role` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '角色 ID（主鍵）',
  `code`            VARCHAR(30)     NOT NULL                COMMENT '角色代碼（如 manager / beautician）',
  `name`            VARCHAR(50)     NOT NULL                COMMENT '角色名稱（如店長 / 美容師）',
  `description`     VARCHAR(255)    DEFAULT NULL            COMMENT '角色描述',
  `is_system`       TINYINT         NOT NULL DEFAULT 0      COMMENT '是否系統內建：1=是，0=自定義',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表 — 系統角色定義';

-- --------------------------------------------------------------------------
-- 1.3 permission — 權限表
--     系統功能權限定義，與角色多對多關聯
-- --------------------------------------------------------------------------
CREATE TABLE `permission` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '權限 ID（主鍵）',
  `code`            VARCHAR(50)     NOT NULL                COMMENT '權限代碼（如 schedule:view）',
  `name`            VARCHAR(100)    NOT NULL                COMMENT '權限名稱',
  `module`          VARCHAR(50)     NOT NULL                COMMENT '所屬模組（如 schedule / member / inventory）',
  `action`          VARCHAR(30)     NOT NULL                COMMENT '操作類型（view / create / edit / delete / approve）',
  `description`     VARCHAR(255)    DEFAULT NULL            COMMENT '權限描述',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_permission_code` (`code`),
  INDEX `idx_permission_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='權限表 — 系統功能權限定義';

-- --------------------------------------------------------------------------
-- 1.4 role_permission — 角色權限關聯表
--     角色與權限的多對多關係
-- --------------------------------------------------------------------------
CREATE TABLE `role_permission` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '關聯 ID（主鍵）',
  `role_id`         BIGINT          NOT NULL                COMMENT '角色 ID（FK → role.id）',
  `permission_id`   BIGINT          NOT NULL                COMMENT '權限 ID（FK → permission.id）',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`),
  INDEX `idx_rp_permission_id` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色權限關聯表 — 角色與權限多對多';

-- --------------------------------------------------------------------------
-- 1.5 staff — 員工表
--     門店員工（美容師 / 店長），密碼以 bcrypt 加密存儲
-- --------------------------------------------------------------------------
CREATE TABLE `staff` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '員工 ID（主鍵）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '所屬門店 ID（FK → shop.id）',
  `role_id`         BIGINT          NOT NULL                COMMENT '角色 ID（FK → role.id）',
  `username`        VARCHAR(50)     NOT NULL                COMMENT '登錄帳號（唯一）',
  `password`        VARCHAR(255)    NOT NULL                COMMENT '密碼（bcrypt 加密）',
  `name`            VARCHAR(50)     NOT NULL                COMMENT '姓名',
  `phone`           VARCHAR(20)     DEFAULT NULL            COMMENT '手機號碼',
  `email`           VARCHAR(100)    DEFAULT NULL            COMMENT '電子郵件',
  `avatar`          VARCHAR(255)    DEFAULT NULL            COMMENT '頭像 URL',
  `title`           VARCHAR(50)     DEFAULT NULL            COMMENT '職稱（如資深美容師）',
  `specialties`     JSON            DEFAULT NULL            COMMENT '專長標籤（JSON 陣列，如 ["剪髮","染髮"]）',
  `hire_date`       DATE            DEFAULT NULL            COMMENT '入職日期',
  `status`          TINYINT         NOT NULL DEFAULT 1      COMMENT '狀態：1=在職，0=離職',
  `last_login`      DATETIME        DEFAULT NULL            COMMENT '最後登錄時間',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_staff_username` (`username`),
  INDEX `idx_staff_shop_id` (`shop_id`),
  INDEX `idx_staff_role_id` (`role_id`),
  INDEX `idx_staff_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='員工表 — 門店員工（美容師 / 店長），密碼 bcrypt 加密';

-- --------------------------------------------------------------------------
-- 1.6 staff_shop — 員工門店關聯表（支援跨店權限，未來擴展）
-- --------------------------------------------------------------------------
CREATE TABLE `staff_shop` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '關聯 ID（主鍵）',
  `staff_id`        BIGINT          NOT NULL                COMMENT '員工 ID（FK → staff.id）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '門店 ID（FK → shop.id）',
  `is_primary`      TINYINT         NOT NULL DEFAULT 1      COMMENT '是否主要門店：1=是，0=否',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_staff_shop` (`staff_id`, `shop_id`),
  INDEX `idx_ss_shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='員工門店關聯表 — 支援跨店權限';

-- ============================================================================
-- 2. 服務商品模組
-- ============================================================================

-- --------------------------------------------------------------------------
-- 2.1 service_category — 服務分類表
-- --------------------------------------------------------------------------
CREATE TABLE `service_category` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '分類 ID（主鍵）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '所屬門店 ID（FK → shop.id）',
  `name`            VARCHAR(50)     NOT NULL                COMMENT '分類名稱（如剪髮、染髮、護理）',
  `sort_order`      INT             NOT NULL DEFAULT 0      COMMENT '排序序號（數字越小越靠前）',
  `status`          TINYINT         NOT NULL DEFAULT 1      COMMENT '狀態：1=啟用，0=停用',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  INDEX `idx_sc_shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服務分類表 — 服務項目分類';

-- --------------------------------------------------------------------------
-- 2.2 service_item — 服務項目表
--     門店提供的各項美容服務
-- --------------------------------------------------------------------------
CREATE TABLE `service_item` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '服務項目 ID（主鍵）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '所屬門店 ID（FK → shop.id）',
  `category_id`     BIGINT          DEFAULT NULL            COMMENT '分類 ID（FK → service_category.id）',
  `name`            VARCHAR(100)    NOT NULL                COMMENT '服務名稱',
  `duration`        INT             NOT NULL                COMMENT '服務時長（分鐘）',
  `price`           DECIMAL(10,2)   NOT NULL                COMMENT '標準價格',
  `color`           VARCHAR(20)     DEFAULT NULL            COMMENT '場務表顯示顏色（十六進制，如 #FF6B6B）',
  `description`     VARCHAR(500)    DEFAULT NULL            COMMENT '服務描述',
  `image`           VARCHAR(255)    DEFAULT NULL            COMMENT '服務圖片 URL',
  `commission_type` ENUM('fixed','percent') NOT NULL DEFAULT 'percent' COMMENT '抽成類型：fixed=固定金額，percent=百分比',
  `commission_value` DECIMAL(10,2)  DEFAULT NULL            COMMENT '抽成值（固定金額或百分比數值）',
  `status`          TINYINT         NOT NULL DEFAULT 1      COMMENT '狀態：1=上架，0=下架',
  `sort_order`      INT             NOT NULL DEFAULT 0      COMMENT '排序序號',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  INDEX `idx_si_shop_id` (`shop_id`),
  INDEX `idx_si_category_id` (`category_id`),
  INDEX `idx_si_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服務項目表 — 門店美容服務定義';

-- --------------------------------------------------------------------------
-- 2.3 product_category — 產品分類表
-- --------------------------------------------------------------------------
CREATE TABLE `product_category` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '分類 ID（主鍵）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '所屬門店 ID（FK → shop.id）',
  `name`            VARCHAR(50)     NOT NULL                COMMENT '分類名稱（如洗髮精、護髮素、造型品）',
  `sort_order`      INT             NOT NULL DEFAULT 0      COMMENT '排序序號',
  `status`          TINYINT         NOT NULL DEFAULT 1      COMMENT '狀態：1=啟用，0=停用',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  INDEX `idx_pc_shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='產品分類表 — 銷售產品分類';

-- --------------------------------------------------------------------------
-- 2.4 product — 產品表
--     門店銷售或使用的產品
-- --------------------------------------------------------------------------
CREATE TABLE `product` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '產品 ID（主鍵）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '所屬門店 ID（FK → shop.id）',
  `category_id`     BIGINT          DEFAULT NULL            COMMENT '分類 ID（FK → product_category.id）',
  `name`            VARCHAR(100)    NOT NULL                COMMENT '產品名稱',
  `barcode`         VARCHAR(50)     DEFAULT NULL            COMMENT '條碼',
  `brand`           VARCHAR(100)    DEFAULT NULL            COMMENT '品牌',
  `specification`   VARCHAR(100)    DEFAULT NULL            COMMENT '規格（如 500ml / 200g）',
  `unit`            VARCHAR(10)     NOT NULL DEFAULT '個'   COMMENT '單位（個 / 瓶 / 盒 / 包）',
  `cost_price`      DECIMAL(10,2)   DEFAULT NULL            COMMENT '成本價',
  `selling_price`   DECIMAL(10,2)   NOT NULL                COMMENT '售價',
  `image`           VARCHAR(255)    DEFAULT NULL            COMMENT '產品圖片 URL',
  `description`     VARCHAR(500)    DEFAULT NULL            COMMENT '產品描述',
  `commission_type` ENUM('fixed','percent') DEFAULT 'percent' COMMENT '抽成類型',
  `commission_value` DECIMAL(10,2)  DEFAULT NULL            COMMENT '抽成值',
  `status`          TINYINT         NOT NULL DEFAULT 1      COMMENT '狀態：1=上架，0=下架',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  INDEX `idx_p_shop_id` (`shop_id`),
  INDEX `idx_p_category_id` (`category_id`),
  INDEX `idx_p_barcode` (`barcode`),
  INDEX `idx_p_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='產品表 — 門店銷售或使用產品';

-- ============================================================================
-- 3. 會員模組
-- ============================================================================

-- --------------------------------------------------------------------------
-- 3.1 member — 會員表
--     門店會員核心資料，敏感資訊（電話）以 AES-256 加密存儲
-- --------------------------------------------------------------------------
CREATE TABLE `member` (
  `id`                BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '會員 ID（主鍵）',
  `shop_id`           BIGINT          NOT NULL                COMMENT '所屬門店 ID（FK → shop.id）',
  `member_no`         VARCHAR(30)     NOT NULL                COMMENT '會員編號（自動生成，如 M202605040001）',
  `name`              VARCHAR(50)     NOT NULL                COMMENT '會員姓名',
  `phone`             VARCHAR(255)    NOT NULL                COMMENT '手機號碼（AES-256 加密存儲）',
  `phone_hash`        VARCHAR(64)     NOT NULL                COMMENT '手機號 SHA-256 雜湊（用於查重與索引）',
  `birthday`          DATE            DEFAULT NULL            COMMENT '生日',
  `gender`            TINYINT         DEFAULT NULL            COMMENT '性別：0=未知，1=男，2=女',
  `avatar`            VARCHAR(255)    DEFAULT NULL            COMMENT '頭像 URL',
  `level_id`          BIGINT          DEFAULT NULL            COMMENT '會員等級 ID（FK → member_level.id）',
  `skin_type`         VARCHAR(50)     DEFAULT NULL            COMMENT '膚質',
  `allergy_info`      VARCHAR(255)    DEFAULT NULL            COMMENT '過敏資訊',
  `preferences`       JSON            DEFAULT NULL            COMMENT '偏好記錄（JSON，如偏好的美容師、服務）',
  `tags`              JSON            DEFAULT NULL            COMMENT '會員標籤（JSON 陣列）',
  `source`            VARCHAR(30)     DEFAULT NULL            COMMENT '來源渠道（如 friend / online / walk_in）',
  `total_consumption` DECIMAL(12,2)   NOT NULL DEFAULT 0.00   COMMENT '累計消費金額',
  `visit_count`       INT             NOT NULL DEFAULT 0      COMMENT '到店次數（客次）',
  `last_visit`        DATETIME        DEFAULT NULL            COMMENT '最後到店時間',
  `status`            TINYINT         NOT NULL DEFAULT 1      COMMENT '狀態：1=正常，0=流失，2=黑名單',
  `remark`            VARCHAR(500)    DEFAULT NULL            COMMENT '備註',
  `created_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_member_no` (`member_no`),
  UNIQUE KEY `uk_member_phone_hash` (`phone_hash`),
  INDEX `idx_member_shop_id` (`shop_id`),
  INDEX `idx_member_level_id` (`level_id`),
  INDEX `idx_member_status` (`status`),
  INDEX `idx_member_last_visit` (`last_visit`),
  INDEX `idx_member_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='會員表 — 門店會員核心資料，電話 AES-256 加密';

-- --------------------------------------------------------------------------
-- 3.2 member_level — 會員等級表
-- --------------------------------------------------------------------------
CREATE TABLE `member_level` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '等級 ID（主鍵）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '所屬門店 ID（FK → shop.id）',
  `name`            VARCHAR(50)     NOT NULL                COMMENT '等級名稱（如普通會員、銀卡、金卡、鑽石）',
  `level`           INT             NOT NULL DEFAULT 1      COMMENT '等級數值（1=最低，數值越高等級越高）',
  `min_consumption` DECIMAL(12,2)   NOT NULL DEFAULT 0.00   COMMENT '升級最低消費門檻',
  `discount_rate`   DECIMAL(5,2)    DEFAULT NULL            COMMENT '折扣率（如 0.9 表示九折）',
  `color`           VARCHAR(20)     DEFAULT NULL            COMMENT '等級標籤顏色',
  `benefits`        JSON            DEFAULT NULL            COMMENT '權益描述（JSON 陣列）',
  `status`          TINYINT         NOT NULL DEFAULT 1      COMMENT '狀態：1=啟用，0=停用',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  INDEX `idx_ml_shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='會員等級表 — 會員等級與權益定義';

-- --------------------------------------------------------------------------
-- 3.3 member_asset — 會員資產表
--     儲值金、課程券（服務次數）、積分等資產
-- --------------------------------------------------------------------------
CREATE TABLE `member_asset` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '資產 ID（主鍵）',
  `member_id`       BIGINT          NOT NULL                COMMENT '會員 ID（FK → member.id）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '所屬門店 ID（FK → shop.id）',
  `asset_type`      ENUM('balance','course','points','coupon') NOT NULL COMMENT '資產類型：balance=儲值金，course=課程券，points=積分，coupon=優惠券',
  `related_id`      BIGINT          DEFAULT NULL            COMMENT '關聯 ID（如 course 關聯 service_item.id，coupon 關聯 coupon.id）',
  `total_quantity`  INT             NOT NULL DEFAULT 0      COMMENT '總數量（儲值金為金額×100，課程為次數，積分為點數）',
  `used_quantity`   INT             NOT NULL DEFAULT 0      COMMENT '已使用數量',
  `expired_quantity` INT            NOT NULL DEFAULT 0      COMMENT '已過期數量',
  `expiry_date`     DATE            DEFAULT NULL            COMMENT '到期日期（NULL=永久有效）',
  `status`          TINYINT         NOT NULL DEFAULT 1      COMMENT '狀態：1=有效，0=已用完，2=已過期',
  `remark`          VARCHAR(255)    DEFAULT NULL            COMMENT '備註',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  INDEX `idx_ma_member_id` (`member_id`),
  INDEX `idx_ma_shop_id` (`shop_id`),
  INDEX `idx_ma_asset_type` (`asset_type`),
  INDEX `idx_ma_expiry_date` (`expiry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='會員資產表 — 儲值金 / 課程券 / 積分';

-- --------------------------------------------------------------------------
-- 3.4 member_asset_log — 會員資產變動日誌
--     記錄所有資產增減操作，用於對帳與審計
-- --------------------------------------------------------------------------
CREATE TABLE `member_asset_log` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '日誌 ID（主鍵）',
  `asset_id`        BIGINT          NOT NULL                COMMENT '資產 ID（FK → member_asset.id）',
  `member_id`       BIGINT          NOT NULL                COMMENT '會員 ID（FK → member.id）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '門店 ID（FK → shop.id）',
  `change_type`     ENUM('recharge','consume','refund','expire','bonus','deduct') NOT NULL COMMENT '變動類型',
  `quantity_change` INT             NOT NULL                COMMENT '變動數量（正=增加，負=減少）',
  `balance_after`   INT             NOT NULL                COMMENT '變動後餘額',
  `appointment_id`  BIGINT          DEFAULT NULL            COMMENT '關聯預約 ID（FK → appointment.id）',
  `operator_id`     BIGINT          DEFAULT NULL            COMMENT '操作人員 ID（FK → staff.id）',
  `remark`          VARCHAR(255)    DEFAULT NULL            COMMENT '備註',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  PRIMARY KEY (`id`),
  INDEX `idx_mal_asset_id` (`asset_id`),
  INDEX `idx_mal_member_id` (`member_id`),
  INDEX `idx_mal_appointment_id` (`appointment_id`),
  INDEX `idx_mal_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='會員資產變動日誌 — 資產增減審計';

-- ============================================================================
-- 4. 票券模組
-- ============================================================================

-- --------------------------------------------------------------------------
-- 4.1 coupon — 優惠券定義表
--     門店定義的優惠活動
-- --------------------------------------------------------------------------
CREATE TABLE `coupon` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '優惠券 ID（主鍵）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '所屬門店 ID（FK → shop.id）',
  `name`            VARCHAR(100)    NOT NULL                COMMENT '優惠券名稱',
  `type`            ENUM('discount','deduction','gift') NOT NULL COMMENT '類型：discount=折扣，deduction=折抵，gift=贈送',
  `value`           DECIMAL(10,2)   NOT NULL                COMMENT '優惠值（折扣率/折抵金額）',
  `condition_amount` DECIMAL(10,2)  DEFAULT NULL            COMMENT '使用門檻（滿額條件，NULL=無門檻）',
  `valid_days`      INT             DEFAULT NULL            COMMENT '領取後有效天數（NULL=固定日期）',
  `valid_start`     DATE            DEFAULT NULL            COMMENT '有效起始日期',
  `valid_end`       DATE            DEFAULT NULL            COMMENT '有效截止日期',
  `total_quantity`  INT             NOT NULL DEFAULT 0      COMMENT '發行總數量（0=不限量）',
  `used_quantity`   INT             NOT NULL DEFAULT 0      COMMENT '已使用數量',
  `status`          TINYINT         NOT NULL DEFAULT 1      COMMENT '狀態：1=啟用，0=停用',
  `description`     VARCHAR(500)    DEFAULT NULL            COMMENT '活動說明',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  INDEX `idx_coupon_shop_id` (`shop_id`),
  INDEX `idx_coupon_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='優惠券定義表 — 門店優惠活動';

-- --------------------------------------------------------------------------
-- 4.2 member_coupon — 會員持有優惠券表
-- --------------------------------------------------------------------------
CREATE TABLE `member_coupon` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '記錄 ID（主鍵）',
  `member_id`       BIGINT          NOT NULL                COMMENT '會員 ID（FK → member.id）',
  `coupon_id`       BIGINT          NOT NULL                COMMENT '優惠券 ID（FK → coupon.id）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '門店 ID（FK → shop.id）',
  `code`            VARCHAR(30)     NOT NULL                COMMENT '優惠券兌換碼',
  `status`          ENUM('unused','used','expired') NOT NULL DEFAULT 'unused' COMMENT '狀態：unused=未使用，used=已使用，expired=已過期',
  `used_at`         DATETIME        DEFAULT NULL            COMMENT '使用時間',
  `appointment_id`  BIGINT          DEFAULT NULL            COMMENT '使用預約 ID（FK → appointment.id）',
  `expiry_date`     DATE            NOT NULL                COMMENT '到期日期',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '領取時間',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mc_code` (`code`),
  INDEX `idx_mc_member_id` (`member_id`),
  INDEX `idx_mc_coupon_id` (`coupon_id`),
  INDEX `idx_mc_status` (`status`),
  INDEX `idx_mc_expiry_date` (`expiry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='會員持有優惠券表 — 會員領取與使用記錄';

-- ============================================================================
-- 5. 場務模組
-- ============================================================================

-- --------------------------------------------------------------------------
-- 5.1 schedule — 場務表（美容師排班）
--     記錄美容師每日排班時段，為預約衝突檢測基礎
-- --------------------------------------------------------------------------
CREATE TABLE `schedule` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '場務 ID（主鍵）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '門店 ID（FK → shop.id）',
  `staff_id`        BIGINT          NOT NULL                COMMENT '美容師 ID（FK → staff.id）',
  `date`            DATE            NOT NULL                COMMENT '日期',
  `start_time`      TIME            NOT NULL                COMMENT '上班時間',
  `end_time`        TIME            NOT NULL                COMMENT '下班時間',
  `break_start`     TIME            DEFAULT NULL            COMMENT '休息開始時間',
  `break_end`       TIME            DEFAULT NULL            COMMENT '休息結束時間',
  `is_off`          TINYINT         NOT NULL DEFAULT 0      COMMENT '是否公休/請假：1=是，0=否',
  `leave_id`        BIGINT          DEFAULT NULL            COMMENT '關聯請假單 ID（FK → leave.id）',
  `status`          ENUM('available','busy','off') NOT NULL DEFAULT 'available' COMMENT '時段狀態：available=可預約，busy=已排滿，off=休息',
  `remark`          VARCHAR(255)    DEFAULT NULL            COMMENT '備註',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_schedule_staff_date` (`staff_id`, `date`),
  INDEX `idx_schedule_shop_id` (`shop_id`),
  INDEX `idx_schedule_date` (`date`),
  INDEX `idx_schedule_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='場務表 — 美容師排班與時段狀態';

-- --------------------------------------------------------------------------
-- 5.2 leave — 請假記錄表
-- --------------------------------------------------------------------------
CREATE TABLE `leave` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '請假 ID（主鍵）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '門店 ID（FK → shop.id）',
  `staff_id`        BIGINT          NOT NULL                COMMENT '請假美容師 ID（FK → staff.id）',
  `type`            ENUM('annual','sick','personal','other') NOT NULL COMMENT '請假類型：annual=年假，sick=病假，personal=事假，other=其他',
  `start_date`      DATE            NOT NULL                COMMENT '請假起始日期',
  `end_date`        DATE            NOT NULL                COMMENT '請假結束日期',
  `reason`          VARCHAR(500)    DEFAULT NULL            COMMENT '請假原因',
  `status`          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' COMMENT '審批狀態：pending=待審批，approved=已通過，rejected=已拒絕',
  `approved_by`     BIGINT          DEFAULT NULL            COMMENT '審批人 ID（FK → staff.id，通常為店長）',
  `approved_at`     DATETIME        DEFAULT NULL            COMMENT '審批時間',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  INDEX `idx_leave_shop_id` (`shop_id`),
  INDEX `idx_leave_staff_id` (`staff_id`),
  INDEX `idx_leave_status` (`status`),
  INDEX `idx_leave_date_range` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='請假記錄表 — 美容師請假申請與審批';

-- ============================================================================
-- 6. 預約模組（核心交易）
-- ============================================================================

-- --------------------------------------------------------------------------
-- 6.1 appointment — 預約訂單表（核心交易表）
--     美業 SaaS 最核心的交易記錄，串聯會員、美容師、服務、業績
-- --------------------------------------------------------------------------
CREATE TABLE `appointment` (
  `id`                BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '預約 ID（主鍵）',
  `shop_id`           BIGINT          NOT NULL                COMMENT '門店 ID（FK → shop.id）',
  `member_id`         BIGINT          NOT NULL                COMMENT '會員 ID（FK → member.id）',
  `staff_id`          BIGINT          NOT NULL                COMMENT '美容師 ID（FK → staff.id）',
  `schedule_id`       BIGINT          DEFAULT NULL            COMMENT '場務表 ID（FK → schedule.id）',
  `order_no`          VARCHAR(30)     NOT NULL                COMMENT '訂單編號（自動生成，如 ORD202605040001）',
  `status`            ENUM('pending','confirmed','in_progress','completed','cancelled','no_show') NOT NULL DEFAULT 'pending' COMMENT '預約狀態：pending=待確認，confirmed=已確認，in_progress=服務中，completed=已完成，cancelled=已取消，no_show=未到店',
  `total_duration`    INT             NOT NULL DEFAULT 0      COMMENT '總時長（分鐘）',
  `total_amount`      DECIMAL(10,2)   NOT NULL DEFAULT 0.00   COMMENT '總金額（服務+商品）',
  `discount_amount`   DECIMAL(10,2)   NOT NULL DEFAULT 0.00   COMMENT '折扣金額',
  `final_amount`      DECIMAL(10,2)   NOT NULL DEFAULT 0.00   COMMENT '實收金額',
  `payment_method`    VARCHAR(20)     DEFAULT NULL            COMMENT '支付方式（cash / credit_card / line_pay / balance）',
  `remark`            VARCHAR(500)    DEFAULT NULL            COMMENT '備註',
  `appointment_date`  DATE            NOT NULL                COMMENT '預約日期',
  `start_time`        TIME            NOT NULL                COMMENT '開始時間',
  `end_time`          TIME            NOT NULL                COMMENT '結束時間',
  `completed_at`      DATETIME        DEFAULT NULL            COMMENT '服務完成時間',
  `cancelled_at`      DATETIME        DEFAULT NULL            COMMENT '取消時間',
  `cancel_reason`     VARCHAR(255)    DEFAULT NULL            COMMENT '取消原因',
  `created_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_appointment_order_no` (`order_no`),
  INDEX `idx_appointment_shop_id` (`shop_id`),
  INDEX `idx_appointment_member_id` (`member_id`),
  INDEX `idx_appointment_staff_id` (`staff_id`),
  INDEX `idx_appointment_schedule_id` (`schedule_id`),
  INDEX `idx_appointment_status` (`status`),
  INDEX `idx_appointment_date` (`appointment_date`),
  INDEX `idx_appointment_start_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='預約訂單表（核心交易表）— 串聯會員、美容師、服務、業績';

-- --------------------------------------------------------------------------
-- 6.2 appointment_item — 預約項目明細表
--     一筆預約可包含多個服務項目
-- --------------------------------------------------------------------------
CREATE TABLE `appointment_item` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '明細 ID（主鍵）',
  `appointment_id`  BIGINT          NOT NULL                COMMENT '預約 ID（FK → appointment.id）',
  `item_type`       ENUM('service','product') NOT NULL      COMMENT '項目類型：service=服務，product=產品',
  `service_id`      BIGINT          DEFAULT NULL            COMMENT '服務項目 ID（FK → service_item.id）',
  `product_id`      BIGINT          DEFAULT NULL            COMMENT '產品 ID（FK → product.id）',
  `name`            VARCHAR(100)    NOT NULL                COMMENT '項目名稱（快照）',
  `quantity`        INT             NOT NULL DEFAULT 1      COMMENT '數量',
  `unit_price`      DECIMAL(10,2)   NOT NULL                COMMENT '單價',
  `subtotal`        DECIMAL(10,2)   NOT NULL                COMMENT '小計金額',
  `duration`        INT             DEFAULT NULL            COMMENT '時長（分鐘，僅服務項目）',
  `staff_id`        BIGINT          DEFAULT NULL            COMMENT '服務美容師（可指定不同美容師）',
  `sort_order`      INT             NOT NULL DEFAULT 0      COMMENT '排序序號',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  PRIMARY KEY (`id`),
  INDEX `idx_ai_appointment_id` (`appointment_id`),
  INDEX `idx_ai_service_id` (`service_id`),
  INDEX `idx_ai_product_id` (`product_id`),
  INDEX `idx_ai_staff_id` (`staff_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='預約項目明細表 — 預約中包含的服務或產品';

-- --------------------------------------------------------------------------
-- 6.3 appointment_payment — 預約支付記錄表
--     支援一筆預約多次支付（如訂金 + 尾款）
-- --------------------------------------------------------------------------
CREATE TABLE `appointment_payment` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '支付 ID（主鍵）',
  `appointment_id`  BIGINT          NOT NULL                COMMENT '預約 ID（FK → appointment.id）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '門店 ID（FK → shop.id）',
  `payment_no`      VARCHAR(30)     NOT NULL                COMMENT '支付流水號',
  `payment_method`  VARCHAR(20)     NOT NULL                COMMENT '支付方式',
  `amount`          DECIMAL(10,2)   NOT NULL                COMMENT '支付金額',
  `payment_time`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '支付時間',
  `status`          ENUM('success','failed','refunded') NOT NULL DEFAULT 'success' COMMENT '支付狀態',
  `remark`          VARCHAR(255)    DEFAULT NULL            COMMENT '備註',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ap_payment_no` (`payment_no`),
  INDEX `idx_ap_appointment_id` (`appointment_id`),
  INDEX `idx_ap_shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='預約支付記錄表 — 支援多次支付';

-- ============================================================================
-- 7. 業績模組
-- ============================================================================

-- --------------------------------------------------------------------------
-- 7.1 performance — 業績記錄表
--     記錄每筆預約產生的業績，按美容師歸屬
-- --------------------------------------------------------------------------
CREATE TABLE `performance` (
  `id`                BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '業績 ID（主鍵）',
  `shop_id`           BIGINT          NOT NULL                COMMENT '門店 ID（FK → shop.id）',
  `staff_id`          BIGINT          NOT NULL                COMMENT '美容師 ID（FK → staff.id）',
  `appointment_id`    BIGINT          NOT NULL                COMMENT '關聯預約 ID（FK → appointment.id）',
  `appointment_item_id` BIGINT        DEFAULT NULL            COMMENT '關聯預約明細 ID（FK → appointment_item.id）',
  `type`              ENUM('service','product') NOT NULL      COMMENT '業績類型：service=服務業績，product=商品業績',
  `category_id`       BIGINT          DEFAULT NULL            COMMENT '分類 ID',
  `item_name`         VARCHAR(100)    NOT NULL                COMMENT '項目名稱（快照）',
  `quantity`          INT             NOT NULL DEFAULT 1      COMMENT '數量',
  `amount`            DECIMAL(10,2)   NOT NULL                COMMENT '業績金額',
  `commission_rate`   DECIMAL(5,2)    DEFAULT NULL            COMMENT '抽成比例（%）',
  `commission_amount` DECIMAL(10,2)   DEFAULT NULL            COMMENT '抽成金額',
  `performance_date`  DATE            NOT NULL                COMMENT '業績歸屬日期',
  `settled`           TINYINT         NOT NULL DEFAULT 0      COMMENT '是否已結算：1=是，0=否',
  `settled_at`        DATETIME        DEFAULT NULL            COMMENT '結算時間',
  `created_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  PRIMARY KEY (`id`),
  INDEX `idx_perf_shop_id` (`shop_id`),
  INDEX `idx_perf_staff_id` (`staff_id`),
  INDEX `idx_perf_appointment_id` (`appointment_id`),
  INDEX `idx_perf_type` (`type`),
  INDEX `idx_perf_date` (`performance_date`),
  INDEX `idx_perf_settled` (`settled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='業績記錄表 — 美容師業績歸屬';

-- --------------------------------------------------------------------------
-- 7.2 commission — 抽成明細表
--     記錄每筆業績的抽成計算結果
-- --------------------------------------------------------------------------
CREATE TABLE `commission` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '抽成 ID（主鍵）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '門店 ID（FK → shop.id）',
  `staff_id`        BIGINT          NOT NULL                COMMENT '美容師 ID（FK → staff.id）',
  `performance_id`  BIGINT          DEFAULT NULL            COMMENT '關聯業績 ID（FK → performance.id）',
  `type`            ENUM('service_commission','product_commission','bonus','deduction') NOT NULL COMMENT '抽成類型',
  `amount`          DECIMAL(10,2)   NOT NULL                COMMENT '抽成金額',
  `rate`            DECIMAL(5,2)    DEFAULT NULL            COMMENT '抽成比例（%）',
  `description`     VARCHAR(255)    DEFAULT NULL            COMMENT '說明',
  `settled`         TINYINT         NOT NULL DEFAULT 0      COMMENT '是否已結算：1=是，0=否',
  `settled_at`      DATETIME        DEFAULT NULL            COMMENT '結算時間',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  PRIMARY KEY (`id`),
  INDEX `idx_comm_shop_id` (`shop_id`),
  INDEX `idx_comm_staff_id` (`staff_id`),
  INDEX `idx_comm_performance_id` (`performance_id`),
  INDEX `idx_comm_type` (`type`),
  INDEX `idx_comm_settled` (`settled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='抽成明細表 — 美容師抽成計算';

-- --------------------------------------------------------------------------
-- 7.3 commission_settlement — 抽成結算表
--     按月或按週結算記錄
-- --------------------------------------------------------------------------
CREATE TABLE `commission_settlement` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '結算 ID（主鍵）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '門店 ID（FK → shop.id）',
  `staff_id`        BIGINT          NOT NULL                COMMENT '美容師 ID（FK → staff.id）',
  `period_start`    DATE            NOT NULL                COMMENT '結算週期起始日',
  `period_end`      DATE            NOT NULL                COMMENT '結算週期結束日',
  `total_commission` DECIMAL(12,2)  NOT NULL DEFAULT 0.00   COMMENT '抽成總額',
  `total_bonus`     DECIMAL(12,2)   NOT NULL DEFAULT 0.00   COMMENT '獎金總額',
  `total_deduction` DECIMAL(12,2)   NOT NULL DEFAULT 0.00   COMMENT '扣款總額',
  `net_amount`      DECIMAL(12,2)   NOT NULL DEFAULT 0.00   COMMENT '實發金額',
  `status`          ENUM('pending','confirmed','paid') NOT NULL DEFAULT 'pending' COMMENT '狀態：pending=待確認，confirmed=已確認，paid=已發放',
  `confirmed_by`    BIGINT          DEFAULT NULL            COMMENT '確認人（FK → staff.id，通常為店長）',
  `confirmed_at`    DATETIME        DEFAULT NULL            COMMENT '確認時間',
  `paid_at`         DATETIME        DEFAULT NULL            COMMENT '發放時間',
  `remark`          VARCHAR(500)    DEFAULT NULL            COMMENT '備註',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  INDEX `idx_cs_shop_id` (`shop_id`),
  INDEX `idx_cs_staff_id` (`staff_id`),
  INDEX `idx_cs_period` (`period_start`, `period_end`),
  INDEX `idx_cs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='抽成結算表 — 週期性抽成結算';

-- ============================================================================
-- 8. 庫存模組
-- ============================================================================

-- --------------------------------------------------------------------------
-- 8.1 inventory — 庫存記錄表
--     門店產品庫存，支援批次管理
-- --------------------------------------------------------------------------
CREATE TABLE `inventory` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '庫存 ID（主鍵）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '門店 ID（FK → shop.id）',
  `product_id`      BIGINT          NOT NULL                COMMENT '產品 ID（FK → product.id）',
  `batch_no`        VARCHAR(50)     DEFAULT NULL            COMMENT '批次號',
  `quantity`        INT             NOT NULL DEFAULT 0      COMMENT '當前庫存數量',
  `min_quantity`    INT             NOT NULL DEFAULT 0      COMMENT '最低庫存預警數量',
  `unit`            VARCHAR(10)     NOT NULL DEFAULT '個'   COMMENT '單位',
  `cost_price`      DECIMAL(10,2)   DEFAULT NULL            COMMENT '成本價（批次成本）',
  `selling_price`   DECIMAL(10,2)   DEFAULT NULL            COMMENT '售價',
  `expiry_date`     DATE            DEFAULT NULL            COMMENT '有效日期',
  `status`          ENUM('normal','low','out_of_stock','expired') NOT NULL DEFAULT 'normal' COMMENT '庫存狀態',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  INDEX `idx_inv_shop_id` (`shop_id`),
  INDEX `idx_inv_product_id` (`product_id`),
  INDEX `idx_inv_batch_no` (`batch_no`),
  INDEX `idx_inv_status` (`status`),
  INDEX `idx_inv_expiry_date` (`expiry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='庫存記錄表 — 門店產品庫存與批次管理';

-- --------------------------------------------------------------------------
-- 8.2 inventory_log — 庫存變動日誌
--     記錄所有入庫、出庫、盤點操作
-- --------------------------------------------------------------------------
CREATE TABLE `inventory_log` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '日誌 ID（主鍵）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '門店 ID（FK → shop.id）',
  `product_id`      BIGINT          NOT NULL                COMMENT '產品 ID（FK → product.id）',
  `inventory_id`    BIGINT          DEFAULT NULL            COMMENT '庫存記錄 ID（FK → inventory.id）',
  `change_type`     ENUM('inbound','outbound','pick','return','check','adjustment') NOT NULL COMMENT '變動類型',
  `quantity_change` INT             NOT NULL                COMMENT '變動數量（正=入庫，負=出庫）',
  `balance_after`   INT             NOT NULL                COMMENT '變動後庫存',
  `reference_no`    VARCHAR(30)     DEFAULT NULL            COMMENT '關聯單號（如領料單號、採購單號）',
  `operator_id`     BIGINT          DEFAULT NULL            COMMENT '操作人員 ID（FK → staff.id）',
  `remark`          VARCHAR(255)    DEFAULT NULL            COMMENT '備註',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  PRIMARY KEY (`id`),
  INDEX `idx_il_shop_id` (`shop_id`),
  INDEX `idx_il_product_id` (`product_id`),
  INDEX `idx_il_inventory_id` (`inventory_id`),
  INDEX `idx_il_change_type` (`change_type`),
  INDEX `idx_il_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='庫存變動日誌 — 庫存操作審計';

-- --------------------------------------------------------------------------
-- 8.3 pick_order — 領料單
--     美容師申請領料，需店長審批
-- --------------------------------------------------------------------------
CREATE TABLE `pick_order` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '領料單 ID（主鍵）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '門店 ID（FK → shop.id）',
  `staff_id`        BIGINT          NOT NULL                COMMENT '領料人（美容師）ID（FK → staff.id）',
  `pick_no`         VARCHAR(30)     NOT NULL                COMMENT '領料單號（自動生成，如 PK202605040001）',
  `status`          ENUM('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending' COMMENT '狀態：pending=待審批，approved=已通過，rejected=已拒絕，completed=已完成',
  `total_items`     INT             NOT NULL DEFAULT 0      COMMENT '項目數量',
  `remark`          VARCHAR(500)    DEFAULT NULL            COMMENT '備註',
  `approved_by`     BIGINT          DEFAULT NULL            COMMENT '審批人 ID（FK → staff.id，店長）',
  `approved_at`     DATETIME        DEFAULT NULL            COMMENT '審批時間',
  `completed_at`    DATETIME        DEFAULT NULL            COMMENT '完成時間',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_po_pick_no` (`pick_no`),
  INDEX `idx_po_shop_id` (`shop_id`),
  INDEX `idx_po_staff_id` (`staff_id`),
  INDEX `idx_po_status` (`status`),
  INDEX `idx_po_approved_by` (`approved_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='領料單 — 美容師領料申請與審批';

-- --------------------------------------------------------------------------
-- 8.4 pick_item — 領料明細表
-- --------------------------------------------------------------------------
CREATE TABLE `pick_item` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '明細 ID（主鍵）',
  `pick_order_id`   BIGINT          NOT NULL                COMMENT '領料單 ID（FK → pick_order.id）',
  `product_id`      BIGINT          NOT NULL                COMMENT '產品 ID（FK → product.id）',
  `inventory_id`    BIGINT          DEFAULT NULL            COMMENT '庫存記錄 ID（FK → inventory.id）',
  `quantity`        INT             NOT NULL                COMMENT '領料數量',
  `unit`            VARCHAR(10)     NOT NULL DEFAULT '個'   COMMENT '單位',
  `remark`          VARCHAR(255)    DEFAULT NULL            COMMENT '備註',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  PRIMARY KEY (`id`),
  INDEX `idx_pi_pick_order_id` (`pick_order_id`),
  INDEX `idx_pi_product_id` (`product_id`),
  INDEX `idx_pi_inventory_id` (`inventory_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='領料明細表 — 領料單中的產品明細';

-- ============================================================================
-- 9. 作品集模組
-- ============================================================================

-- --------------------------------------------------------------------------
-- 9.1 portfolio — 作品集表
--     美容師上傳的作品圖片/影片
-- --------------------------------------------------------------------------
CREATE TABLE `portfolio` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '作品 ID（主鍵）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '門店 ID（FK → shop.id）',
  `staff_id`        BIGINT          NOT NULL                COMMENT '美容師 ID（FK → staff.id）',
  `media_type`      ENUM('image','video') NOT NULL DEFAULT 'image' COMMENT '媒體類型：image=圖片，video=影片',
  `url`             VARCHAR(255)    NOT NULL                COMMENT '媒體檔案 URL',
  `thumbnail_url`   VARCHAR(255)    DEFAULT NULL            COMMENT '縮圖 URL',
  `title`           VARCHAR(100)    DEFAULT NULL            COMMENT '作品標題',
  `description`     VARCHAR(500)    DEFAULT NULL            COMMENT '作品描述',
  `service_ids`     JSON            DEFAULT NULL            COMMENT '關聯服務項目 ID（JSON 陣列）',
  `sort_order`      INT             NOT NULL DEFAULT 0      COMMENT '排序序號',
  `status`          TINYINT         NOT NULL DEFAULT 1      COMMENT '狀態：1=展示，0=隱藏',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  INDEX `idx_portfolio_shop_id` (`shop_id`),
  INDEX `idx_portfolio_staff_id` (`staff_id`),
  INDEX `idx_portfolio_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='作品集表 — 美容師作品展示';

-- ============================================================================
-- 10. 通知模組
-- ============================================================================

-- --------------------------------------------------------------------------
-- 10.1 notification — 通知記錄表
--     系統通知、預約提醒、行銷推播
-- --------------------------------------------------------------------------
CREATE TABLE `notification` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '通知 ID（主鍵）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '門店 ID（FK → shop.id）',
  `type`            ENUM('appointment_reminder','appointment_completed','system_alert','marketing','leave_approval','pick_approval') NOT NULL COMMENT '通知類型',
  `title`           VARCHAR(200)    NOT NULL                COMMENT '通知標題',
  `content`         TEXT            NOT NULL                COMMENT '通知內容',
  `sender_id`       BIGINT          DEFAULT NULL            COMMENT '發送人 ID（FK → staff.id，NULL=系統）',
  `receiver_type`   ENUM('staff','member','all') NOT NULL   COMMENT '接收對象類型',
  `receiver_id`     BIGINT          DEFAULT NULL            COMMENT '接收對象 ID（FK → staff.id 或 member.id，NULL=全部）',
  `reference_type`  VARCHAR(30)     DEFAULT NULL            COMMENT '關聯類型（如 appointment / leave / pick_order）',
  `reference_id`    BIGINT          DEFAULT NULL            COMMENT '關聯業務 ID',
  `is_read`         TINYINT         NOT NULL DEFAULT 0      COMMENT '是否已讀：1=是，0=否',
  `read_at`         DATETIME        DEFAULT NULL            COMMENT '閱讀時間',
  `channel`         ENUM('in_app','sms','push') NOT NULL DEFAULT 'in_app' COMMENT '發送渠道',
  `status`          ENUM('pending','sent','failed') NOT NULL DEFAULT 'pending' COMMENT '發送狀態',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  PRIMARY KEY (`id`),
  INDEX `idx_notif_shop_id` (`shop_id`),
  INDEX `idx_notif_type` (`type`),
  INDEX `idx_notif_receiver` (`receiver_type`, `receiver_id`),
  INDEX `idx_notif_is_read` (`is_read`),
  INDEX `idx_notif_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知記錄表 — 系統通知與提醒';

-- ============================================================================
-- 11. 系統日誌模組
-- ============================================================================

-- --------------------------------------------------------------------------
-- 11.1 operation_log — 操作日誌表
--     記錄所有重要操作，用於審計追蹤
-- --------------------------------------------------------------------------
CREATE TABLE `operation_log` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '日誌 ID（主鍵）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '門店 ID（FK → shop.id）',
  `staff_id`        BIGINT          DEFAULT NULL            COMMENT '操作人員 ID（FK → staff.id）',
  `module`          VARCHAR(50)     NOT NULL                COMMENT '操作模組',
  `action`          VARCHAR(50)     NOT NULL                COMMENT '操作動作（如 create_appointment / cancel_appointment）',
  `target_type`     VARCHAR(30)     DEFAULT NULL            COMMENT '操作對象類型',
  `target_id`       BIGINT          DEFAULT NULL            COMMENT '操作對象 ID',
  `detail`          JSON            DEFAULT NULL            COMMENT '操作詳情（JSON）',
  `ip_address`      VARCHAR(45)     DEFAULT NULL            COMMENT '操作 IP',
  `user_agent`      VARCHAR(255)    DEFAULT NULL            COMMENT '用戶代理',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  PRIMARY KEY (`id`),
  INDEX `idx_ol_shop_id` (`shop_id`),
  INDEX `idx_ol_staff_id` (`staff_id`),
  INDEX `idx_ol_module` (`module`),
  INDEX `idx_ol_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日誌表 — 審計追蹤';

-- ============================================================================
-- 12. 系統配置模組
-- ============================================================================

-- --------------------------------------------------------------------------
-- 12.1 system_config — 系統配置表
--     門店級別的 Key-Value 配置
-- --------------------------------------------------------------------------
CREATE TABLE `system_config` (
  `id`              BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '配置 ID（主鍵）',
  `shop_id`         BIGINT          NOT NULL                COMMENT '門店 ID（FK → shop.id）',
  `config_key`      VARCHAR(100)    NOT NULL                COMMENT '配置鍵名',
  `config_value`    TEXT            NOT NULL                COMMENT '配置值',
  `description`     VARCHAR(255)    DEFAULT NULL            COMMENT '配置說明',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sc_shop_key` (`shop_id`, `config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系統配置表 — 門店級 Key-Value 配置';