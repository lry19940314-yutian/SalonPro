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
 * - icon 字段對應 Material Symbols 圖示名稱
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
 * | `/dashboard` | 首頁儀表板（今日行程摘要 + 業績概況） | 美容師/店長 | 全部 | 顯示 |
 * | `/schedule` | 場務表（月/週/日視圖） | 美容師/店長 | 全部 | 顯示 |
 * | `/schedule/:id` | 預約詳情/編輯 | 美容師/店長 | 全部 | 隱藏 |
 * | `/members` | 會員列表 | 美容師/店長 | 全部 | 顯示 |
 * | `/members/:id` | 會員 360 視圖 | 美容師/店長 | 全部 | 隱藏 |
 * | `/performance` | 業績看板 | 美容師/店長 | 全部 | 顯示 |
 * | `/performance/detail` | 佣金明細 | 美容師 | 全部 | 隱藏 |
 * | `/portfolio` | 作品集管理 | 美容師 | 全部 | 顯示 |
 * | `/inventory` | 庫存管理 | 店長 | 全部 | 顯示 |
 * | `/inventory/pick` | 領料申請 | 美容師 | 手機 | 隱藏 |
 * | `/settings` | 個人設置 | 美容師/店長 | 全部 | 顯示 |
 * | `/admin` | 管理後台（父路由） | 店長 | PC | 顯示 |
 * | `/admin/dashboard` | 管理儀表板 | 店長 | PC | 顯示 |
 * | `/admin/staff` | 員工管理 | 店長 | PC | 顯示 |
 * | `/admin/services` | 服務項目管理 | 店長 | PC | 顯示 |
 * | `/admin/shop` | 門店設置 | 店長 | PC | 顯示 |
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
      // ===== 資訊中心總覽（首頁）=====
      // 角色：美容師、店長均可訪問
      // 終端：PC / 移動端均支援
      {
        path: 'info-center',
        name: 'InfoCenter',
        meta: {
          title: '資訊中心總覽',
          requiresAuth: true,
          roles: ['manager', 'beautician'],
          icon: 'dashboard',
          keepAlive: true, // 首頁建議緩存
        },
        component: () => import('@/views/info-center/InfoCenterView.vue'),
      },

      // ===== 儀表板（保留向後相容）=====
      // 角色：美容師、店長均可訪問
      // 終端：PC / 移動端均支援
      {
        path: 'dashboard',
        name: 'Dashboard',
        meta: {
          title: '首頁儀表板',
          requiresAuth: true,
          roles: ['manager', 'beautician'],
          icon: 'dashboard',
          keepAlive: true,
        },
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },

      // ===== 場務表（月/週/日視圖）=====
      // 角色：美容師、店長均可訪問
      // 終端：PC / 移動端均支援
      {
        path: 'schedule',
        name: 'Schedule',
        meta: {
          title: '場務表',
          requiresAuth: true,
          roles: ['manager', 'beautician'],
          icon: 'calendar_today',
          keepAlive: true,
        },
        component: () => import('@/views/schedule/ScheduleView.vue'),
      },

      // ===== 預約詳情/編輯 =====
      // 角色：美容師、店長均可訪問
      // 終端：PC / 移動端均支援
      // 菜單：隱藏（從場務表點擊進入）
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

      // ===== 會員列表 =====
      // 角色：美容師、店長均可訪問
      // 終端：PC / 移動端均支援
      {
        path: 'members',
        name: 'MemberList',
        meta: {
          title: '會員列表',
          requiresAuth: true,
          roles: ['manager', 'beautician'],
          icon: 'group',
          keepAlive: true,
        },
        component: () => import('@/views/member/MemberList.vue'),
      },

      // ===== 會員 360 視圖 =====
      // 角色：美容師、店長均可訪問
      // 終端：PC / 移動端均支援
      // 菜單：隱藏（從會員列表點擊進入）
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

      // ===== 業績看板 =====
      // 角色：美容師、店長均可訪問
      // 終端：PC / 移動端均支援
      {
        path: 'performance',
        name: 'Performance',
        meta: {
          title: '業績看板',
          requiresAuth: true,
          roles: ['manager', 'beautician'],
          icon: 'bar_chart',
          keepAlive: true,
        },
        component: () => import('@/views/performance/PerformanceView.vue'),
      },

      // ===== 佣金明細（美容師專屬）=====
      // 角色：僅美容師可訪問
      // 終端：PC / 移動端均支援
      // 菜單：隱藏（從業績看板點擊進入）
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

      // ===== 作品集管理（美容師專屬）=====
      // 角色：僅美容師可訪問
      // 終端：PC / 移動端均支援
      {
        path: 'portfolio',
        name: 'Portfolio',
        meta: {
          title: '作品集管理',
          requiresAuth: true,
          roles: ['beautician'],
          icon: 'photo_library',
          keepAlive: true,
        },
        component: () => import('@/views/portfolio/PortfolioView.vue'),
      },

      // ===== 庫存管理（店長專屬）=====
      // 角色：僅店長可訪問
      // 終端：PC / 移動端均支援（平板使用 PC 響應式）
      {
        path: 'inventory',
        name: 'Inventory',
        meta: {
          title: '庫存管理',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'inventory_2',
          keepAlive: true,
        },
        component: () => import('@/views/inventory/InventoryView.vue'),
      },

      // ===== 領料申請（美容師專屬，手機端優先）=====
      // 角色：僅美容師可訪問
      // 終端：僅移動端（PC 端使用 PC 組件降級）
      // 菜單：隱藏（從庫存管理或首頁進入）
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
        // 移動端專用組件
        mobileComponent: () => import('@/views/inventory/PickOrderView.vue'),
      },

      // ===== 個人設置 =====
      // 角色：美容師、店長均可訪問
      // 終端：PC / 移動端均支援
      {
        path: 'settings',
        name: 'Settings',
        meta: {
          title: '個人設置',
          requiresAuth: true,
          roles: ['manager', 'beautician'],
          icon: 'settings',
          keepAlive: true,
        },
        component: () => import('@/views/settings/ProfileView.vue'),
      },

      // ===== 管理後台（店長專屬，PC 優先）=====
      // 角色：僅店長可訪問
      // 終端：PC 端（含平板響應式），移動端不顯示管理後台菜單
      {
        path: 'admin',
        name: 'Admin',
        meta: {
          title: '管理後台',
          requiresAuth: true,
          roles: ['manager'],
          icon: 'admin_panel_settings',
          keepAlive: false,
        },
        redirect: 'admin/dashboard',
        children: [
          {
            path: 'dashboard',
            name: 'AdminDashboard',
            meta: {
              title: '管理儀表板',
              requiresAuth: true,
              roles: ['manager'],
              icon: 'dashboard',
              keepAlive: true,
            },
            component: () => import('@/views/admin/AdminDashboard.vue'),
          },
          {
            path: 'staff',
            name: 'StaffManagement',
            meta: {
              title: '員工管理',
              requiresAuth: true,
              roles: ['manager'],
              icon: 'badge',
              keepAlive: true,
            },
            component: () => import('@/views/admin/StaffManagement.vue'),
          },
          {
            path: 'services',
            name: 'ServiceManagement',
            meta: {
              title: '服務項目管理',
              requiresAuth: true,
              roles: ['manager'],
              icon: 'content_cut',
              keepAlive: true,
            },
            component: () => import('@/views/admin/ServiceManagement.vue'),
          },
          {
            path: 'shop',
            name: 'ShopSettings',
            meta: {
              title: '門店設置',
              requiresAuth: true,
              roles: ['manager'],
              icon: 'store',
              keepAlive: true,
            },
            component: () => import('@/views/admin/ShopSettings.vue'),
          },
        ],
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
