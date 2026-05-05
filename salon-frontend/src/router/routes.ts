/**
 * routes - 完整路由表配置
 *
 * 依據《項目架構設計》2.3 前端路由設計章節
 * 嚴格對應所有路由路徑、頁面、權限
 *
 * 權限規則：
 * - manager（店長/管理員）：可訪問全部路由
 * - beautician（美容師）：僅可訪問個人業務路由，禁止訪問 /admin/* 後台路由
 *
 * 組件加載規則：
 * - component：PC 端組件（螢幕 ≥768px 加載）
 * - mobileComponent：手機端組件（螢幕 ＜768px 加載），可選
 * - 平板設備（768px ~ 1024px）自動加載 PC 組件，透過響應式樣式適配
 *
 * 佈局規則：
 * - /login 使用獨立佈局（無側邊欄/底部導航）
 * - 其他路由使用對應端佈局（PC 左側菜單 / 移動端底部導航）
 *
 * 菜單對接：
 * - icon 字段對應 Element Plus 圖示名稱
 * - hidden: true 表示不在側邊欄/底部導航顯示（如詳情頁、編輯頁）
 * - roles 字段控制菜單可見性與訪問權限
 *
 * 技術棧：Vue Router 4 + 懶加載
 */

import type { AdaptiveRouteConfig } from './adaptive'

/**
 * 路由表配置
 *
 * | 路由路徑 | 頁面 | 權限 | 端 | 菜單顯示 |
 * |---------|------|------|-----|---------|
 * | `/login` | 登錄頁 | 公開 | 全部 | 隱藏 |
 * | `/` | 首頁重定向 | 需登入 | 全部 | 隱藏 |
 * | `/info-center` | 資訊中心總覽 | 店長/美容師 | 全部 | 顯示 |
 * | `/info-center/member-analysis` | 會員分析 | 店長 | PC | 顯示 |
 * | `/info-center/performance-analysis` | 業績分析 | 店長 | PC | 顯示 |
 * | `/info-center/appointment-analysis` | 預約分析 | 店長 | PC | 顯示 |
 * | `/finance/overview` | 營業總覽 | 店長 | PC | 顯示 |
 * | `/finance/consumption` | 消費記錄 | 店長 | PC | 顯示 |
 * | `/finance/salary` | 薪資 | 店長 | PC | 顯示 |
 * | `/finance/attendance` | 出勤 | 店長 | PC | 顯示 |
 * | `/finance/close-account` | 關帳 | 店長 | PC | 顯示 |
 * | `/accounting/account-management` | 帳戶管理 | 店長 | PC | 顯示 |
 * | `/accounting/monthly-expense` | 門店月支出 | 店長 | PC | 顯示 |
 * | `/accounting/daily-expense` | 門店日支出 | 店長 | PC | 顯示 |
 * | `/accounting/income` | 門店收入 | 店長 | PC | 顯示 |
 * | `/accounting/expense-category` | 支出分類 | 店長 | PC | 顯示 |
 * | `/accounting/expense-subject` | 支出科目 | 店長 | PC | 顯示 |
 * | `/accounting/income-category` | 收入分類 | 店長 | PC | 顯示 |
 * | `/accounting/income-subject` | 收入科目 | 店長 | PC | 顯示 |
 * | `/appointment/overview` | 預約總覽 | 店長/美容師 | 全部 | 顯示 |
 * | `/appointment/schedule` | 場務表 | 店長/美容師 | 全部 | 顯示 |
 * | `/appointment/booking-setting` | 集客預約設定 | 店長 | PC | 顯示 |
 * | `/appointment/google-map` | Google地圖預約 | 店長 | PC | 顯示 |
 * | `/appointment/instagram` | Instagram預約 | 店長 | PC | 顯示 |
 * | `/appointment/deposit` | 定金管理 | 店長 | PC | 顯示 |
 * | `/members` | 會員列表 | 店長/美容師 | 全部 | 顯示 |
 * | `/members/blocked` | 封鎖名單 | 店長 | PC | 顯示 |
 * | `/members/line-push` | LINE推播 | 店長 | PC | 顯示 |
 * | `/members/tags` | 會員標籤管理 | 店長 | PC | 顯示 |
 * | `/members/questionnaire` | 會員問卷 | 店長 | PC | 顯示 |
 * | `/service/category` | 分類 | 店長 | PC | 顯示 |
 * | `/service/items` | 服務及商品 | 店長 | PC | 顯示 |
 * | `/service/sales` | 銷售總覽 | 店長 | PC | 顯示 |
 * | `/service/purchasing` | 進貨記錄 | 店長 | PC | 顯示 |
 * | `/service/returns` | 退貨記錄 | 店長 | PC | 顯示 |
 * | `/service/inventory-check` | 盤點記錄 | 店長 | PC | 顯示 |
 * | `/ticket/top-up` | 儲值金 | 店長 | PC | 顯示 |
 * | `/ticket/product-voucher` | 商品券 | 店長 | PC | 顯示 |
 * | `/ticket/coupon` | 優惠券(代金券) | 店長 | PC | 顯示 |
 * | `/ticket/points-gift` | 點數及贈品 | 店長 | PC | 顯示 |
 * | `/shop` | 門店管理 | 店長 | PC | 顯示 |
 * | `/org/staff` | 工作人員 | 店長 | PC | 顯示 |
 * | `/org/department` | 部門與職位 | 店長 | PC | 顯示 |
 * | `/org/permission` | 權限與指派 | 店長 | PC | 顯示 |
 * | `/settings` | 各項設定 | 店長 | PC | 顯示 |
 * | `/settings/auto-push` | 自動推播設定 | 店長 | PC | 顯示 |
 * | `/settings/deposit` | 定金設定 | 店長 | PC | 顯示 |
 * | `/marketing/analysis` | 成效分析 | 店長 | PC | 顯示 |
 * | `/marketing/settlement` | 結算記錄 | 店長 | PC | 顯示 |
 * | `/marketing/settings` | 設定 | 店長 | PC | 顯示 |
 * | `/coupon-brand/info` | 品牌資訊 | 店長 | PC | 顯示 |
 * | `/coupon-brand/list` | 票券列表 | 店長 | PC | 顯示 |
 * | `/coupon-brand/verification` | 核銷明細 | 店長 | PC | 顯示 |
 * | `/403` | 無權限頁面 | 公開 | 全部 | 隱藏 |
 * | `/:pathMatch(.*)*` | 404 頁面 | 公開 | 全部 | 隱藏 |
 */
const routes: AdaptiveRouteConfig[] = [
  // ==================== 公開路由（獨立佈局，無側邊欄/底部導航）====================

  {
    path: '/login',
    name: 'Login',
    meta: {
      title: '登錄',
      requiresAuth: false,
      roles: [], // 公開路由，無需登入
      hidden: true, // 側邊欄/底部導航隱藏
      keepAlive: false, // 登入頁不緩存
    },
    component: () => import('@/views/login/LoginView.vue'),
  },

  // ==================== 需登入路由（含 PC / 移動端佈局）====================

  {
    path: '/',
    name: 'Root',
    redirect: '/info-center',
    meta: {
      title: '首頁',
      requiresAuth: true,
      hidden: true,
      keepAlive: false,
    },
    // PC 端使用 PCLayout（左側菜單），移動端使用 MobileLayout（底部導航）
    component: () => import('@/layouts/PCLayout.vue'),
    mobileComponent: () => import('@/layouts/MobileLayout.vue'),
    children: [
      // ===== 資訊中心 =====
      // 角色：店長、美容師均可訪問（總覽），子頁面僅店長
      // 終端：PC / 移動端均支援
      {
        path: 'info-center',
        name: 'InfoCenter',
        meta: {
          title: '總覽',
          requiresAuth: true,
          roles: ['manager', 'beautician'],
          icon: 'DataAnalysis',
          keepAlive: true,
        },
        component: () => import('@/views/info-center/InfoCenterView.vue'),
        mobileComponent: () => import('@/views/info-center/InformationIndex.vue'),
      },
      {
        path: 'info-center/member-analysis',
        name: 'MemberAnalysis',
        meta: {
          title: '會員分析',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'UserFilled',
          keepAlive: true,
        },
        component: () => import('@/views/info-center/MemberAnalysisView.vue'),
        mobileComponent: () => import('@/views/info-center/MemberAnalysisMobile.vue'),
      },
      {
        path: 'info-center/performance-analysis',
        name: 'PerformanceAnalysis',
        meta: {
          title: '業績分析',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'TrendCharts',
          keepAlive: true,
        },
        component: () => import('@/views/performance/PerformanceView.vue'),
      },
      {
        path: 'info-center/appointment-analysis',
        name: 'AppointmentAnalysis',
        meta: {
          title: '預約分析',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Calendar',
          keepAlive: true,
        },
        component: () => import('@/views/schedule/ScheduleView.vue'),
      },

      // ===== 財務中心 =====
      // 角色：僅店長可訪問
      // 終端：PC 端（含平板響應式）
      {
        path: 'finance/overview',
        name: 'FinanceOverview',
        meta: {
          title: '營業總覽',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Money',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'finance/consumption',
        name: 'FinanceConsumption',
        meta: {
          title: '消費記錄',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'List',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'finance/salary',
        name: 'FinanceSalary',
        meta: {
          title: '薪資',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Coin',
          keepAlive: true,
        },
        component: () => import('@/views/performance/PerformanceView.vue'),
      },
      {
        path: 'finance/attendance',
        name: 'FinanceAttendance',
        meta: {
          title: '出勤',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Clock',
          keepAlive: true,
        },
        component: () => import('@/views/schedule/ScheduleView.vue'),
      },
      {
        path: 'finance/close-account',
        name: 'FinanceCloseAccount',
        meta: {
          title: '關帳',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Lock',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },

      // ===== 記帳 =====
      // 角色：僅店長可訪問
      // 終端：PC 端（含平板響應式）
      {
        path: 'accounting/account-management',
        name: 'AccountManagement',
        meta: {
          title: '帳戶管理',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Wallet',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'accounting/monthly-expense',
        name: 'MonthlyExpense',
        meta: {
          title: '門店月支出',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Document',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'accounting/daily-expense',
        name: 'DailyExpense',
        meta: {
          title: '門店日支出',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Edit',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'accounting/income',
        name: 'AccountingIncome',
        meta: {
          title: '門店收入',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'TrendCharts',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'accounting/expense-category',
        name: 'ExpenseCategory',
        meta: {
          title: '支出分類',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Folder',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'accounting/expense-subject',
        name: 'ExpenseSubject',
        meta: {
          title: '支出科目',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Files',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'accounting/income-category',
        name: 'IncomeCategory',
        meta: {
          title: '收入分類',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'FolderOpened',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'accounting/income-subject',
        name: 'IncomeSubject',
        meta: {
          title: '收入科目',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'DocumentCopy',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },

      // ===== 預約 =====
      // 角色：預約總覽、場務表（店長/美容師），其餘僅店長
      // 終端：PC / 移動端均支援
      {
        path: 'appointment/overview',
        name: 'AppointmentOverview',
        meta: {
          title: '預約總覽',
          requiresAuth: true,
          roles: ['manager', 'beautician'],
          icon: 'Calendar',
          keepAlive: true,
        },
        component: () => import('@/views/appointment/AppointmentDetail.vue'),
      },
      {
        path: 'appointment/schedule',
        name: 'AppointmentSchedule',
        meta: {
          title: '場務表',
          requiresAuth: true,
          roles: ['manager', 'beautician'],
          icon: 'Grid',
          keepAlive: true,
        },
        component: () => import('@/views/schedule/ScheduleView.vue'),
      },
      {
        path: 'appointment/booking-setting',
        name: 'BookingSetting',
        meta: {
          title: '集客預約設定',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Setting',
          keepAlive: true,
        },
        component: () => import('@/views/settings/ProfileView.vue'),
      },
      {
        path: 'appointment/google-map',
        name: 'GoogleMapBooking',
        meta: {
          title: 'Google地圖預約',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'MapLocation',
          keepAlive: true,
        },
        component: () => import('@/views/settings/ProfileView.vue'),
      },
      {
        path: 'appointment/instagram',
        name: 'InstagramBooking',
        meta: {
          title: 'Instagram預約',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Camera',
          keepAlive: true,
        },
        component: () => import('@/views/settings/ProfileView.vue'),
      },
      {
        path: 'appointment/deposit',
        name: 'DepositManagement',
        meta: {
          title: '定金管理',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Coin',
          keepAlive: true,
        },
        component: () => import('@/views/settings/ProfileView.vue'),
      },

      // ===== 會員 =====
      // 角色：會員列表（店長/美容師），其餘僅店長
      // 終端：PC / 移動端均支援
      {
        path: 'members',
        name: 'MemberList',
        meta: {
          title: '會員',
          requiresAuth: true,
          roles: ['manager', 'beautician'],
          icon: 'User',
          keepAlive: true,
        },
        component: () => import('@/views/member/MemberList.vue'),
      },
      {
        path: 'members/blocked',
        name: 'BlockedList',
        meta: {
          title: '封鎖名單',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'RemoveFilled',
          keepAlive: true,
        },
        component: () => import('@/views/member/MemberList.vue'),
      },
      {
        path: 'members/line-push',
        name: 'LinePush',
        meta: {
          title: 'LINE推播',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'ChatLineSquare',
          keepAlive: true,
        },
        component: () => import('@/views/member/MemberList.vue'),
      },
      {
        path: 'members/tags',
        name: 'MemberTags',
        meta: {
          title: '會員標籤管理',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'CollectionTag',
          keepAlive: true,
        },
        component: () => import('@/views/member/MemberList.vue'),
      },
      {
        path: 'members/questionnaire',
        name: 'MemberQuestionnaire',
        meta: {
          title: '會員問卷',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'DocumentChecked',
          keepAlive: true,
        },
        component: () => import('@/views/member/MemberList.vue'),
      },

      // ===== 服務及商品 =====
      // 角色：僅店長可訪問
      // 終端：PC 端（含平板響應式）
      {
        path: 'service/category',
        name: 'ServiceCategory',
        meta: {
          title: '分類',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Folder',
          keepAlive: true,
        },
        component: () => import('@/views/admin/ServiceManagement.vue'),
      },
      {
        path: 'service/items',
        name: 'ServiceItems',
        meta: {
          title: '服務及商品',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Goods',
          keepAlive: true,
        },
        component: () => import('@/views/admin/ServiceManagement.vue'),
      },
      {
        path: 'service/sales',
        name: 'ServiceSales',
        meta: {
          title: '銷售總覽',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'DataBoard',
          keepAlive: true,
        },
        component: () => import('@/views/admin/ServiceManagement.vue'),
      },
      {
        path: 'service/purchasing',
        name: 'ServicePurchasing',
        meta: {
          title: '進貨記錄',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Download',
          keepAlive: true,
        },
        component: () => import('@/views/inventory/InventoryView.vue'),
      },
      {
        path: 'service/returns',
        name: 'ServiceReturns',
        meta: {
          title: '退貨記錄',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Refresh',
          keepAlive: true,
        },
        component: () => import('@/views/inventory/InventoryView.vue'),
      },
      {
        path: 'service/inventory-check',
        name: 'InventoryCheck',
        meta: {
          title: '盤點記錄',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'List',
          keepAlive: true,
        },
        component: () => import('@/views/inventory/InventoryView.vue'),
      },

      // ===== 票券管理 =====
      // 角色：僅店長可訪問
      // 終端：PC 端（含平板響應式）
      {
        path: 'ticket/top-up',
        name: 'TicketTopUp',
        meta: {
          title: '儲值金',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'CreditCard',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'ticket/product-voucher',
        name: 'ProductVoucher',
        meta: {
          title: '商品券',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Ticket',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'ticket/coupon',
        name: 'TicketCoupon',
        meta: {
          title: '優惠券(代金券)',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Discount',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'ticket/points-gift',
        name: 'PointsGift',
        meta: {
          title: '點數及贈品',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Present',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },

      // ===== 門店管理 =====
      // 角色：僅店長可訪問
      // 終端：PC 端（含平板響應式）
      {
        path: 'shop',
        name: 'ShopManagement',
        meta: {
          title: '門店',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Shop',
          keepAlive: true,
        },
        component: () => import('@/views/admin/ShopSettings.vue'),
      },

      // ===== 組織架構 =====
      // 角色：僅店長可訪問
      // 終端：PC 端（含平板響應式）
      {
        path: 'org/staff',
        name: 'OrgStaff',
        meta: {
          title: '工作人員',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'UserFilled',
          keepAlive: true,
        },
        component: () => import('@/views/admin/StaffManagement.vue'),
      },
      {
        path: 'org/department',
        name: 'OrgDepartment',
        meta: {
          title: '部門與職位',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'OfficeBuilding',
          keepAlive: true,
        },
        component: () => import('@/views/admin/StaffManagement.vue'),
      },
      {
        path: 'org/permission',
        name: 'OrgPermission',
        meta: {
          title: '權限與指派',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Key',
          keepAlive: true,
        },
        component: () => import('@/views/admin/StaffManagement.vue'),
      },

      // ===== 設定 =====
      // 角色：僅店長可訪問
      // 終端：PC 端（含平板響應式）
      {
        path: 'settings',
        name: 'Settings',
        meta: {
          title: '各項設定',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Setting',
          keepAlive: true,
        },
        component: () => import('@/views/settings/ProfileView.vue'),
      },
      {
        path: 'settings/auto-push',
        name: 'AutoPushSetting',
        meta: {
          title: '自動推播設定',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Bell',
          keepAlive: true,
        },
        component: () => import('@/views/settings/ProfileView.vue'),
      },
      {
        path: 'settings/deposit',
        name: 'DepositSetting',
        meta: {
          title: '定金設定',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Coin',
          keepAlive: true,
        },
        component: () => import('@/views/settings/ProfileView.vue'),
      },

      // ===== 集客好物 =====
      // 角色：僅店長可訪問
      // 終端：PC 端（含平板響應式）
      {
        path: 'marketing/analysis',
        name: 'MarketingAnalysis',
        meta: {
          title: '成效分析',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'DataAnalysis',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'marketing/settlement',
        name: 'MarketingSettlement',
        meta: {
          title: '結算記錄',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Document',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'marketing/settings',
        name: 'MarketingSettings',
        meta: {
          title: '設定',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Setting',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },

      // ===== 集客美券 =====
      // 角色：僅店長可訪問
      // 終端：PC 端（含平板響應式）
      {
        path: 'coupon-brand/info',
        name: 'CouponBrandInfo',
        meta: {
          title: '品牌資訊',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'InfoFilled',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'coupon-brand/list',
        name: 'CouponBrandList',
        meta: {
          title: '票券列表',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'List',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'coupon-brand/verification',
        name: 'CouponBrandVerification',
        meta: {
          title: '核銷明細',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Finished',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },

      // ===== 保留向後相容路由 =====

      // 儀表板（保留向後相容）
      {
        path: 'dashboard',
        name: 'Dashboard',
        meta: {
          title: '首頁儀表板',
          requiresAuth: true,
          roles: ['manager', 'beautician'],
          icon: 'DataAnalysis',
          keepAlive: true,
          hidden: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },

      // 場務表（保留向後相容）
      {
        path: 'schedule',
        name: 'Schedule',
        meta: {
          title: '場務表',
          requiresAuth: true,
          roles: ['manager', 'beautician'],
          icon: 'Calendar',
          keepAlive: true,
          hidden: true,
        },
        component: () => import('@/views/schedule/ScheduleView.vue'),
      },

      // 預約詳情/編輯
      {
        path: 'schedule/:id',
        name: 'ScheduleDetail',
        meta: {
          title: '預約詳情',
          requiresAuth: true,
          roles: ['manager', 'beautician'],
          hidden: true,
          keepAlive: false,
        },
        component: () => import('@/views/appointment/AppointmentDetail.vue'),
      },

      // 會員 360 視圖
      {
        path: 'members/:id',
        name: 'MemberDetail',
        meta: {
          title: '會員 360 視圖',
          requiresAuth: true,
          roles: ['manager', 'beautician'],
          hidden: true,
          keepAlive: false,
        },
        component: () => import('@/views/member/MemberDetail.vue'),
      },

      // 業績看板（保留向後相容）
      {
        path: 'performance',
        name: 'Performance',
        meta: {
          title: '業績看板',
          requiresAuth: true,
          roles: ['manager', 'beautician'],
          icon: 'TrendCharts',
          keepAlive: true,
          hidden: true,
        },
        component: () => import('@/views/performance/PerformanceView.vue'),
      },

      // 佣金明細（美容師專屬）
      {
        path: 'performance/detail',
        name: 'CommissionDetail',
        meta: {
          title: '佣金明細',
          requiresAuth: true,
          roles: ['beautician'],
          hidden: true,
          keepAlive: false,
        },
        component: () => import('@/views/performance/CommissionDetail.vue'),
      },

      // 作品集管理（美容師專屬）
      {
        path: 'portfolio',
        name: 'Portfolio',
        meta: {
          title: '作品集管理',
          requiresAuth: true,
          roles: ['beautician'],
          icon: 'Picture',
          keepAlive: true,
          hidden: true,
        },
        component: () => import('@/views/portfolio/PortfolioView.vue'),
      },

      // 庫存管理（保留向後相容）
      {
        path: 'inventory',
        name: 'Inventory',
        meta: {
          title: '庫存管理',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'Box',
          keepAlive: true,
          hidden: true,
        },
        component: () => import('@/views/inventory/InventoryView.vue'),
      },

      // 領料申請（美容師專屬）
      {
        path: 'inventory/pick',
        name: 'PickOrder',
        meta: {
          title: '領料申請',
          requiresAuth: true,
          roles: ['beautician'],
          hidden: true,
          keepAlive: false,
        },
        mobileComponent: () => import('@/views/inventory/PickOrderView.vue'),
      },

      // 個人設置（保留向後相容）
      {
        path: 'settings/profile',
        name: 'SettingsProfile',
        meta: {
          title: '個人設置',
          requiresAuth: true,
          roles: ['manager', 'beautician'],
          icon: 'Setting',
          keepAlive: true,
          hidden: true,
        },
        component: () => import('@/views/settings/ProfileView.vue'),
      },
    ],
  },

  // ==================== 403 無權限頁面（公開）====================

  {
    path: '/403',
    name: 'Forbidden',
    meta: {
      title: '403 - 無權限訪問',
      requiresAuth: false,
      hidden: true,
      keepAlive: false,
    },
    component: () => import('@/views/error/ForbiddenView.vue'),
  },

  // ==================== 404 頁面（公開，萬用路由）====================

  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    meta: {
      title: '404 - 頁面不存在',
      requiresAuth: false,
      hidden: true,
      keepAlive: false,
    },
    component: () => import('@/views/error/NotFoundView.vue'),
  },
]

export default routes
