-- ============================================================================
-- 美業 SaaS 智慧管理系統 - 種子數據
-- 版本: v1.0
-- 說明: 初始化系統必備數據（角色、權限、管理員帳號）
-- ============================================================================

USE `salon_pro`;

-- ============================================================================
-- 1. 系統角色
-- ============================================================================

INSERT INTO `role` (`code`, `name`, `description`, `is_system`) VALUES
('super_admin', '超級管理員', 'SaaS 平台超級管理員，可管理所有門店', 1),
('manager',     '店長',       '門店管理員，擁有門店全部管理權限',       1),
('beautician',  '美容師',     '美容師，僅限個人業務操作',               1);

-- ============================================================================
-- 2. 系統權限
-- ============================================================================

-- 場務表模組
INSERT INTO `permission` (`code`, `name`, `module`, `action`, `description`) VALUES
('schedule:view',   '查看場務表',   'schedule', 'view',   '查看場務表（店長可看全店，美容師僅個人）'),
('schedule:create', '新增排班',     'schedule', 'create', '新增排班記錄'),
('schedule:edit',   '編輯排班',     'schedule', 'edit',   '編輯排班記錄'),
('schedule:delete', '刪除排班',     'schedule', 'delete', '刪除排班記錄');

-- 預約模組
INSERT INTO `permission` (`code`, `name`, `module`, `action`, `description`) VALUES
('appointment:view',     '查看預約',   'appointment', 'view',   '查看預約記錄'),
('appointment:create',   '新增預約',   'appointment', 'create', '新增預約訂單'),
('appointment:edit',     '編輯預約',   'appointment', 'edit',   '編輯預約訂單'),
('appointment:delete',   '刪除預約',   'appointment', 'delete', '刪除預約訂單'),
('appointment:complete', '完成服務',   'appointment', 'complete', '標記服務完成');

-- 會員模組
INSERT INTO `permission` (`code`, `name`, `module`, `action`, `description`) VALUES
('member:view',   '查看會員',   'member', 'view',   '查看會員資料'),
('member:create', '新增會員',   'member', 'create', '新增會員'),
('member:edit',   '編輯會員',   'member', 'edit',   '編輯會員資料'),
('member:delete', '刪除會員',   'member', 'delete', '刪除會員');

-- 業績模組
INSERT INTO `permission` (`code`, `name`, `module`, `action`, `description`) VALUES
('performance:view',    '查看業績',   'performance', 'view',   '查看業績數據'),
('performance:export',  '匯出業績',   'performance', 'export', '匯出業績報表');

-- 庫存模組
INSERT INTO `permission` (`code`, `name`, `module`, `action`, `description`) VALUES
('inventory:view',   '查看庫存',   'inventory', 'view',   '查看庫存列表'),
('inventory:edit',   '編輯庫存',   'inventory', 'edit',   '編輯庫存（入庫/出庫/盤點）'),
('pick:create',      '申請領料',   'inventory', 'create', '申請領料'),
('pick:approve',     '審批領料',   'inventory', 'approve', '審批領料申請');

-- 員工管理模組
INSERT INTO `permission` (`code`, `name`, `module`, `action`, `description`) VALUES
('staff:view',   '查看員工',   'staff', 'view',   '查看員工列表'),
('staff:create', '新增員工',   'staff', 'create', '新增員工帳號'),
('staff:edit',   '編輯員工',   'staff', 'edit',   '編輯員工資料'),
('staff:delete', '刪除員工',   'staff', 'delete', '刪除員工帳號');

-- 服務項目管理模組
INSERT INTO `permission` (`code`, `name`, `module`, `action`, `description`) VALUES
('service:view',   '查看服務項目', 'service', 'view',   '查看服務項目列表'),
('service:create', '新增服務項目', 'service', 'create', '新增服務項目'),
('service:edit',   '編輯服務項目', 'service', 'edit',   '編輯服務項目'),
('service:delete', '刪除服務項目', 'service', 'delete', '刪除服務項目');

-- 門店設置模組
INSERT INTO `permission` (`code`, `name`, `module`, `action`, `description`) VALUES
('shop:view',   '查看門店設定', 'shop', 'view',   '查看門店設定'),
('shop:edit',   '編輯門店設定', 'shop', 'edit',   '編輯門店設定');

-- 作品集模組
INSERT INTO `permission` (`code`, `name`, `module`, `action`, `description`) VALUES
('portfolio:view',   '查看作品集', 'portfolio', 'view',   '查看作品集'),
('portfolio:create', '上傳作品',   'portfolio', 'create', '上傳作品'),
('portfolio:edit',   '編輯作品',   'portfolio', 'edit',   '編輯作品'),
('portfolio:delete', '刪除作品',   'portfolio', 'delete', '刪除作品');

-- 儀表板模組
INSERT INTO `permission` (`code`, `name`, `module`, `action`, `description`) VALUES
('dashboard:view', '查看儀表板', 'dashboard', 'view', '查看儀表板數據');

-- ============================================================================
-- 3. 角色權限關聯
-- ============================================================================

-- 店長角色（manager）擁有所有門店管理權限
INSERT INTO `role_permission` (`role_id`, `permission_id`)
SELECT
  (SELECT `id` FROM `role` WHERE `code` = 'manager'),
  `id`
FROM `permission`;

-- 美容師角色（beautician）僅擁有個人業務相關權限
INSERT INTO `role_permission` (`role_id`, `permission_id`)
SELECT
  (SELECT `id` FROM `role` WHERE `code` = 'beautician'),
  `id`
FROM `permission`
WHERE `code` IN (
  'schedule:view', 'schedule:create', 'schedule:edit',
  'appointment:view', 'appointment:create', 'appointment:edit', 'appointment:complete',
  'member:view', 'member:create', 'member:edit',
  'performance:view',
  'pick:create',
  'portfolio:view', 'portfolio:create', 'portfolio:edit', 'portfolio:delete',
  'dashboard:view'
);

-- ============================================================================
-- 4. 預設門店與管理員（示範用）
-- ============================================================================

-- 密碼為 "admin123" 的 bcrypt 雜湊
INSERT INTO `shop` (`code`, `name`, `phone`, `address`, `status`, `business_hours`) VALUES
('SALON001', '示範沙龍旗艦店', '02-12345678', '台北市大安區忠孝東路四段100號', 1,
 '{"monday":{"start":"09:00","end":"20:00"},"tuesday":{"start":"09:00","end":"20:00"},"wednesday":{"start":"09:00","end":"20:00"},"thursday":{"start":"09:00","end":"20:00"},"friday":{"start":"09:00","end":"21:00"},"saturday":{"start":"10:00","end":"21:00"},"sunday":{"start":"10:00","end":"18:00"}}');

INSERT INTO `staff` (`shop_id`, `role_id`, `username`, `password`, `name`, `phone`, `title`, `status`) VALUES
(1, (SELECT `id` FROM `role` WHERE `code` = 'manager'),
 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 '店長小美', '0911-111-111', '店長', 1);

INSERT INTO `staff` (`shop_id`, `role_id`, `username`, `password`, `name`, `phone`, `title`, `specialties`, `status`) VALUES
(1, (SELECT `id` FROM `role` WHERE `code` = 'beautician'),
 'lulu', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 'LULU', '0922-222-222', '資深美容師', '["剪髮","染髮","護理"]', 1);

INSERT INTO `staff` (`shop_id`, `role_id`, `username`, `password`, `name`, `phone`, `title`, `specialties`, `status`) VALUES
(1, (SELECT `id` FROM `role` WHERE `code` = 'beautician'),
 'amy', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 'AMY', '0933-333-333', '美容師', '["護膚","美甲"]', 1);

-- ============================================================================
-- 5. 預設服務分類與項目
-- ============================================================================

INSERT INTO `service_category` (`shop_id`, `name`, `sort_order`) VALUES
(1, '剪髮', 1),
(1, '染髮', 2),
(1, '燙髮', 3),
(1, '護理', 4),
(1, '頭皮護理', 5);

INSERT INTO `service_item` (`shop_id`, `category_id`, `name`, `duration`, `price`, `color`, `commission_type`, `commission_value`, `sort_order`) VALUES
(1, 1, '洗剪吹',         60,  800.00,  '#FF6B6B', 'percent', 40.00, 1),
(1, 1, '男士剪髮',       45,  600.00,  '#FF6B6B', 'percent', 40.00, 2),
(1, 2, '全染',           120, 2500.00, '#4ECDC4', 'percent', 35.00, 3),
(1, 2, '挑染',           90,  1800.00, '#4ECDC4', 'percent', 35.00, 4),
(1, 3, '溫塑燙',         150, 3500.00, '#FFE66D', 'percent', 35.00, 5),
(1, 3, '冷燙',           120, 2500.00, '#FFE66D', 'percent', 35.00, 6),
(1, 4, '深層護理',       45,  1200.00, '#95E1D3', 'percent', 40.00, 7),
(1, 4, '結構式護髮',     60,  1800.00, '#95E1D3', 'percent', 40.00, 8),
(1, 5, '頭皮深層清潔',   45,  1000.00, '#F38181', 'percent', 40.00, 9),
(1, 5, '頭皮養護療程',   60,  1500.00, '#F38181', 'percent', 40.00, 10);

-- ============================================================================
-- 6. 預設會員等級
-- ============================================================================

INSERT INTO `member_level` (`shop_id`, `name`, `level`, `min_consumption`, `discount_rate`, `color`, `benefits`) VALUES
(1, '普通會員', 1, 0.00,    1.00, '#999999', '["生日優惠","累積積分"]'),
(1, '銀卡會員', 2, 5000.00, 0.95, '#C0C0C0', '["生日優惠","累積積分","95折優惠","優先預約"]'),
(1, '金卡會員', 3, 15000.00, 0.90, '#FFD700', '["生日優惠","累積積分","9折優惠","優先預約","專屬美容師"]'),
(1, '鑽石會員', 4, 50000.00, 0.85, '#E6E6FA', '["生日優惠","累積積分","85折優惠","優先預約","專屬美容師","節日禮品"]');
