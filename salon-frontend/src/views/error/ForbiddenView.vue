<!--
  ForbiddenView.vue - 403 無權限 / 設備不相容頁面

  功能：
  1. 顯示無權限訪問提示
  2. 顯示設備不相容提示
  3. 提供返回首頁按鈕

  權限：公開（無需登入即可顯示錯誤訊息）
  設備：全部
-->
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

/** 從 query 中取得錯誤訊息 */
const errorMessage = (route.query.message as string) || '您沒有權限訪問此頁面'

/** 返回首頁 */
function goHome(): void {
  router.push('/dashboard')
}

/** 返回上一頁 */
function goBack(): void {
  router.back()
}
</script>

<template>
  <div class="forbidden-page">
    <div class="forbidden-container">
      <!-- 錯誤圖示 -->
      <div class="error-icon">
        <span class="icon-lock">🔒</span>
      </div>

      <!-- 錯誤碼 -->
      <h1 class="error-code">403</h1>

      <!-- 錯誤訊息 -->
      <p class="error-message">{{ errorMessage }}</p>

      <!-- 提示文字 -->
      <p class="error-hint">
        若您認為此為系統錯誤，請聯繫管理員協助處理
      </p>

      <!-- 操作按鈕 -->
      <div class="action-buttons">
        <button class="btn btn-primary" @click="goHome">
          返回首頁
        </button>
        <button class="btn btn-secondary" @click="goBack">
          返回上一頁
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.forbidden-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans TC', sans-serif;
}

.forbidden-container {
  text-align: center;
  padding: 48px 32px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  max-width: 420px;
  width: 90%;
}

.error-icon {
  margin-bottom: 16px;
}

.icon-lock {
  font-size: 64px;
  line-height: 1;
}

.error-code {
  font-size: 72px;
  font-weight: 800;
  color: #e74c3c;
  margin: 0 0 8px 0;
  line-height: 1;
  letter-spacing: -2px;
}

.error-message {
  font-size: 18px;
  color: #2c3e50;
  margin: 0 0 12px 0;
  font-weight: 600;
}

.error-hint {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #ecf0f1;
  color: #2c3e50;
}

.btn-secondary:hover {
  background: #dfe4e6;
  transform: translateY(-1px);
}
</style>
