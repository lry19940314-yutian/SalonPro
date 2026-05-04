/**
 * menuConfig - 側邊欄菜單配置
 *
 * 定義完整的左側導航菜單結構，與路由配置同步
 * 使用 Element Plus 圖示庫，匹配每個一級菜單的業務屬性
 *
 * 權限控制：
 * - manager（店長/管理員）：可見完整菜單
 * - beautician（美容師）：僅可見部分菜單（資訊中心總覽、預約總覽、場務表、會員）
 *
 * 技術棧：TypeScript + Element Plus Icons
 */

import type { MenuItem } from '@/composables/usePermission'

/**
 * 菜單配置項介面（擴展，支援 Element Plus 圖示組件）
 */
export interface MenuConfigItem extends Omit<MenuItem, 'icon'> {
  /** Element Plus 圖示組件名稱（如 'DataAnalysis'） */
  icon: string
  /** 子菜單 */
  children?: MenuConfigItem[]
}

/**
 * 完整側邊欄菜單配置
 *
 * 菜單結構（100% 匹配需求）：
 * 1. 資訊中心 - 總覽、會員分析、業績分析、預約分析
 * 2. 財務中心 - 營業總覽、消費記錄、薪資、出勤、關帳
 * 3. 記帳 - 帳戶管理、門店月支出、門店日支出、門店收入、支出分類、支出科目、收入分類、收入科目
 * 4. 預約 - 預約總覽、場務表、集客預約設定、Google地圖預約、Instagram預約、定金管理
 * 5. 會員 - 會員、封鎖名單、LINE推播、會員標籤管理、會員問卷
 * 6. 服務及商品 - 分類、服務及商品、銷售總覽、進貨記錄、退貨記錄、盤點記錄
 * 7. 票券管理 - 儲值金、商品券、優惠券(代金券)、點數及贈品
 * 8. 門店管理 - 門店
 * 9. 組織架構 - 工作人員、部門與職位、權限與指派
 * 10. 設定 - 各項設定、自動推播設定、定金設定
 * 11. 集客好物 - 成效分析、結算記錄、設定
 * 12. 集客美券 - 品牌資訊、票券列表、核銷明細
 */
export const menuConfig: MenuConfigItem[] = [
  // ===== 1. 資訊中心 =====
  {
    path: '/info-center',
    name: '資訊中心',
    icon: 'DataAnalysis',
    roles: ['manager', 'beautician'],
    children: [
      {
        path: '/info-center',
        name: '總覽',
        icon: 'DataBoard',
        roles: ['manager', 'beautician'],
      },
      {
        path: '/info-center/member-analysis',
        name: '會員分析',
        icon: 'UserFilled',
        roles: ['manager'],
      },
      {
        path: '/info-center/performance-analysis',
        name: '業績分析',
        icon: 'TrendCharts',
        roles: ['manager'],
      },
      {
        path: '/info-center/appointment-analysis',
        name: '預約分析',
        icon: 'Calendar',
        roles: ['manager'],
      },
    ],
  },

  // ===== 2. 財務中心 =====
  {
    path: '/finance/overview',
    name: '財務中心',
    icon: 'Money',
    roles: ['manager'],
    children: [
      {
        path: '/finance/overview',
        name: '營業總覽',
        icon: 'DataBoard',
        roles: ['manager'],
      },
      {
        path: '/finance/consumption',
        name: '消費記錄',
        icon: 'List',
        roles: ['manager'],
      },
      {
        path: '/finance/salary',
        name: '薪資',
        icon: 'Coin',
        roles: ['manager'],
      },
      {
        path: '/finance/attendance',
        name: '出勤',
        icon: 'Clock',
        roles: ['manager'],
      },
      {
        path: '/finance/close-account',
        name: '關帳',
        icon: 'Lock',
        roles: ['manager'],
      },
    ],
  },

  // ===== 3. 記帳 =====
  {
    path: '/accounting/account-management',
    name: '記帳',
    icon: 'Notebook',
    roles: ['manager'],
    children: [
      {
        path: '/accounting/account-management',
        name: '帳戶管理',
        icon: 'Wallet',
        roles: ['manager'],
      },
      {
        path: '/accounting/monthly-expense',
        name: '門店月支出',
        icon: 'Document',
        roles: ['manager'],
      },
      {
        path: '/accounting/daily-expense',
        name: '門店日支出',
        icon: 'Edit',
        roles: ['manager'],
      },
      {
        path: '/accounting/income',
        name: '門店收入',
        icon: 'TrendCharts',
        roles: ['manager'],
      },
      {
        path: '/accounting/expense-category',
        name: '支出分類',
        icon: 'Folder',
        roles: ['manager'],
      },
      {
        path: '/accounting/expense-subject',
        name: '支出科目',
        icon: 'Files',
        roles: ['manager'],
      },
      {
        path: '/accounting/income-category',
        name: '收入分類',
        icon: 'FolderOpened',
        roles: ['manager'],
      },
      {
        path: '/accounting/income-subject',
        name: '收入科目',
        icon: 'DocumentCopy',
        roles: ['manager'],
      },
    ],
  },

  // ===== 4. 預約 =====
  {
    path: '/appointment/overview',
    name: '預約',
    icon: 'Calendar',
    roles: ['manager', 'beautician'],
    children: [
      {
        path: '/appointment/overview',
        name: '預約總覽',
        icon: 'DataBoard',
        roles: ['manager', 'beautician'],
      },
      {
        path: '/appointment/schedule',
        name: '場務表',
        icon: 'Grid',
        roles: ['manager', 'beautician'],
      },
      {
        path: '/appointment/booking-setting',
        name: '集客預約設定',
        icon: 'Setting',
        roles: ['manager'],
      },
      {
        path: '/appointment/google-map',
        name: 'Google地圖預約',
        icon: 'MapLocation',
        roles: ['manager'],
      },
      {
        path: '/appointment/instagram',
        name: 'Instagram預約',
        icon: 'Camera',
        roles: ['manager'],
      },
      {
        path: '/appointment/deposit',
        name: '定金管理',
        icon: 'Coin',
        roles: ['manager'],
      },
    ],
  },

  // ===== 5. 會員 =====
  {
    path: '/members',
    name: '會員',
    icon: 'User',
    roles: ['manager', 'beautician'],
    children: [
      {
        path: '/members',
        name: '會員',
        icon: 'UserFilled',
        roles: ['manager', 'beautician'],
      },
      {
        path: '/members/blocked',
        name: '封鎖名單',
        icon: 'RemoveFilled',
        roles: ['manager'],
      },
      {
        path: '/members/line-push',
        name: 'LINE推播',
        icon: 'ChatLineSquare',
        roles: ['manager'],
      },
      {
        path: '/members/tags',
        name: '會員標籤管理',
        icon: 'CollectionTag',
        roles: ['manager'],
      },
      {
        path: '/members/questionnaire',
        name: '會員問卷',
        icon: 'DocumentChecked',
        roles: ['manager'],
      },
    ],
  },

  // ===== 6. 服務及商品 =====
  {
    path: '/service/category',
    name: '服務及商品',
    icon: 'Goods',
    roles: ['manager'],
    children: [
      {
        path: '/service/category',
        name: '分類',
        icon: 'Folder',
        roles: ['manager'],
      },
      {
        path: '/service/items',
        name: '服務及商品',
        icon: 'GoodsFilled',
        roles: ['manager'],
      },
      {
        path: '/service/sales',
        name: '銷售總覽',
        icon: 'DataBoard',
        roles: ['manager'],
      },
      {
        path: '/service/purchasing',
        name: '進貨記錄',
        icon: 'Download',
        roles: ['manager'],
      },
      {
        path: '/service/returns',
        name: '退貨記錄',
        icon: 'Refresh',
        roles: ['manager'],
      },
      {
        path: '/service/inventory-check',
        name: '盤點記錄',
        icon: 'List',
        roles: ['manager'],
      },
    ],
  },

  // ===== 7. 票券管理 =====
  {
    path: '/ticket/top-up',
    name: '票券管理',
    icon: 'Ticket',
    roles: ['manager'],
    children: [
      {
        path: '/ticket/top-up',
        name: '儲值金',
        icon: 'CreditCard',
        roles: ['manager'],
      },
      {
        path: '/ticket/product-voucher',
        name: '商品券',
        icon: 'Ticket',
        roles: ['manager'],
      },
      {
        path: '/ticket/coupon',
        name: '優惠券(代金券)',
        icon: 'Discount',
        roles: ['manager'],
      },
      {
        path: '/ticket/points-gift',
        name: '點數及贈品',
        icon: 'Present',
        roles: ['manager'],
      },
    ],
  },

  // ===== 8. 門店管理 =====
  {
    path: '/shop',
    name: '門店管理',
    icon: 'Shop',
    roles: ['manager'],
    children: [
      {
        path: '/shop',
        name: '門店',
        icon: 'Shop',
        roles: ['manager'],
      },
    ],
  },

  // ===== 9. 組織架構 =====
  {
    path: '/org/staff',
    name: '組織架構',
    icon: 'OfficeBuilding',
    roles: ['manager'],
    children: [
      {
        path: '/org/staff',
        name: '工作人員',
        icon: 'UserFilled',
        roles: ['manager'],
      },
      {
        path: '/org/department',
        name: '部門與職位',
        icon: 'Collection',
        roles: ['manager'],
      },
      {
        path: '/org/permission',
        name: '權限與指派',
        icon: 'Key',
        roles: ['manager'],
      },
    ],
  },

  // ===== 10. 設定 =====
  {
    path: '/settings',
    name: '設定',
    icon: 'Setting',
    roles: ['manager'],
    children: [
      {
        path: '/settings',
        name: '各項設定',
        icon: 'Setting',
        roles: ['manager'],
      },
      {
        path: '/settings/auto-push',
        name: '自動推播設定',
        icon: 'Bell',
        roles: ['manager'],
      },
      {
        path: '/settings/deposit',
        name: '定金設定',
        icon: 'Coin',
        roles: ['manager'],
      },
    ],
  },

  // ===== 11. 集客好物 =====
  {
    path: '/marketing/analysis',
    name: '集客好物',
    icon: 'TrendCharts',
    roles: ['manager'],
    children: [
      {
        path: '/marketing/analysis',
        name: '成效分析',
        icon: 'DataAnalysis',
        roles: ['manager'],
      },
      {
        path: '/marketing/settlement',
        name: '結算記錄',
        icon: 'Document',
        roles: ['manager'],
      },
      {
        path: '/marketing/settings',
        name: '設定',
        icon: 'Setting',
        roles: ['manager'],
      },
    ],
  },

  // ===== 12. 集客美券 =====
  {
    path: '/coupon-brand/info',
    name: '集客美券',
    icon: 'Discount',
    roles: ['manager'],
    children: [
      {
        path: '/coupon-brand/info',
        name: '品牌資訊',
        icon: 'InfoFilled',
        roles: ['manager'],
      },
      {
        path: '/coupon-brand/list',
        name: '票券列表',
        icon: 'List',
        roles: ['manager'],
      },
      {
        path: '/coupon-brand/verification',
        name: '核銷明細',
        icon: 'Finished',
        roles: ['manager'],
      },
    ],
  },
]

/**
 * 根據路徑獲取預設展開的菜單（父級路徑）
 * 用於 el-menu 的 default-openeds 屬性
 *
 * @param path - 當前路由路徑
 * @returns 父級菜單路徑陣列
 */
export function getDefaultOpeneds(path: string): string[] {
  const openeds: string[] = []

  for (const group of menuConfig) {
    if (group.children) {
      for (const child of group.children) {
        if (path.startsWith(child.path) || path.startsWith(group.path)) {
          openeds.push(group.path)
          break
        }
      }
    }
  }

  return openeds
}
