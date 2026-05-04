<!--
  App.vue - 應用程式根組件

  功能：
  1. 根據設備類型動態切換佈局類別（PC / 手機）
  2. 平板設備自動使用 PC 佈局類別，透過響應式樣式適配
  3. 提供路由出口 <router-view> 與路由切換動畫
  4. 全域錯誤邊界（onErrorCaptured）
  5. 根據路由 meta.keepAlive 動態控制頁面緩存
  6. 載入全域樣式（CSS 變數、重置樣式、UI 庫覆蓋）

  技術棧：Vue 3 Composition API + <script setup>
-->
<script setup lang="ts">
import { computed, onErrorCaptured, ref } from 'vue'
import { useDevice } from '@/composables/useDevice'
import type { DeviceType } from '@/composables/useDevice'

/** 設備類型檢測 */
const { deviceType } = useDevice()

/** 是否發生錯誤 */
const hasError = ref(false)

/** 錯誤訊息 */
const errorMessage = ref('')

/** 根據設備類型決定佈局類別（平板兼容 PC 樣式） */
const layoutClass = computed<string>(() => {
  const layoutMap: Record<DeviceType, string> = {
    pc: 'app-layout--pc',
    mobile: 'app-layout--mobile',
  }
  const currentDevice = deviceType.value as DeviceType
  return `app-layout ${layoutMap[currentDevice]}`
})

/** 全域錯誤捕獲 */
onErrorCaptured((err: Error) => {
  hasError.value = true
  errorMessage.value = err.message || '應用程式發生未知錯誤'
  console.error('[全域錯誤]', err)
  return false
})

/** 重新載入頁面 */
function reloadPage(): void {
  window.location.reload()
}
</script>

<template>
  <div :class="layoutClass">
    <!-- 錯誤邊界：捕獲渲染錯誤時顯示 -->
    <div v-if="hasError" class="app-error">
      <div class="app-error__content">
        <span class="material-symbols-outlined app-error__icon">error</span>
        <h2 class="app-error__title">系統發生錯誤</h2>
        <p class="app-error__message">{{ errorMessage }}</p>
        <button class="app-error__btn" @click="reloadPage">
          重新整理頁面
        </button>
      </div>
    </div>

    <!-- 正常路由出口 -->
    <template v-else>
      <router-view v-slot="{ Component, route }">
        <transition
          name="fade"
          mode="out-in"
        >
          <!--
            keep-alive 緩存控制：
            - 僅緩存 meta.keepAlive = true 的路由
            - 使用 include 精確控制緩存的白名單
            - 非緩存頁面（如詳情頁、編輯頁）每次進入重新創建
          -->
          <keep-alive :include="route.meta?.keepAlive ? [route.name as string] : []">
            <component :is="Component" :key="route.path" />
          </keep-alive>
        </transition>
      </router-view>
    </template>
  </div>
</template>

<style lang="scss">
/* ==================== 字體導入 ==================== */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Noto+Sans+TC:wght@400;500;700&family=Work+Sans:wght@400;600&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

/* ==================== CSS 變數 ==================== */
:root {
  --color-primary: #ac235a;
  --color-primary-light: #cc3e73;
  --color-primary-fixed: #ffb1c5;
  --color-on-primary: #ffffff;
  --color-on-primary-fixed: #3f001b;
  --color-on-primary-fixed-variant: #8e0245;
  --color-primary-container: #cc3e73;
  --color-secondary: #954361;
  --color-on-secondary: #ffffff;
  --color-secondary-container: #fd98b9;
  --color-on-secondary-container: #792c49;
  --color-tertiary: #7d4e5d;
  --color-on-tertiary: #ffffff;
  --color-tertiary-container: #996676;
  --color-on-tertiary-container: #fffbff;
  --color-error: #ba1a1a;
  --color-on-error: #ffffff;
  --color-error-container: #ffdad6;
  --color-on-error-container: #93000a;
  --color-background: #fbf9f8;
  --color-on-background: #1b1c1c;
  --color-surface: #fbf9f8;
  --color-on-surface: #1b1c1c;
  --color-surface-variant: #e4e2e2;
  --color-on-surface-variant: #574146;
  --color-outline: #8b7076;
  --color-outline-variant: #debfc5;
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #f5f3f3;
  --color-surface-container: #efeded;
  --color-surface-container-high: #e9e8e7;
  --color-surface-container-highest: #e4e2e2;
  --color-surface-bright: #fbf9f8;
  --color-surface-dim: #dbdad9;
  --color-inverse-surface: #303031;
  --color-inverse-on-surface: #f2f0f0;
  --color-inverse-primary: #ffb1c5;

  /* 字體家族 */
  --font-h1: 'Plus Jakarta Sans', 'Noto Sans TC', sans-serif;
  --font-h2: 'Plus Jakarta Sans', 'Noto Sans TC', sans-serif;
  --font-h3: 'Plus Jakarta Sans', 'Noto Sans TC', sans-serif;
  --font-body-lg: 'Work Sans', 'Noto Sans TC', sans-serif;
  --font-body-md: 'Work Sans', 'Noto Sans TC', sans-serif;
  --font-body-sm: 'Work Sans', 'Noto Sans TC', sans-serif;
  --font-label-md: 'Work Sans', 'Noto Sans TC', sans-serif;

  /* 字體大小 */
  --font-size-h1: 32px;
  --font-size-h2: 24px;
  --font-size-h3: 20px;
  --font-size-body-lg: 18px;
  --font-size-body-md: 16px;
  --font-size-body-sm: 14px;
  --font-size-label-md: 12px;

  /* 間距 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 40px;
  --spacing-gutter: 16px;
  --spacing-container-margin: 20px;

  /* 圓角 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}

/* ==================== 全域重置樣式 ==================== */

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-body-md);
  font-size: var(--font-size-body-md);
  line-height: 1.5;
  color: var(--color-on-surface);
  background-color: var(--color-surface);
}

#app {
  width: 100%;
  min-height: 100vh;
}

/* ==================== Material Icons 全域設定 ==================== */

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  vertical-align: middle;
  line-height: 1;
}

/* ==================== 滾動條樣式 ==================== */

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--color-outline-variant);
  border-radius: 3px;

  &:hover {
    background: var(--color-outline);
  }
}

/* ==================== 佈局容器 ==================== */

.app-layout {
  width: 100%;
  min-height: 100vh;
}

/* ==================== 路由切換動畫 ==================== */

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ==================== 錯誤邊界樣式 ==================== */

.app-error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: var(--color-surface);
}

.app-error__content {
  text-align: center;
  max-width: 400px;
}

.app-error__icon {
  font-size: 64px;
  color: var(--color-error);
  margin-bottom: 16px;
}

.app-error__title {
  font-family: var(--font-h2);
  font-size: var(--font-size-h2);
  color: var(--color-on-surface);
  margin-bottom: 8px;
}

.app-error__message {
  font-size: var(--font-size-body-md);
  color: var(--color-on-surface-variant);
  margin-bottom: 24px;
}

.app-error__btn {
  padding: 10px 24px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-body-md);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.9;
  }
}

/* ==================== Element Plus 全域覆蓋 ==================== */

.el-button--primary {
  --el-button-bg-color: var(--color-primary);
  --el-button-border-color: var(--color-primary);
  --el-button-hover-bg-color: var(--color-primary-light);
  --el-button-hover-border-color: var(--color-primary-light);
}

.el-dialog {
  --el-dialog-border-radius: 12px;
}

/* ==================== Vant 全域覆蓋 ==================== */

:root {
  --van-primary-color: var(--color-primary);
  --van-dialog-border-radius: 12px;
}
</style>
