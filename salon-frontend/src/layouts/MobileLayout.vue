<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermission } from '@/composables/usePermission'
import type { MenuItem } from '@/composables/usePermission'
import { menuConfig } from '@/layouts/components/Sidebar/menuConfig'
import type { MenuConfigItem } from '@/layouts/components/Sidebar/menuConfig'

// 導入 Element Plus 組件 & 圖標
import { ElDrawer, ElMenu, ElSubMenu, ElMenuItem } from 'element-plus'
import {
  HomeFilled,      // 首頁
  Calendar,        // 場務
  User,            // 會員
  DataAnalysis,    // 業績
  Setting,         // 設定
  ArrowLeft,       // 返回箭頭
  SwitchButton,    // 登出（或用其他合適圖標）
  Menu as MenuIcon // 漢堡菜單
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { filterMenus } = usePermission()

// ==================== 狀態 ====================
/** 當前頁面標題 */
const pageTitle = ref('')
/** 抽屜菜單顯示狀態 */
const drawerVisible = ref(false)
/** 是否顯示返回按鈕 */
const showBack = computed(() => {
  return route.meta?.hidden === true || route.path.split('/').filter(Boolean).length > 2
})

// ==================== 計算屬性 ====================
/** 底部導航項目 */
const tabItems = computed<MenuItem[]>(() => {
  const items: MenuItem[] = [
    { path: '/dashboard', name: '首頁', icon: 'home', roles: ['manager', 'beautician'] },
    { path: '/schedule', name: '場務', icon: 'calendar_month', roles: ['manager', 'beautician'] },
    { path: '/members', name: '會員', icon: 'group', roles: ['manager', 'beautician'] },
    { path: '/performance', name: '業績', icon: 'bar_chart', roles: ['manager', 'beautician'] },
    { path: '/settings', name: '設定', icon: 'settings', roles: ['manager', 'beautician'] },
  ]
  return filterMenus(items)
})

/** 側邊欄菜單（權限過濾） */
const filteredMenus = computed(() => filterMenus(menuConfig as any) as MenuConfigItem[])

/** 當前活躍底部導航 */
const activeTab = computed(() => {
  const idx = tabItems.value.findIndex((item) => route.path.startsWith(item.path))
  return idx >= 0 ? idx : 0
})

// ==================== 方法 ====================
/** 切換抽屜菜單 */
function toggleDrawer() {
  drawerVisible.value = !drawerVisible.value
}

/** 路由跳轉 & 關閉菜單 */
function navigateTo(path: string) {
  router.push(path)
  drawerVisible.value = false
}

/** 切換底部導航 */
function onTabChange(index: number): void {
  const item = tabItems.value[index]
  if (item) {
    router.push(item.path)
    drawerVisible.value = false
  }
}

/** 返回上一頁 */
function goBack(): void {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/dashboard')
  }
  drawerVisible.value = false
}

/** 登出 */
function handleLogout(): void {
  authStore.logout()
  router.replace('/login')
  drawerVisible.value = false
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
    <!-- ===== 頂部導航欄：漢堡 + 居中標題 + 登出 ===== -->
    <header class="mobile-layout__header">
      <div class="mobile-layout__header-left">
        <!-- 漢堡菜單按鈕 -->
        <button class="mobile-layout__header-btn" @click="toggleDrawer" title="展開菜單">
          <el-icon size="22">
            <MenuIcon />
          </el-icon>
        </button>
        <!-- 返回按鈕（子頁面自動顯示） -->
        <button v-if="showBack" class="mobile-layout__header-btn" @click="goBack" title="返回">
          <el-icon size="22">
            <ArrowLeft />
          </el-icon>
        </button>
      </div>

      <!-- 居中頁面標題 -->
      <h1 class="mobile-layout__header-title">{{ pageTitle }}</h1>

      <div class="mobile-layout__header-right">
        <button class="mobile-layout__header-btn" @click="handleLogout" title="登出">
          <el-icon size="22">
            <Logout />
          </el-icon>
        </button>
      </div>
    </header>

    <!-- ===== 左側抽屜菜單 ===== -->
    <el-drawer v-model="drawerVisible" direction="ltr" size="260px" :with-header="false" :modal="true"
      :show-close="false" class="mobile-drawer" @close="drawerVisible = false">
      <div class="drawer-menu">
        <el-menu :default-active="route.path" :unique-opened="true" background-color="#ffffff" text-color="#574146"
          active-text-color="#ac235a" router>
          <template v-for="group in filteredMenus" :key="group.path">
            <el-sub-menu v-if="group.children?.length" :index="group.path">
              <template #title>
                <el-icon>
                  <component :is="group.icon" />
                </el-icon>
                <span>{{ group.name }}</span>
              </template>
              <el-menu-item v-for="child in group.children" :key="child.path" :index="child.path"
                @click="navigateTo(child.path)">
                <el-icon>
                  <component :is="child.icon" />
                </el-icon>
                <span>{{ child.name }}</span>
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item v-else :index="group.path" @click="navigateTo(group.path)">
              <el-icon>
                <component :is="group.icon" />
              </el-icon>
              <span>{{ group.name }}</span>
            </el-menu-item>
          </template>
        </el-menu>
      </div>
    </el-drawer>

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

    <!-- ===== 底部導航欄 ===== -->
    <footer class="mobile-layout__tabbar">
      <template v-for="(item, index) in tabItems" :key="item.path">
        <button class="mobile-layout__tab-item" :class="{ 'mobile-layout__tab-item--active': activeTab === index }"
          @click="onTabChange(index)">
          <span class="material-symbols-outlined mobile-layout__tab-icon">{{ item.icon }}</span>
          <span class="mobile-layout__tab-label">{{ item.name }}</span>
        </button>
      </template>
    </footer>
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
$color-white: #ffffff;

// ==================== 佈局容器 ====================
.mobile-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: $color-surface-container;
  position: relative;
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
  z-index: 999; // 最高層級，不被遮擋
}

.mobile-layout__header-left {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 80px;
}

.mobile-layout__header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 80px;
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
}

// ==================== 抽屜菜單樣式 ====================
:deep(.mobile-drawer) {
  .el-drawer {
    top: $header-height !important;
    height: calc(100vh - #{$header-height}) !important;
    z-index: 99 !important;
  }

  .el-drawer__body {
    padding: 0;
    background: #faf7f6;
  }

  .el-overlay {
    top: $header-height !important;
    z-index: 98 !important;
  }
}

.drawer-menu {
  height: 100%;
  overflow-y: auto;
}

// ==================== 內容區 ====================
.mobile-layout__content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc($tabbar-height + $safe-area-bottom);
}

// ==================== 底部導航 ====================
.mobile-layout__tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc($tabbar-height + $safe-area-bottom);
  background: $color-white;
  border-top: 1px solid #eee;
  display: flex;
  align-items: center;
  padding-bottom: $safe-area-bottom;
  z-index: 100;
}

.mobile-layout__tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: $tabbar-height;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;

  &--active {
    .mobile-layout__tab-icon {
      color: $color-primary;
      font-variation-settings: 'FILL' 1;
    }

    .mobile-layout__tab-label {
      color: $color-primary;
      font-weight: 600;
    }
  }
}

.mobile-layout__tab-icon {
  font-size: 22px;
  color: $color-on-surface-variant;
}

.mobile-layout__tab-label {
  font-size: 11px;
  color: $color-on-surface-variant;
}

// ==================== 頁面動畫 ====================
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