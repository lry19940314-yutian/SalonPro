<!--
  SalonDialog.vue - 全局彈窗組件

  功能：
  1. 封裝 Element Plus / Vant 彈窗，提供統一樣式
  2. 支援確認對話框、表單彈窗、訊息提示
  3. 根據設備類型自動適配 UI 組件庫

  技術棧：Vue 3 Composition API + Element Plus / Vant
-->
<script setup lang="ts">
import { computed, watch } from 'vue'
import { useDevice } from '@/composables/useDevice'

const props = withDefaults(defineProps<{
  /** 彈窗標題 */
  title?: string
  /** 是否顯示彈窗 */
  visible: boolean
  /** 彈窗寬度 */
  width?: string | number
  /** 是否顯示取消按鈕 */
  showCancel?: boolean
  /** 確認按鈕文字 */
  confirmText?: string
  /** 取消按鈕文字 */
  cancelText?: string
  /** 是否為載入狀態 */
  loading?: boolean
  /** 是否點擊遮罩層關閉 */
  closeOnClickOverlay?: boolean
  /** 是否顯示關閉按鈕 */
  showClose?: boolean
  /** 彈窗類型：default（預設）| confirm（確認）| form（表單） */
  type?: 'default' | 'confirm' | 'form'
}>(), {
  title: '提示',
  visible: false,
  showCancel: true,
  confirmText: '確認',
  cancelText: '取消',
  loading: false,
  closeOnClickOverlay: false,
  showClose: true,
  type: 'default',
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'close'): void
}>()

const { isMobile } = useDevice()

/** 彈窗寬度（移動端適配） */
const dialogWidth = computed(() => {
  if (isMobile.value) return '92vw'
  return props.width || '520px'
})

/** 是否為全螢幕彈窗（移動端表單） */
const isFullScreen = computed(() => {
  return isMobile.value && props.type === 'form'
})

function handleConfirm(): void {
  emit('confirm')
}

function handleCancel(): void {
  emit('cancel')
  emit('update:visible', false)
}

function handleClose(): void {
  emit('close')
  emit('update:visible', false)
}

function handleOverlayClick(): void {
  if (props.closeOnClickOverlay) {
    handleClose()
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <!-- PC 端使用 Element Plus Dialog -->
  <el-dialog
    v-if="!isMobile"
    :model-value="visible"
    :title="title"
    :width="dialogWidth"
    :close-on-click-modal="closeOnClickOverlay"
    :show-close="showClose"
    :destroy-on-close="true"
    @update:model-value="handleClose"
    @close="handleClose"
  >
    <div class="salon-dialog__body">
      <slot />
    </div>

    <template v-if="type !== 'default'" #footer>
      <div class="salon-dialog__footer">
        <el-button
          v-if="showCancel"
          @click="handleCancel"
        >
          {{ cancelText }}
        </el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 移動端使用 Vant Dialog -->
  <van-dialog
    v-else
    :model-value="visible"
    :title="title"
    :show-cancel-button="showCancel"
    :confirm-button-text="confirmText"
    :cancel-button-text="cancelText"
    :close-on-click-overlay="closeOnClickOverlay"
    :before-close="(action: string) => {
      if (action === 'confirm') {
        handleConfirm()
        return false
      }
      handleCancel()
      return false
    }"
    @update:model-value="handleClose"
  >
    <div class="salon-dialog__body">
      <slot />
    </div>
  </van-dialog>
</template>

<style scoped lang="scss">
.salon-dialog__body {
  padding: 8px 0;
  min-height: 60px;
}

.salon-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
}
</style>
