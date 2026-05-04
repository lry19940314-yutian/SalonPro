<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermission } from '@/composables/usePermission'
import { useDevice } from '@/composables/useDevice'
import { menuConfig, getDefaultOpeneds } from '@/layouts/components/Sidebar/menuConfig'
import type { MenuConfigItem } from '@/layouts/components/Sidebar/menuConfig'

import {
  DataAnalysis, Money, Notebook, Calendar, User, Goods, Ticket, Shop,
  OfficeBuilding, Setting, TrendCharts, Discount, DataBoard, UserFilled,
  Coin, Clock, Lock, Wallet, Document, Edit, Folder, Files, FolderOpened,
  DocumentCopy, Grid, MapLocation, Camera, RemoveFilled, ChatLineSquare,
  CollectionTag, DocumentChecked, GoodsFilled, Download, Refresh, List,
  CreditCard, Present, Collection, Key, Bell, InfoFilled, Finished,
  Box, Picture, CoffeeCup, ArrowDown, Expand, Fold,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { filterMenus } = usePermission()

const iconMap: Record<string, any> = {
  DataAnalysis, Money, Notebook, Calendar, User, Goods, Ticket, Shop,
  OfficeBuilding, Setting, TrendCharts, Discount, DataBoard, UserFilled,
  Coin, Clock, Lock, Wallet, Document, Edit, Folder, Files, FolderOpened,
  DocumentCopy, Grid, MapLocation, Camera, RemoveFilled, ChatLineSquare,
  CollectionTag, DocumentChecked, GoodsFilled, Download, Refresh, List,
  CreditCard, Present, Collection, Key, Bell, InfoFilled, Finished,
  Box, Picture, CoffeeCup, ArrowDown,
}

// 菜单状态：默认关闭
const menuOpen = ref(false)
const notificationCount = ref(3)
const userMenuVisible = ref(false)

const filteredMenus = computed(() => filterMenus(menuConfig as any) as MenuConfigItem[])
const activeMenu = computed(() => route.path)
const defaultOpeneds = ref<string[]>([])

const userAvatar = computed(() => authStore.user?.avatar || '')
const userName = computed(() => authStore.user?.name || '使用者')
const userRoleLabel = computed(() => authStore.isManager ? '店長 / 管理員' : '美容師')
const shopName = computed(() => 'Wonder sky國際美妍館')

watch(() => route.path, (newPath) => {
  defaultOpeneds.value = getDefaultOpeneds(newPath)
}, { immediate: true })

// 切换菜单
function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function navigateTo(path: string) {
  router.push(path)
  menuOpen.value = false
}

function toggleUserMenu() {
  userMenuVisible.value = !userMenuVisible.value
}

function handleLogout() {
  authStore.logout()
  router.replace('/login')
}

function goToSettings() {
  router.push('/settings')
  userMenuVisible.value = false
}

function handleCreateOrder() {
  console.log('開單')
}
</script>

<template>
  <div class="pc-layout">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="left">
        <button class="hamburger" @click="toggleMenu">
          <el-icon :size="22">
            <Fold v-if="menuOpen" />
            <Expand v-else />
          </el-icon>
        </button>
        <div class="brand">
          <div class="logo"><el-icon :size="22" color="#fff"><CoffeeCup /></el-icon></div>
          <span>{{ shopName }}</span>
        </div>
      </div>

      <div class="right">
        <button class="notify"><el-icon :size="22"><Bell /></el-icon></button>
        <button class="order" @click="handleCreateOrder">開單</button>
        <div class="user" @click="toggleUserMenu">
          <div class="avatar"><span>{{ userName.charAt(0) }}</span></div>
          <div class="info"><span>{{ userName }}</span><span>{{ userRoleLabel }}</span></div>
          <el-icon :size="16"><ArrowDown /></el-icon>
          <transition name="fade">
            <div v-if="userMenuVisible" class="user-menu">
              <button @click="goToSettings"><Setting /> 個人設置</button>
              <div class="line"></div>
              <button @click="handleLogout"><Lock /> 登出</button>
            </div>
          </transition>
        </div>
      </div>
    </header>

    <!-- 主体区域（flex 布局，菜单展开时挤开内容） -->
    <div class="body">
      <!-- 左侧菜单：非 fixed，flex 布局控制宽度 -->
      <aside class="sidebar" :class="{ open: menuOpen }">
        <div class="menu-container">
          <el-menu
            :default-active="activeMenu"
            :default-openeds="defaultOpeneds"
            :unique-opened="true"
            background-color="#fff"
            text-color="#574146"
            active-text-color="#ac235a"
            router
          >
            <template v-for="group in filteredMenus" :key="group.path">
              <el-sub-menu v-if="group.children?.length" :index="group.path">
                <template #title>
                  <el-icon><component :is="iconMap[group.icon]" /></el-icon>
                  <span>{{ group.name }}</span>
                </template>
                <el-menu-item v-for="child in group.children" :key="child.path" :index="child.path" @click="navigateTo(child.path)">
                  <el-icon><component :is="iconMap[child.icon]" /></el-icon>
                  <span>{{ child.name }}</span>
                </el-menu-item>
              </el-sub-menu>
              <el-menu-item v-else :index="group.path" @click="navigateTo(group.path)">
                <el-icon><component :is="iconMap[group.icon]" /></el-icon>
                <span>{{ group.name }}</span>
              </el-menu-item>
            </template>
          </el-menu>
        </div>
      </aside>

      <!-- 主内容区：菜单展开时自动右移，不会被遮挡 -->
      <main class="content" :class="{ 'content--with-sidebar': menuOpen }">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <keep-alive><component :is="Component" /></keep-alive>
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
$header-height: 60px;
$menu-width: 220px;
$color-primary: #ac235a;
$color-bg: #f5f3f3;

.pc-layout {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: $color-bg;
}

/* 顶部导航 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #eee;
  height: $header-height;
  flex-shrink: 0;
  position: relative;
  z-index: 9999;

  .left { display: flex; align-items: center; gap: 16px; }
  .hamburger { width: 36px; height: 36px; border: none; background: transparent; cursor: pointer; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .logo { width: 34px; height: 34px; background: $color-primary; border-radius: 10px; display: grid; place-items: center; }

  .right { display: flex; align-items: center; gap: 12px; }
  .notify { width: 36px; height: 36px; border: none; background: transparent; }
  .order { height: 34px; padding: 0 20px; border: none; background: $color-primary; color: #fff; border-radius: 8px; }
  .user { display: flex; align-items: center; gap: 8px; cursor: pointer; position: relative; }
  .avatar { width: 34px; height: 34px; border-radius: 50%; background: $color-primary; color: #fff; display: grid; place-items: center; }
  .info { font-size: 12px; line-height: 1.2; }
  .user-menu {
    position: absolute; top: 100%; right: 0; background: #fff; border-radius: 10px; box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    z-index: 10000;
    button { width: 160px; padding: 10px; display: flex; align-items: center; gap: 8px; border: none; background: transparent; text-align: left; }
    .line { height: 1px; background: #eee; }
  }
}

/* 主体区域：flex 布局 */
.body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧菜单：flex 宽度控制，不 fixed */
.sidebar {
  width: 0;
  height: 100%;
  background: #fff;
  box-shadow: 2px 0 8px rgba(0,0,0,0.08);
  transition: width 0.3s ease;
  overflow: hidden;

  &.open {
    width: $menu-width;
  }

  .menu-container {
    width: $menu-width;
    height: 100%;
    overflow-y: auto;
    background: #faf7f6;
  }
}

/* 主内容区：菜单展开时自动右移 */
.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  transition: margin-left 0.3s ease;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.page-fade-enter-active, .page-fade-leave-active { transition: opacity 0.2s; }
.page-fade-enter-from, .page-fade-leave-to { opacity: 0; }
</style>