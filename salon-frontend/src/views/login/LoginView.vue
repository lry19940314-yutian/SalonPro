<!--
  LoginView.vue - 登入頁面（PC / 移動端雙適配）

  功能：
  1. 支援客戶代碼 + 帳號 + 密碼登入（僅此三欄位）
  2. 表單驗證（必填、格式檢查）
  3. 記住此裝置功能（localStorage 持久化）
  4. 密碼顯示/隱藏切換
  5. 登入狀態持久化
  6. PC 端：毛玻璃卡片 + 背景圖
  7. 移動端：簡潔垂直佈局

  設計稿參考：
  - PC 端：docs/UI設計稿/登錄頁/登錄頁.html
  - 移動端：docs/UI設計稿/登錄頁/登錄頁-移動端.html

  技術棧：Vue 3 Composition API + TypeScript + SCSS
-->
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDevice } from '@/composables/useDevice'
import { loginApi } from '@/api/auth'
import type { LoginParams } from '@/types/api'
import SalonDialog from '@/components/common/SalonDialog.vue'

/**
 * 正規化 expiresIn 為絕對時間戳（秒）
 *
 * 後端可能返回兩種格式：
 * 1. 相對秒數（如 3600，表示 1 小時後過期）
 * 2. 絕對時間戳（如 1746427000）
 *
 * 若為相對秒數（小於 86400 秒，即 1 天），則轉換為絕對時間戳
 *
 * @param raw - 原始 expiresIn 值
 * @returns 絕對時間戳（秒），或 null
 */
function normalizeExpiresIn(raw: number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null
  if (raw <= 0) return null

  const ONE_DAY_IN_SECONDS = 86400
  // 若值小於 1 天，視為相對秒數，轉換為絕對時間戳
  if (raw < ONE_DAY_IN_SECONDS) {
    return Math.floor(Date.now() / 1000) + raw
  }
  // 否則視為絕對時間戳，直接使用
  return raw
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { isMobile } = useDevice()

// ==================== 表單狀態 ====================

/** 登入表單數據 */
const loginForm = reactive<LoginParams>({
  shopCode: '',
  username: '',
  password: '',
})

/** 表單驗證錯誤訊息 */
const formErrors = reactive<{
  shopCode: string
  username: string
  password: string
}>({
  shopCode: '',
  username: '',
  password: '',
})

/** 是否顯示密碼 */
const showPassword = ref(false)

/** 是否記住此裝置 */
const rememberDevice = ref(false)

/** 是否為載入狀態 */
const loading = ref(false)

/** 登入錯誤訊息 */
const loginError = ref('')

/** 錯誤彈窗顯示狀態 */
const showErrorDialog = ref(false)

/** 錯誤彈窗標題 */
const errorDialogTitle = ref('登入失敗')

/** 錯誤彈窗內容 */
const errorDialogMessage = ref('')

// ==================== 計算屬性 ====================

/** 表單是否有效 */
const isFormValid = computed(() => {
  return (
    loginForm.shopCode.trim() !== '' &&
    loginForm.username.trim() !== '' &&
    loginForm.password.trim() !== ''
  )
})

/** 背景圖片 URL（PC 端使用） */
const bgImageUrl = computed(() => {
  return 'https://lh3.googleusercontent.com/aida-public/AB6AXuARWgxPsCELFvsYDYSeRvSc-y28Bbd2I9cssRCb9VFhDxyfmpSzl3nGmglNmw2iAnuT4wT__cyYyLqHypnkw3MrI-LHdfeNTIswtQiMWGutpl_rO5C8ha3HPyQvQChxfaDOS6VZnWgSe-SZAuwAZVPYecVHDCA7EAsnDy1-5C8ao4YhPSey1I1gPCBfMPVDiusXJkspF2kGMbKRh5FtzWA2w1BCgZXGxqzzqmj2saKfzuCL0UlKFdpUbJY6SCUwjF7HKmsW7Uw4q1I'
})

// ==================== 方法 ====================

/**
 * 驗證表單欄位
 * @returns 是否通過驗證
 */
function validateForm(): boolean {
  let isValid = true
  const errors = { shopCode: '', username: '', password: '' }

  // 客戶代碼驗證
  if (!loginForm.shopCode.trim()) {
    errors.shopCode = '請輸入客戶代碼'
    isValid = false
  } else if (loginForm.shopCode.trim().length < 2) {
    errors.shopCode = '客戶代碼格式不正確'
    isValid = false
  }

  // 帳號驗證
  if (!loginForm.username.trim()) {
    errors.username = '請輸入員工帳號'
    isValid = false
  }

  // 密碼驗證
  if (!loginForm.password) {
    errors.password = '請輸入密碼'
    isValid = false
  } else if (loginForm.password.length < 6) {
    errors.password = '密碼長度至少 6 位'
    isValid = false
  }

  Object.assign(formErrors, errors)
  return isValid
}

/**
 * 清除指定欄位的驗證錯誤
 */
function clearFieldError(field: keyof typeof formErrors): void {
  formErrors[field] = ''
  loginError.value = ''
}

/**
 * 執行登入
 */
async function handleLogin(): Promise<void> {
  // 表單驗證
  if (!validateForm()) return

  loading.value = true
  loginError.value = ''

  try {
    // 調用登入 API
    // loginApi 返回後端 LoginResult 物件：{ accessToken, refreshToken, expiresIn, user }
    const loginResult = await loginApi({
      shopCode: loginForm.shopCode.trim(),
      username: loginForm.username.trim(),
      password: loginForm.password,
    })

    // 開發環境輸出調試日誌
    if (import.meta.env.DEV) {
      console.log('[登錄] API 響應:', loginResult)
    }

    const accessToken = loginResult.accessToken
    const refreshToken = loginResult.refreshToken
    const rawExpiresIn = loginResult.expiresIn
    const user = loginResult.user

    // 驗證必要字段
    if (!accessToken) {
      console.error('[登錄] 響應數據:', JSON.stringify(loginResult))
      throw new Error('登錄響應中缺少 accessToken')
    }

    // 將 expiresIn 轉換為絕對時間戳（秒）
    // 若後端返回的是相對秒數（如 3600），則轉換為當前時間 + 秒數
    // 若後端返回的是絕對時間戳，則直接使用
    const expiresIn = normalizeExpiresIn(rawExpiresIn)

    // 儲存登入狀態到 Pinia Store
    authStore.login({
      token: accessToken,
      refreshToken,
      expiresIn,
      user,
    })

    // 記住此裝置：儲存客戶代碼
    if (rememberDevice.value) {
      try {
        localStorage.setItem('salon_remembered_code', loginForm.shopCode.trim())
      } catch {
        // localStorage 不可用時忽略
      }
    } else {
      try {
        localStorage.removeItem('salon_remembered_code')
      } catch {
        // 忽略
      }
    }

    // 登入成功，跳轉至原始目標頁面或首頁
    // 注意：使用 router.push 而非 router.replace，
    // 避免因路由 redirect 鏈導致路由守衛重複觸發造成狀態不一致
    const redirect = (route.query.redirect as string) || '/info-center'
    router.push(redirect)
  } catch (error: any) {
    // 顯示錯誤訊息（同時顯示內聯提示和彈窗）
    const message = error.message || '登入失敗，請檢查帳號密碼'
    loginError.value = message

    // 根據錯誤類型設置彈窗標題和內容
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      if (status === 401) {
        errorDialogTitle.value = '認證失敗'
        errorDialogMessage.value = data?.message || '請先登錄'
      } else if (status === 422) {
        errorDialogTitle.value = '參數錯誤'
        errorDialogMessage.value = data?.message || '請檢查輸入的資料格式'
      } else if (status === 500) {
        errorDialogTitle.value = '伺服器錯誤'
        errorDialogMessage.value = data?.message || '伺服器內部錯誤，請稍後再試'
      } else {
        errorDialogTitle.value = '登入失敗'
        errorDialogMessage.value = data?.message || message
      }
    } else if (error.message) {
      errorDialogTitle.value = '登入失敗'
      errorDialogMessage.value = error.message
    } else {
      errorDialogTitle.value = '登入失敗'
      errorDialogMessage.value = '網路異常，請檢查連線後再試'
    }
    showErrorDialog.value = true
  } finally {
    loading.value = false
  }
}

/** 關閉錯誤彈窗 */
function closeErrorDialog(): void {
  showErrorDialog.value = false
}

// ==================== 生命週期 ====================

onMounted(() => {
  // 恢復記住的客戶代碼
  try {
    const rememberedCode = localStorage.getItem('salon_remembered_code')
    if (rememberedCode) {
      loginForm.shopCode = rememberedCode
      rememberDevice.value = true
    }
  } catch {
    // 忽略
  }
})
</script>

<template>
  <div class="login-view" :class="{ 'login-view--mobile': isMobile }">
    <!-- ===== PC 端：背景圖層 ===== -->
    <div v-if="!isMobile" class="login-view__bg">
      <img
        :src="bgImageUrl"
        alt="Salon Environment"
        class="login-view__bg-image"
      />
      <div class="login-view__bg-overlay" />
    </div>

    <!-- ===== 主要內容 ===== -->
    <main class="login-view__main">
      <!-- Logo 區域 -->
      <div class="login-view__header">
        <h1 class="login-view__brand">SayDou神美</h1>
        <p class="login-view__subtitle">www.saydou.com</p>
      </div>

      <!-- 登入卡片 -->
      <div class="login-view__card">
        <div class="login-view__card-header">
          <h2 class="login-view__title">歡迎回來</h2>
          <p class="login-view__desc">以專業與溫暖管理您的沙龍</p>
        </div>

        <!-- 登入表單 -->
        <form class="login-view__form" @submit.prevent="handleLogin">
          <!-- 全域錯誤訊息 -->
          <transition name="fade-slide">
            <div v-if="loginError" class="login-view__error">
              <span class="material-symbols-outlined login-view__error-icon">error</span>
              {{ loginError }}
            </div>
          </transition>

          <!-- 登入錯誤彈窗 -->
          <SalonDialog
            :visible="showErrorDialog"
            :title="errorDialogTitle"
            :show-cancel="false"
            confirm-text="知道了"
            @update:visible="closeErrorDialog"
            @confirm="closeErrorDialog"
          >
            <div class="login-error-dialog">
              <span class="material-symbols-outlined login-error-dialog__icon">error</span>
              <p class="login-error-dialog__message">{{ errorDialogMessage }}</p>
            </div>
          </SalonDialog>

          <!-- 客戶代碼 -->
          <div class="login-view__field">
            <label class="login-view__label">
              <span class="material-symbols-outlined login-view__label-icon">apartment</span>
              客戶代碼
            </label>
            <div class="login-view__input-wrapper">
              <input
                v-model="loginForm.shopCode"
                type="text"
                class="login-view__input"
                :class="{ 'login-view__input--error': formErrors.shopCode }"
                placeholder="請輸入您的客戶代碼"
                maxlength="20"
                autocomplete="off"
                @input="clearFieldError('shopCode')"
                @keyup.enter="handleLogin"
              />
            </div>
            <transition name="fade-slide">
              <p v-if="formErrors.shopCode" class="login-view__field-error">
                {{ formErrors.shopCode }}
              </p>
            </transition>
          </div>

          <!-- 帳號 -->
          <div class="login-view__field">
            <label class="login-view__label">
              <span class="material-symbols-outlined login-view__label-icon">person</span>
              帳號
            </label>
            <div class="login-view__input-wrapper">
              <input
                v-model="loginForm.username"
                type="text"
                class="login-view__input"
                :class="{ 'login-view__input--error': formErrors.username }"
                placeholder="請輸入您的員工帳號"
                maxlength="30"
                autocomplete="username"
                @input="clearFieldError('username')"
                @keyup.enter="handleLogin"
              />
            </div>
            <transition name="fade-slide">
              <p v-if="formErrors.username" class="login-view__field-error">
                {{ formErrors.username }}
              </p>
            </transition>
          </div>

          <!-- 密碼 -->
          <div class="login-view__field">
            <label class="login-view__label">
              <span class="material-symbols-outlined login-view__label-icon">lock</span>
              密碼
            </label>
            <div class="login-view__input-wrapper">
              <input
                v-model="loginForm.password"
                :type="showPassword ? 'text' : 'password'"
                class="login-view__input"
                :class="{ 'login-view__input--error': formErrors.password }"
                placeholder="請輸入密碼"
                maxlength="50"
                autocomplete="current-password"
                @input="clearFieldError('password')"
                @keyup.enter="handleLogin"
              />
              <button
                type="button"
                class="login-view__password-toggle"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? '隱藏密碼' : '顯示密碼'"
              >
                <span class="material-symbols-outlined">
                  {{ showPassword ? 'visibility' : 'visibility_off' }}
                </span>
              </button>
            </div>
            <transition name="fade-slide">
              <p v-if="formErrors.password" class="login-view__field-error">
                {{ formErrors.password }}
              </p>
            </transition>
          </div>

          <!-- 記住裝置 & 忘記密碼 -->
          <div class="login-view__options">
            <label class="login-view__remember">
              <input
                v-model="rememberDevice"
                type="checkbox"
                class="login-view__checkbox"
              />
              <span class="login-view__checkbox-custom" />
              <span class="login-view__remember-text">記住此裝置</span>
            </label>
            <a class="login-view__forgot" href="#">
              忘記密碼？
            </a>
          </div>

          <!-- 登入按鈕 -->
          <button
            type="submit"
            class="login-view__submit"
            :disabled="loading || !isFormValid"
          >
            <span v-if="loading" class="login-view__spinner" />
            <span v-else class="material-symbols-outlined login-view__submit-icon">login</span>
            {{ loading ? '登入中...' : '登入' }}
          </button>
        </form>

        <!-- 申請帳號連結 -->
        <div class="login-view__footer">
          <p class="login-view__footer-text">
            還沒有帳號嗎？
            <a class="login-view__footer-link" href="#">申請員工帳號</a>
          </p>
        </div>
      </div>
    </main>

    <!-- ===== PC 端：頁尾 ===== -->
    <footer v-if="!isMobile" class="login-view__footer-bar">
      <div class="login-view__footer-links">
        <a class="login-view__footer-link-item" href="#">隱私權政策</a>
        <a class="login-view__footer-link-item" href="#">服務條款</a>
        <a class="login-view__footer-link-item" href="#">幫助中心</a>
      </div>
      <p class="login-view__copyright">© 2024 SayDou. All rights reserved.</p>
    </footer>
  </div>
</template>

<style scoped lang="scss">
// ==================== 登入錯誤彈窗樣式 ====================
// ==================== 變數定義 ====================
$color-primary: #ac235a;
$color-primary-light: #cc3e73;
$color-on-surface: #1b1c1c;
$color-on-surface-variant: #574146;
$color-outline: #8b7076;
$color-outline-variant: #debfc5;
$color-surface: #fbf9f8;
$color-surface-container-lowest: #ffffff;
$color-error: #ba1a1a;
$color-white: #ffffff;
$color-white-90: rgba(255, 255, 255, 0.9);
$color-white-70: rgba(255, 255, 255, 0.7);
$color-white-60: rgba(255, 255, 255, 0.6);
$color-black-10: rgba(0, 0, 0, 0.1);

.login-error-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  text-align: center;
}

.login-error-dialog__icon {
  font-size: 48px;
  color: $color-error;
}

.login-error-dialog__message {
  font-size: 15px;
  color: $color-on-surface-variant;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

// ==================== 全域佈局 ====================

.login-view {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background: $color-surface;
  font-family: 'Work Sans', 'Noto Sans TC', sans-serif;
}

// ==================== PC 端背景 ====================

.login-view__bg {
  position: fixed;
  inset: 0;
  z-index: 0;

  &-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba($color-primary, 0.15), rgba($color-on-surface, 0.35));
  }
}

// ==================== 主要內容 ====================

.login-view__main {
  position: relative;
  z-index: 10;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

// ==================== Logo 區域 ====================

.login-view__header {
  text-align: center;
  margin-bottom: 24px;
}

.login-view__brand {
  font-family: 'Plus Jakarta Sans', 'Noto Sans TC', sans-serif;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  color: $color-white;
  letter-spacing: -0.02em;
  margin-bottom: 4px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.login-view__subtitle {
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.05em;
  color: $color-white-90;
  text-transform: uppercase;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

// ==================== 登入卡片 ====================

.login-view__card {
  width: 100%;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-view__card-header {
  text-align: center;
  margin-bottom: 24px;
}

.login-view__title {
  font-family: 'Plus Jakarta Sans', 'Noto Sans TC', sans-serif;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
  color: $color-primary;
  margin-bottom: 8px;
}

.login-view__desc {
  font-size: 16px;
  line-height: 1.5;
  color: $color-on-surface-variant;
}

// ==================== 表單 ====================

.login-view__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// 全域錯誤訊息
.login-view__error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 8px;
  color: $color-error;
  font-size: 14px;
  line-height: 1.4;

  &-icon {
    font-size: 18px;
    flex-shrink: 0;
  }
}

// 表單欄位
.login-view__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.login-view__label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.05em;
  color: $color-on-surface-variant;

  &-icon {
    font-size: 18px;
    color: $color-outline;
  }
}

.login-view__input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.login-view__input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  background: $color-surface-container-lowest;
  border: 1.5px solid $color-outline-variant;
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  color: $color-on-surface;
  outline: none;
  transition: all 0.2s ease;

  &::placeholder {
    color: $color-outline;
  }

  &:focus {
    border-color: $color-primary;
    box-shadow: 0 0 0 3px rgba($color-primary, 0.12);
  }

  &--error {
    border-color: $color-error;

    &:focus {
      box-shadow: 0 0 0 3px rgba($color-error, 0.12);
    }
  }
}

// 密碼切換按鈕
.login-view__password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: $color-outline;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    color: $color-primary;
    background: rgba($color-primary, 0.08);
  }

  .material-symbols-outlined {
    font-size: 20px;
  }
}

// 欄位錯誤訊息
.login-view__field-error {
  font-size: 12px;
  color: $color-error;
  padding: 0 4px;
  margin-top: 2px;
}

// ==================== 選項列 ====================

.login-view__options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 8px;
}

.login-view__remember {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.login-view__checkbox {
  display: none;
}

.login-view__checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid $color-outline-variant;
  border-radius: 4px;
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;

  .login-view__checkbox:checked + & {
    background: $color-primary;
    border-color: $color-primary;

    &::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 6px;
      width: 5px;
      height: 10px;
      border: solid $color-white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
  }
}

.login-view__remember-text {
  font-size: 14px;
  color: $color-on-surface-variant;
  transition: color 0.2s ease;

  .login-view__remember:hover & {
    color: $color-on-surface;
  }
}

.login-view__forgot {
  font-size: 14px;
  font-weight: 600;
  color: $color-primary;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    text-decoration: underline;
    opacity: 0.85;
  }
}

// ==================== 登入按鈕 ====================

.login-view__submit {
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, $color-primary, $color-primary-light);
  color: $color-white;
  border: none;
  border-radius: 28px;
  font-family: 'Plus Jakarta Sans', 'Noto Sans TC', sans-serif;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba($color-primary, 0.25);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover:not(:disabled) {
    box-shadow: 0 6px 20px rgba($color-primary, 0.35);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba($color-primary, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  &-icon {
    font-size: 22px;
  }
}

// 載入動畫
.login-view__spinner {
  width: 22px;
  height: 22px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: $color-white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ==================== 頁尾 ====================

.login-view__footer {
  text-align: center;
  margin-top: 24px;
}

.login-view__footer-text {
  font-size: 14px;
  color: $color-on-surface-variant;
}

.login-view__footer-link {
  color: $color-primary;
  font-weight: 600;
  text-decoration: none;
  margin-left: 4px;

  &:hover {
    text-decoration: underline;
  }
}

// PC 端底部導航列
.login-view__footer-bar {
  position: relative;
  z-index: 10;
  width: 100%;
  padding: 24px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.login-view__footer-links {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 8px;
}

.login-view__footer-link-item {
  font-size: 14px;
  color: $color-white-70;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: $color-white;
  }
}

.login-view__copyright {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: $color-white-60;
}

// ==================== 動畫 ====================

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

// ==================== 移動端適配 ====================

.login-view--mobile {
  background: linear-gradient(180deg, #fbf9f8 0%, #fff5f8 100%);

  .login-view__header {
    margin-bottom: 32px;
    margin-top: 20px;
  }

  .login-view__brand {
    font-size: 28px;
    color: $color-primary;
    text-shadow: none;
  }

  .login-view__subtitle {
    color: $color-outline;
    text-shadow: none;
  }

  .login-view__card {
    max-width: 100%;
    background: $color-surface-container-lowest;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    padding: 20px;
    border: 1px solid $color-outline-variant;
  }

  .login-view__title {
    font-size: 22px;
  }

  .login-view__desc {
    font-size: 14px;
  }

  .login-view__input {
    height: 44px;
    font-size: 15px;
  }

  .login-view__submit {
    height: 48px;
    font-size: 18px;
    border-radius: 24px;
  }

  .login-view__footer-bar {
    display: none;
  }
}

// ==================== 平板響應式 ====================

@media (min-width: 768px) and (max-width: 1024px) {
  .login-view__card {
    max-width: 420px;
    padding: 20px;
  }

  .login-view__brand {
    font-size: 28px;
  }

  .login-view__title {
    font-size: 22px;
  }
}
</style>
