<!--
  MobileLayout.vue - 移動端全局佈局（底部導航 + 頂部導航 + 內容區）

  功能：
  1. 頂部導航欄（返回按鈕 + 頁面標題 + 功能按鈕）
  2. 內容區（路由視圖）
  3. 底部導航欄（4~5 個主要功能入口）
  4. 根據角色動態顯示底部導航（使用 usePermission.filterMenus）
  5. 安全區域適配（iOS / Android 底部導航條）

  設計規範：
  - 頂部導航高度：48px
  - 底部導航高度：56px（含安全區域適配）
  - 內容區在導航之間

  技術棧：Vue 3 Composition API + SCSS
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermission } from '@/composables/usePermission'
import type { MenuItem } from '@/composables/usePermission'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { filterMenus } = usePermission()

// ==================== 狀態 ====================

/** 當前標題 */
const pageTitle = ref('')

/** 是否顯示返回按鈕 */
const showBack = computed(() => {
  // 隱藏菜單的路由（詳情頁、編輯頁）或路徑深度 > 2 時顯示返回
  return route.meta?.hidden === true || route.path.split('/').filter(Boolean).length > 2
})

// ==================== 計算屬性 ====================

/** 底部導航項目（根據角色過濾） */
const tabItems = computed<MenuItem[]>(() => {
  const items: MenuItem[] = [
    {
      path: '/dashboard',
      name: '首頁',
      icon: 'home',
      roles: ['manager', 'beautician'],
    },
    {
      path: '/schedule',
      name: '場務',
      icon: 'calendar_month',
      roles: ['manager', 'beautician'],
    },
    {
      path: '/members',
      name: '會員',
      icon: 'group',
      roles: ['manager', 'beautician'],
    },
    {
      path: '/performance',
      name: '業績',
      icon: 'bar_chart',
      roles: ['manager', 'beautician'],
    },
    {
      path: '/settings',
      name: '設定',
      icon: 'settings',
      roles: ['manager', 'beautician'],
    },
  ]

  return filterMenus(items)
})

/** 當前活躍的底部導航索引 */
const activeTab = computed(() => {
  const idx = tabItems.value.findIndex((item) => route.path.startsWith(item.path))
  return idx >= 0 ? idx : 0
})

// ==================== 方法 ====================

/** 切換底部導航 */
function onTabChange(index: number): void {
  const item = tabItems.value[index]
  if (item) {
    router.push(item.path)
  }
}

/** 返回上一頁 */
function goBack(): void {
  // 如果有瀏覽歷史則返回，否則回到首頁
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/dashboard')
  }
}

/** 登出 */
function handleLogout(): void {
  authStore.logout()
  router.replace('/login')
}

// ==================== 監聽 ====================

watch(
  () => route.meta?.title,
  (title) => {
    pageTitle.value = (title as string) || ''
  },
  { immediate: true }
)
</script>

<template>
  <div class="mobile-layout">
    <!-- ===== 頂部導航欄 ===== -->
    <header class="mobile-layout__header">
      <div class="mobile-layout__header-left">
        <button v-if="showBack" class="mobile-layout__header-btn" @click="goBack" title="返回">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      <h1 class="mobile-layout__header-title">{{ pageTitle }}</h1>

      <div class="mobile-layout__header-right">
        <button class="mobile-layout__header-btn" @click="handleLogout" title="登出">
          <span class="material-symbols-outlined">logout</span>
        </button>
      </div>
    </header>

    <!-- ===== 內容區 ===== -->
    <main class="mobile-layout__content">
      <router-view v-slot="{ Component }">
        <transition name="page-slide" mode="out-in">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped lang="scss">
// ==================== 變數 ====================
$header-height: 48px;
$tabbar-height: 56px;
$safe-area-bottom: env(safe-area-inset-bottom, 0px);
$color-primary: #ac235a;
$color-primary-light: #cc3e73;
$color-surface: #fbf9f8;
$color-surface-container: #efeded;
$color-on-surface: #1b1c1c;
$color-on-surface-variant: #574146;
$color-outline-variant: #debfc5;
$color-white: #ffffff;

// ==================== 佈局容器 ====================

.mobile-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: $color-surface-container;
  padding-bottom: calc($tabbar-height + $safe-area-bottom);
}

// ==================== 頂部導航 ====================

.mobile-layout__header {
  height: $header-height;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  background: $color-white;
  border-bottom: 1px solid #f0e6e8;
  position: sticky;
  top: 0;
  z-index: 50;
}

.mobile-layout__header-left,
.mobile-layout__header-right {
  display: flex;
  align-items: center;
  min-width: 48px;
}

.mobile-layout__header-right {
  justify-content: flex-end;
}

.mobile-layout__header-title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: $color-on-surface;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 8px;
}

.mobile-layout__header-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: $color-on-surface-variant;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.15s ease;

  &:active {
    background: rgba($color-primary, 0.08);
    color: $color-primary;
  }

  .material-symbols-outlined {
    font-size: 22px;
  }
}

// ==================== 內容區 ====================

.mobile-layout__content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.mobile-layout__tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;

  &--active {
    .mobile-layout__tab-icon {
      color: $color-primary;
      font-variation-settings: 'FILL' 1;
    }

    .mobile-layout__tab-label {
      color: $color-primary;
      font-weight: 600;
    }

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 24px;
      height: 3px;
      background: $color-primary;
      border-radius: 0 0 3px 3px;
    }
  }

  &:active {
    opacity: 0.7;
  }
}

.mobile-layout__tab-icon {
  font-size: 24px;
  color: $color-on-surface-variant;
  transition: all 0.15s ease;
}

.mobile-layout__tab-label {
  font-size: 11px;
  color: $color-on-surface-variant;
  transition: all 0.15s ease;
}

// ==================== 頁面切換動畫 ====================

.page-slide-enter-active,
.page-slide-leave-active {
  transition: all 0.25s ease;
}

.page-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
