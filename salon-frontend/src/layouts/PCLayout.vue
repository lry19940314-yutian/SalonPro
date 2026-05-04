<!--
  PCLayout.vue - PC 端全局佈局（左側菜單 + 頂部導航 + 內容區）

  功能：
  1. 左側固定側邊欄（Logo + 導航菜單）
  2. 頂部導航欄（使用者資訊 + 通知 + 登出）
  3. 右側內容區（路由視圖）
  4. 側邊欄折疊功能（懸停展開）
  5. 根據角色動態顯示菜單（使用 usePermission.filterMenus）
  6. 平板響應式適配（768px ~ 1024px 自動調整佈局）

  設計規範：
  - 側邊欄寬度：240px（折疊後 64px）
  - 頂部導航高度：60px
  - 內容區背景：#f5f3f3
  - 平板適配：768px ~ 1024px 時側邊欄自動折疊

  技術棧：Vue 3 Composition API + SCSS
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermission } from '@/composables/usePermission'
import { BREAKPOINTS } from '@/composables/useDevice'
import type { MenuItem } from '@/composables/usePermission'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { isManager, filterMenus } = usePermission()

// ==================== 狀態 ====================

/** 側邊欄是否折疊 */
const sidebarCollapsed = ref(false)

/** 側邊欄是否懸停展開 */
const sidebarHovered = ref(false)

/** 使用者選單是否顯示 */
const userMenuVisible = ref(false)

/** 當前視窗寬度（用於平板響應式） */
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

// ==================== 計算屬性 ====================

/** 是否為平板設備（768px ~ 1024px） */
const isTablet = computed(() => {
  return windowWidth.value >= BREAKPOINTS.DESKTOP_MIN && windowWidth.value <= 1024
})

/** 側邊欄實際折疊狀態（考慮懸停和平板） */
const isCollapsed = computed(() => {
  // 平板設備自動折疊側邊欄
  if (isTablet.value) return true
  return sidebarCollapsed.value && !sidebarHovered.value
})

/** 側邊欄寬度 */
const sidebarWidth = computed(() => {
  return isCollapsed.value ? '64px' : '240px'
})

/** 主菜單列表（根據角色過濾） */
const menuItems = computed<MenuItem[]>(() => {
  const items: MenuItem[] = [
    {
      path: '/dashboard',
      name: '首頁儀表板',
      icon: 'dashboard',
      roles: ['manager', 'beautician'],
    },
    {
      path: '/schedule',
      name: '場務表',
      icon: 'calendar_today',
      roles: ['manager', 'beautician'],
    },
    {
      path: '/members',
      name: '會員管理',
      icon: 'group',
      roles: ['manager', 'beautician'],
    },
    {
      path: '/performance',
      name: '業績看板',
      icon: 'bar_chart',
      roles: ['manager', 'beautician'],
    },
    {
      path: '/portfolio',
      name: '作品集',
      icon: 'photo_library',
      roles: ['beautician'],
    },
    {
      path: '/inventory',
      name: '庫存管理',
      icon: 'inventory_2',
      roles: ['manager'],
    },
    {
      path: '/settings',
      name: '個人設置',
      icon: 'settings',
      roles: ['manager', 'beautician'],
    },
  ]

  return filterMenus(items)
})

/** 管理後台菜單（僅店長可見） */
const adminMenuItems = computed<MenuItem[]>(() => {
  if (!isManager.value) return []

  const items: MenuItem[] = [
    {
      path: '/admin/dashboard',
      name: '管理儀表板',
      icon: 'admin_panel_settings',
      roles: ['manager'],
    },
    {
      path: '/admin/staff',
      name: '員工管理',
      icon: 'badge',
      roles: ['manager'],
    },
    {
      path: '/admin/services',
      name: '服務項目',
      icon: 'content_cut',
      roles: ['manager'],
    },
    {
      path: '/admin/shop',
      name: '門店設置',
      icon: 'store',
      roles: ['manager'],
    },
  ]

  return filterMenus(items)
})

/** 當前活躍菜單路徑 */
const activeMenu = computed(() => {
  return route.path
})

/** 使用者頭像 */
const userAvatar = computed(() => {
  return authStore.user?.avatar || ''
})

/** 使用者顯示名稱 */
const userName = computed(() => {
  return authStore.user?.name || '使用者'
})

/** 使用者角色顯示名稱 */
const userRoleLabel = computed(() => {
  return authStore.isManager ? '店長 / 管理員' : '美容師'
})

// ==================== Resize 事件 ====================

/** 視窗 resize 處理（用於平板響應式） */
function handleResize(): void {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// ==================== 方法 ====================

/** 切換側邊欄折疊 */
function toggleSidebar(): void {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

/** 導航至指定路徑 */
function navigateTo(path: string): void {
  router.push(path)
  // 平板設備點擊菜單後關閉使用者選單
  userMenuVisible.value = false
}

/** 登出 */
function handleLogout(): void {
  authStore.logout()
  router.replace('/login')
}

/** 前往個人設置 */
function goToSettings(): void {
  userMenuVisible.value = false
  router.push('/settings')
}

/** 點擊外部關閉使用者選單 */
function onClickOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement
  if (!target.closest('.pc-layout__user')) {
    userMenuVisible.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<template>
  <div class="pc-layout" :class="{ 'pc-layout--tablet': isTablet }">
    <!-- ===== 左側側邊欄 ===== -->
    <aside
      class="pc-layout__sidebar"
      :class="{
        'pc-layout__sidebar--collapsed': isCollapsed,
        'pc-layout__sidebar--tablet': isTablet,
      }"
      :style="{ width: sidebarWidth }"
      @mouseenter="sidebarHovered = true"
      @mouseleave="sidebarHovered = false"
    >
      <!-- Logo 區域 -->
      <div class="pc-layout__logo">
        <div class="pc-layout__logo-icon">
          <span class="material-symbols-outlined">spa</span>
        </div>
        <transition name="fade">
          <span v-if="!isCollapsed" class="pc-layout__logo-text">SayDou神美</span>
        </transition>
      </div>

      <!-- 主菜單 -->
      <nav class="pc-layout__nav">
        <div class="pc-layout__nav-group">
          <transition name="fade">
            <span v-if="!isCollapsed" class="pc-layout__nav-group-title">主要功能</span>
          </transition>
          <a
            v-for="item in menuItems"
            :key="item.path"
            class="pc-layout__nav-item"
            :class="{ 'pc-layout__nav-item--active': activeMenu.startsWith(item.path) }"
            @click="navigateTo(item.path)"
          >
            <span class="material-symbols-outlined pc-layout__nav-icon">{{ item.icon }}</span>
            <transition name="fade">
              <span v-if="!isCollapsed" class="pc-layout__nav-label">{{ item.name }}</span>
            </transition>
          </a>
        </div>

        <!-- 管理後台菜單（僅店長） -->
        <div v-if="adminMenuItems.length > 0" class="pc-layout__nav-group">
          <transition name="fade">
            <span v-if="!isCollapsed" class="pc-layout__nav-group-title">管理後台</span>
          </transition>
          <a
            v-for="item in adminMenuItems"
            :key="item.path"
            class="pc-layout__nav-item"
            :class="{ 'pc-layout__nav-item--active': activeMenu.startsWith(item.path) }"
            @click="navigateTo(item.path)"
          >
            <span class="material-symbols-outlined pc-layout__nav-icon">{{ item.icon }}</span>
            <transition name="fade">
              <span v-if="!isCollapsed" class="pc-layout__nav-label">{{ item.name }}</span>
            </transition>
          </a>
        </div>
      </nav>

      <!-- 側邊欄底部：折疊按鈕 -->
      <div class="pc-layout__sidebar-footer">
        <button class="pc-layout__collapse-btn" @click="toggleSidebar" :title="isCollapsed ? '展開側邊欄' : '折疊側邊欄'">
          <span class="material-symbols-outlined">
            {{ isCollapsed ? 'chevron_right' : 'chevron_left' }}
          </span>
        </button>
      </div>
    </aside>

    <!-- ===== 右側主區域 ===== -->
    <div class="pc-layout__main" :style="{ marginLeft: sidebarWidth }">
      <!-- 頂部導航欄 -->
      <header class="pc-layout__header">
        <div class="pc-layout__header-left">
          <h2 class="pc-layout__page-title">{{ route.meta?.title || '' }}</h2>
        </div>

        <div class="pc-layout__header-right">
          <!-- 通知按鈕 -->
          <button class="pc-layout__header-btn" title="通知">
            <span class="material-symbols-outlined">notifications</span>
          </button>

          <!-- 使用者資訊 -->
          <div class="pc-layout__user">
            <div class="pc-layout__avatar" @click="userMenuVisible = !userMenuVisible">
              <img
                v-if="userAvatar"
                :src="userAvatar"
                :alt="userName"
                class="pc-layout__avatar-img"
              />
              <span v-else class="pc-layout__avatar-placeholder">
                {{ userName.charAt(0) }}
              </span>
            </div>
            <div class="pc-layout__user-info" @click="userMenuVisible = !userMenuVisible">
              <span class="pc-layout__user-name">{{ userName }}</span>
              <span class="pc-layout__user-role">{{ userRoleLabel }}</span>
            </div>
            <span class="material-symbols-outlined pc-layout__user-arrow" @click="userMenuVisible = !userMenuVisible">arrow_drop_down</span>

            <!-- 使用者下拉選單 -->
            <transition name="fade">
              <div v-if="userMenuVisible" class="pc-layout__user-menu">
                <button class="pc-layout__user-menu-item" @click="goToSettings">
                  <span class="material-symbols-outlined">settings</span>
                  個人設置
                </button>
                <div class="pc-layout__user-menu-divider" />
                <button class="pc-layout__user-menu-item pc-layout__user-menu-item--danger" @click="handleLogout">
                  <span class="material-symbols-outlined">logout</span>
                  登出
                </button>
              </div>
            </transition>
          </div>
        </div>
      </header>

      <!-- 內容區 -->
      <main class="pc-layout__content">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
// ==================== 變數 ====================
$sidebar-width: 240px;
$sidebar-collapsed-width: 64px;
$header-height: 60px;
$color-primary: #ac235a;
$color-primary-light: #cc3e73;
$color-surface: #fbf9f8;
$color-surface-container: #efeded;
$color-surface-container-high: #e9e8e7;
$color-on-surface: #1b1c1c;
$color-on-surface-variant: #574146;
$color-outline-variant: #debfc5;
$color-white: #ffffff;

// ==================== 佈局容器 ====================

.pc-layout {
  display: flex;
  min-height: 100vh;
  background: $color-surface-container;
}

// ==================== 側邊欄 ====================

.pc-layout__sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  background: $color-white;
  border-right: 1px solid #f0e6e8;
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: width 0.25s ease;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);

  &--collapsed {
    .pc-layout__nav-label,
    .pc-layout__nav-group-title,
    .pc-layout__logo-text {
      display: none;
    }
  }

  // 平板設備：側邊欄陰影加深
  &--tablet {
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.08);
  }
}

// Logo
.pc-layout__logo {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  border-bottom: 1px solid #f0e6e8;
  flex-shrink: 0;
}

.pc-layout__logo-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $color-primary, $color-primary-light);
  border-radius: 10px;
  color: $color-white;
  flex-shrink: 0;

  .material-symbols-outlined {
    font-size: 22px;
  }
}

.pc-layout__logo-text {
  font-family: 'Plus Jakarta Sans', 'Noto Sans TC', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: $color-primary;
  white-space: nowrap;
}

// 導航
.pc-layout__nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 8px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-outline-variant;
    border-radius: 2px;
  }
}

.pc-layout__nav-group {
  margin-bottom: 16px;
}

.pc-layout__nav-group-title {
  display: block;
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: $color-on-surface-variant;
  opacity: 0.6;
}

.pc-layout__nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
  color: $color-on-surface-variant;
  margin-bottom: 2px;

  &:hover {
    background: rgba($color-primary, 0.06);
    color: $color-primary;
  }

  &--active {
    background: rgba($color-primary, 0.1);
    color: $color-primary;
    font-weight: 600;
  }
}

.pc-layout__nav-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.pc-layout__nav-label {
  font-size: 14px;
  white-space: nowrap;
}

// 側邊欄底部
.pc-layout__sidebar-footer {
  padding: 12px 8px;
  border-top: 1px solid #f0e6e8;
  flex-shrink: 0;
}

.pc-layout__collapse-btn {
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: $color-on-surface-variant;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s ease;

  &:hover {
    background: rgba($color-primary, 0.06);
    color: $color-primary;
  }
}

// ==================== 主區域 ====================

.pc-layout__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.25s ease;
}

// ==================== 頂部導航 ====================

.pc-layout__header {
  height: $header-height;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: $color-white;
  border-bottom: 1px solid #f0e6e8;
  position: sticky;
  top: 0;
  z-index: 50;
}

.pc-layout__header-left {
  display: flex;
  align-items: center;
}

.pc-layout__page-title {
  font-family: 'Plus Jakarta Sans', 'Noto Sans TC', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: $color-on-surface;
}

.pc-layout__header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pc-layout__header-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: $color-on-surface-variant;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.15s ease;

  &:hover {
    background: rgba($color-primary, 0.06);
    color: $color-primary;
  }
}

// ==================== 使用者資訊 ====================

.pc-layout__user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: background 0.15s ease;

  &:hover {
    background: rgba($color-primary, 0.04);
  }
}

.pc-layout__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, $color-primary, $color-primary-light);

  &-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-white;
    font-size: 14px;
    font-weight: 600;
  }
}

.pc-layout__user-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.pc-layout__user-name {
  font-size: 14px;
  font-weight: 600;
  color: $color-on-surface;
  line-height: 1.2;
}

.pc-layout__user-role {
  font-size: 11px;
  color: $color-on-surface-variant;
  opacity: 0.7;
  line-height: 1;
}

.pc-layout__user-arrow {
  font-size: 18px;
  color: $color-on-surface-variant;
}

// 使用者下拉選單
.pc-layout__user-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 180px;
  background: $color-white;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid #f0e6e8;
  overflow: hidden;
  z-index: 200;
}

.pc-layout__user-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: $color-on-surface;
  cursor: pointer;
  transition: background 0.15s ease;
  font-family: inherit;

  &:hover {
    background: rgba($color-primary, 0.06);
  }

  .material-symbols-outlined {
    font-size: 20px;
  }

  &--danger {
    color: #ba1a1a;
  }
}

.pc-layout__user-menu-divider {
  height: 1px;
  background: #f0e6e8;
}

// ==================== 內容區 ====================

.pc-layout__content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: $color-surface-container;
}

// ==================== 動畫 ====================

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
