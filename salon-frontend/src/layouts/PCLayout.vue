<!--
  PCLayout.vue - PC 端全局佈局（頂部導航欄 + 左側可折疊菜單 + 主內容區）

  功能：
  1. 使用 Element Plus el-container + el-header + el-aside + el-main 實現標準後台佈局
  2. 頂部導航欄：漢堡按鈕、品牌區（Logo + 門店名稱）、通知鈴鐺、開單按鈕、用戶信息
  3. 左側菜單：可折疊，與漢堡按鈕聯動，展開顯示圖標+文字，收起僅顯示圖標
  4. 路由聯動：點擊菜單跳轉對應路由，當前頁面自動高亮
  5. 子菜單折疊：支援一級菜單展開/收起子項
  6. 根據角色動態顯示菜單（使用 usePermission.filterMenus）
  7. 平板響應式適配（768px ~ 1024px 自動折疊菜單）
  8. 移除原底部折疊按鈕，改由頂部漢堡按鈕控制

  設計規範：
  - 頂部導航欄高度：60px
  - 側邊欄寬度：240px（折疊後 64px）
  - 內容區背景：#f5f3f3
  - 主色：莫蘭迪柔粉 (#ac235a)
  - 平板適配：768px ~ 1024px 時側邊欄自動折疊

  技術棧：Vue 3 Composition API + Element Plus + SCSS
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermission } from '@/composables/usePermission'
import { BREAKPOINTS } from '@/composables/useDevice'
import { menuConfig, getDefaultOpeneds } from '@/layouts/components/Sidebar/menuConfig'
import type { MenuConfigItem } from '@/layouts/components/Sidebar/menuConfig'

// Element Plus 圖示導入
import {
  DataAnalysis,
  Money,
  Notebook,
  Calendar,
  User,
  Goods,
  Ticket,
  Shop,
  OfficeBuilding,
  Setting,
  TrendCharts,
  Discount,
  DataBoard,
  UserFilled,
  Coin,
  Clock,
  Lock,
  Wallet,
  Document,
  Edit,
  Folder,
  Files,
  FolderOpened,
  DocumentCopy,
  Grid,
  MapLocation,
  Camera,
  RemoveFilled,
  ChatLineSquare,
  CollectionTag,
  DocumentChecked,
  GoodsFilled,
  Download,
  Refresh,
  List,
  CreditCard,
  Present,
  Collection,
  Key,
  Bell,
  InfoFilled,
  Finished,
  Box,
  Picture,
  CoffeeCup,
  ArrowDown,
  Expand,
  Fold,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { isManager, filterMenus } = usePermission()

// ==================== 圖示映射表 ====================

/** 圖示名稱到組件的映射 */
const iconMap: Record<string, any> = {
  DataAnalysis,
  Money,
  Notebook,
  Calendar,
  User,
  Goods,
  Ticket,
  Shop,
  OfficeBuilding,
  Setting,
  TrendCharts,
  Discount,
  DataBoard,
  UserFilled,
  Coin,
  Clock,
  Lock,
  Wallet,
  Document,
  Edit,
  Folder,
  Files,
  FolderOpened,
  DocumentCopy,
  Grid,
  MapLocation,
  Camera,
  RemoveFilled,
  ChatLineSquare,
  CollectionTag,
  DocumentChecked,
  GoodsFilled,
  Download,
  Refresh,
  List,
  CreditCard,
  Present,
  Collection,
  Key,
  Bell,
  InfoFilled,
  Finished,
  Box,
  Picture,
  CoffeeCup,
  ArrowDown,
}

// ==================== 狀態 ====================

/** 側邊欄是否折疊 */
const sidebarCollapsed = ref(false)

/** 當前視窗寬度（用於平板響應式） */
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

/** 通知數量（模擬數據，後續可接入真實接口） */
const notificationCount = ref(3)

/** 用戶選單是否顯示 */
const userMenuVisible = ref(false)

// ==================== 計算屬性 ====================

/** 是否為平板設備（768px ~ 1024px） */
const isTablet = computed(() => {
  return windowWidth.value >= BREAKPOINTS.DESKTOP_MIN && windowWidth.value <= 1024
})

/** 側邊欄實際折疊狀態 */
const isCollapsed = computed(() => {
  // 平板設備自動折疊側邊欄
  if (isTablet.value) return true
  return sidebarCollapsed.value
})

/** 側邊欄寬度 */
const sidebarWidth = computed(() => {
  return isCollapsed.value ? '64px' : '240px'
})

/** 過濾後的菜單列表（根據角色） */
const filteredMenus = computed(() => {
  return filterMenus(menuConfig as any) as MenuConfigItem[]
})

/** 當前活躍菜單路徑 */
const activeMenu = computed(() => {
  return route.path
})

/** 預設展開的菜單（根據當前路由自動計算） */
const defaultOpeneds = ref<string[]>([])

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

/** 門店名稱 */
const shopName = computed(() => {
  return 'Wonder sky國際美妍館'
})

// ==================== 監聽路由變化 ====================

/** 路由變化時更新展開的菜單 */
watch(
  () => route.path,
  (newPath) => {
    defaultOpeneds.value = getDefaultOpeneds(newPath)
  },
  { immediate: true }
)

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

/** 切換側邊欄折疊（漢堡按鈕） */
function toggleSidebar(): void {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

/** 導航至指定路徑 */
function navigateTo(path: string): void {
  router.push(path)
  // 平板設備點擊菜單後關閉用戶選單
  userMenuVisible.value = false
}

/** 切換用戶選單顯示 */
function toggleUserMenu(): void {
  userMenuVisible.value = !userMenuVisible.value
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

/** 開單按鈕點擊 */
function handleCreateOrder(): void {
  // 保留開單功能入口，後續可接入實際開單邏輯
  console.log('開單')
}

/** 點擊外部關閉用戶選單 */
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
  <el-container class="pc-layout" :class="{ 'pc-layout--tablet': isTablet }">
    <!-- ===== 頂部導航欄 ===== -->
    <el-header class="pc-layout__header" height="60px">
      <div class="pc-layout__header-left">
        <!-- 漢堡菜單按鈕 -->
        <button
          class="pc-layout__hamburger"
          @click="toggleSidebar"
          :title="isCollapsed ? '展開側邊欄' : '折疊側邊欄'"
        >
          <el-icon :size="22">
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
          </el-icon>
        </button>

        <!-- 品牌區：Logo + 門店名稱 -->
        <div class="pc-layout__brand">
          <div class="pc-layout__brand-logo">
            <el-icon :size="22" color="#ffffff">
              <CoffeeCup />
            </el-icon>
          </div>
          <span class="pc-layout__brand-name">{{ shopName }}</span>
        </div>
      </div>

      <div class="pc-layout__header-right">
        <!-- 通知鈴鐺（帶消息數字標記） -->
        <button class="pc-layout__notification-btn" title="通知">
          <el-badge :value="notificationCount" :hidden="notificationCount === 0" class="pc-layout__badge">
            <el-icon :size="22">
              <Bell />
            </el-icon>
          </el-badge>
        </button>

        <!-- 開單按鈕（粉色主色） -->
        <button class="pc-layout__order-btn" @click="handleCreateOrder">
          <span class="pc-layout__order-btn-text">開單</span>
        </button>

        <!-- 用戶頭像/信息欄 -->
        <div class="pc-layout__user" @click="toggleUserMenu">
          <div class="pc-layout__avatar">
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
          <div class="pc-layout__user-info">
            <span class="pc-layout__user-name">{{ userName }}</span>
            <span class="pc-layout__user-role">{{ userRoleLabel }}</span>
          </div>
          <el-icon :size="16" class="pc-layout__user-arrow" :class="{ 'pc-layout__user-arrow--open': userMenuVisible }">
            <ArrowDown />
          </el-icon>

          <!-- 用戶下拉選單 -->
          <transition name="fade">
            <div v-if="userMenuVisible" class="pc-layout__user-menu">
              <button class="pc-layout__user-menu-item" @click="goToSettings">
                <el-icon :size="18"><Setting /></el-icon>
                個人設置
              </button>
              <div class="pc-layout__user-menu-divider" />
              <button class="pc-layout__user-menu-item pc-layout__user-menu-item--danger" @click="handleLogout">
                <el-icon :size="18"><Lock /></el-icon>
                登出
              </button>
            </div>
          </transition>
        </div>
      </div>
    </el-header>

    <!-- ===== 主體區域（左側菜單 + 內容區） ===== -->
    <el-container class="pc-layout__body">
      <!-- ===== 左側菜單 ===== -->
      <el-aside
        class="pc-layout__sidebar"
        :class="{
          'pc-layout__sidebar--collapsed': isCollapsed,
          'pc-layout__sidebar--tablet': isTablet,
        }"
        :width="sidebarWidth"
      >
        <div class="pc-layout__nav">
          <el-menu
            :default-active="activeMenu"
            :default-openeds="defaultOpeneds"
            :collapse="isCollapsed"
            :collapse-transition="false"
            :unique-opened="true"
            background-color="#ffffff"
            text-color="#574146"
            active-text-color="#ac235a"
            router
            class="pc-layout__el-menu"
          >
            <template v-for="group in filteredMenus" :key="group.path">
              <!-- 有子菜單的群組 -->
              <el-sub-menu v-if="group.children && group.children.length > 0" :index="group.path">
                <template #title>
                  <el-icon>
                    <component :is="iconMap[group.icon]" />
                  </el-icon>
                  <span>{{ group.name }}</span>
                </template>
                <el-menu-item
                  v-for="child in group.children"
                  :key="child.path"
                  :index="child.path"
                  @click="navigateTo(child.path)"
                >
                  <el-icon>
                    <component :is="iconMap[child.icon]" />
                  </el-icon>
                  <span>{{ child.name }}</span>
                </el-menu-item>
              </el-sub-menu>

              <!-- 無子菜單的單獨項 -->
              <el-menu-item v-else :index="group.path" @click="navigateTo(group.path)">
                <el-icon>
                  <component :is="iconMap[group.icon]" />
                </el-icon>
                <span>{{ group.name }}</span>
              </el-menu-item>
            </template>
          </el-menu>
        </div>
      </el-aside>

      <!-- ===== 右側主內容區 ===== -->
      <el-main class="pc-layout__content">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
// ==================== 變數 ====================
$sidebar-width: 240px;
$sidebar-collapsed-width: 64px;
$header-height: 60px;
$color-primary: #ac235a;
$color-primary-light: #cc3e73;
$color-surface: #fbf9f8;
$color-surface-container: #f5f3f3;
$color-surface-container-high: #e9e8e7;
$color-on-surface: #1b1c1c;
$color-on-surface-variant: #574146;
$color-outline-variant: #debfc5;
$color-white: #ffffff;

// ==================== 佈局容器 ====================

.pc-layout {
  width: 100%;
  min-height: 100vh;
  background: $color-surface-container;

  // 覆蓋 Element Plus el-container 預設樣式
  &.el-container {
    display: flex;
    flex-direction: column;
  }
}

// ==================== 頂部導航欄 ====================

.pc-layout__header {
  display: flex !important;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: $color-white;
  border-bottom: 1px solid #f0e6e8;
  position: sticky;
  top: 0;
  z-index: 200;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;

  // 覆蓋 Element Plus el-header 預設 padding
  &.el-header {
    padding: 0 20px;
  }
}

.pc-layout__header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

// 漢堡菜單按鈕
.pc-layout__hamburger {
  width: 36px;
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

  .el-icon {
    transition: transform 0.2s ease;
  }
}

// 品牌區
.pc-layout__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pc-layout__brand-logo {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $color-primary, $color-primary-light);
  border-radius: 10px;
  flex-shrink: 0;
}

.pc-layout__brand-name {
  font-family: 'Plus Jakarta Sans', 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: $color-on-surface;
  white-space: nowrap;
  letter-spacing: 0.5px;
}

// ==================== 頂部導航右側 ====================

.pc-layout__header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

// 通知按鈕
.pc-layout__notification-btn {
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
  position: relative;

  &:hover {
    background: rgba($color-primary, 0.06);
    color: $color-primary;
  }
}

// 通知徽標樣式覆蓋
:deep(.pc-layout__badge) {
  .el-badge__content {
    background-color: #e8465a;
    border: 2px solid $color-white;
    font-size: 10px;
    height: 18px;
    min-width: 18px;
    line-height: 14px;
    padding: 0 4px;
  }
}

// 開單按鈕
.pc-layout__order-btn {
  height: 34px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: linear-gradient(135deg, $color-primary, $color-primary-light);
  color: $color-white;
  cursor: pointer;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba($color-primary, 0.3);

  &:hover {
    opacity: 0.92;
    box-shadow: 0 4px 12px rgba($color-primary, 0.4);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba($color-primary, 0.3);
  }
}

.pc-layout__order-btn-text {
  letter-spacing: 1px;
}

// ==================== 用戶資訊 ====================

.pc-layout__user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 4px;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: background 0.15s ease;

  &:hover {
    background: rgba($color-primary, 0.04);
  }
}

.pc-layout__avatar {
  width: 34px;
  height: 34px;
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
    font-size: 13px;
    font-weight: 600;
  }
}

.pc-layout__user-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.pc-layout__user-name {
  font-size: 13px;
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
  color: $color-on-surface-variant;
  opacity: 0.5;
  transition: transform 0.2s ease;

  &--open {
    transform: rotate(180deg);
  }
}

// 用戶下拉選單
.pc-layout__user-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 160px;
  background: $color-white;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid #f0e6e8;
  overflow: hidden;
  z-index: 300;
}

.pc-layout__user-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  background: transparent;
  font-size: 13px;
  color: $color-on-surface;
  cursor: pointer;
  transition: background 0.15s ease;
  font-family: inherit;

  &:hover {
    background: rgba($color-primary, 0.06);
  }

  &--danger {
    color: #ba1a1a;
  }
}

.pc-layout__user-menu-divider {
  height: 1px;
  background: #f0e6e8;
}

// ==================== 主體區域 ====================

.pc-layout__body {
  flex: 1;
  display: flex;
  min-height: 0;

  // 覆蓋 Element Plus el-container 預設樣式
  &.el-container {
    display: flex;
  }
}

// ==================== 左側菜單 ====================

.pc-layout__sidebar {
  background: $color-white;
  border-right: 1px solid #f0e6e8;
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  overflow: hidden;
  flex-shrink: 0;

  // 覆蓋 Element Plus el-aside 預設樣式
  &.el-aside {
    overflow: visible;
  }

  &--collapsed {
    width: $sidebar-collapsed-width !important;
  }

  // 平板設備
  &--tablet {
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.08);
  }
}

// ==================== el-menu 導航 ====================

.pc-layout__nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-outline-variant;
    border-radius: 2px;
  }
}

// 覆蓋 Element Plus el-menu 預設樣式
.pc-layout__el-menu {
  border-right: none !important;

  // 折疊模式
  &.el-menu--collapse {
    width: $sidebar-collapsed-width;

    .el-sub-menu__title {
      padding: 0 15px;
    }
  }

  // 一級菜單
  :deep(.el-sub-menu__title) {
    height: 44px;
    line-height: 44px;
    font-size: 14px;
    font-weight: 500;
    padding: 0 16px;
    border-radius: 0;
    margin: 2px 0;
    transition: all 0.15s ease;
    color: $color-on-surface-variant;

    &:hover {
      background: rgba($color-primary, 0.06) !important;
      color: $color-primary;
    }

    .el-icon {
      font-size: 18px;
      margin-right: 8px;
    }
  }

  // 二級菜單項
  :deep(.el-menu-item) {
    height: 40px;
    line-height: 40px;
    font-size: 13px;
    padding: 0 16px 0 48px !important;
    border-radius: 0;
    margin: 1px 0;
    transition: all 0.15s ease;
    color: $color-on-surface-variant;

    &:hover {
      background: rgba($color-primary, 0.06) !important;
      color: $color-primary;
    }

    &.is-active {
      background: rgba($color-primary, 0.1) !important;
      color: $color-primary !important;
      font-weight: 600;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 20px;
        background: $color-primary;
        border-radius: 0 3px 3px 0;
      }
    }

    .el-icon {
      font-size: 16px;
      margin-right: 6px;
    }
  }

  // 折疊模式下的子菜單
  :deep(.el-menu--collapse) {
    .el-sub-menu__title {
      padding: 0 15px;
    }

    .el-menu-item {
      padding: 0 15px !important;
    }
  }

  // 展開/收起箭頭
  :deep(.el-sub-menu__title .el-sub-menu__icon-arrow) {
    font-size: 14px;
    right: 12px;
    color: $color-on-surface-variant;
    opacity: 0.5;
  }

  // 子菜單背景
  :deep(.el-menu--inline) {
    background: rgba($color-primary, 0.02) !important;
  }
}

// ==================== 主內容區 ====================

.pc-layout__content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: $color-surface-container;
  min-height: calc(100vh - $header-height);

  // 覆蓋 Element Plus el-main 預設 padding
  &.el-main {
    padding: 24px;
  }
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

// ==================== 平板響應式 ====================

@media screen and (max-width: 1024px) and (min-width: 768px) {
  .pc-layout__brand-name {
    font-size: 14px;
  }

  .pc-layout__user-info {
    display: none;
  }

  .pc-layout__order-btn {
    padding: 0 14px;
    height: 32px;
    font-size: 13px;
  }
}
</style>
