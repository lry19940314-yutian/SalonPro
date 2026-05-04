/**
 * index.ts - 全局公共組件匯出
 *
 * 功能：統一匯出所有公共組件，方便按需引入
 *
 * 技術棧：TypeScript
 */

import type { Component } from 'vue'

export { default as SalonButton } from './SalonButton.vue'
export { default as SalonTable } from './SalonTable.vue'
export { default as SalonDialog } from './SalonDialog.vue'
export { default as SalonSearch } from './SalonSearch.vue'
export { default as SalonPagination } from './SalonPagination.vue'
export { default as SalonStatusTag } from './SalonStatusTag.vue'

/**
 * 全局公共組件列表
 * 用於在 main.ts 中統一註冊
 */
export const globalComponents: Component[] = [
  // 可在此處加入需要全域註冊的組件
]
