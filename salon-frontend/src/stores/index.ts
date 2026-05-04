/**
 * index - Pinia 狀態管理實例
 *
 * 功能：
 * 1. 建立 Pinia 實例
 * 2. 註冊所有 Store
 *
 * 技術棧：Pinia + Vue 3
 */

import { createPinia } from 'pinia'

/** Pinia 實例 */
const pinia = createPinia()

export default pinia

export { useAuthStore } from './auth'
