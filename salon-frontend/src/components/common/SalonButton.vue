<!--
  SalonButton.vue - 全局按鈕組件

  功能：
  1. 封裝 Element Plus / Vant 按鈕，提供統一樣式
  2. 支援主要按鈕、次要按鈕、文字按鈕、危險按鈕
  3. 支援載入狀態、禁用狀態
  4. 根據設備類型自動適配 UI 組件庫

  技術棧：Vue 3 Composition API + Element Plus / Vant
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useDevice } from '@/composables/useDevice'

const props = withDefaults(defineProps<{
  /** 按鈕類型：primary（主要）| secondary（次要）| danger（危險）| text（文字） */
  type?: 'primary' | 'secondary' | 'danger' | 'text'
  /** 按鈕尺寸：large（大）| default（中）| small（小） */
  size?: 'large' | 'default' | 'small'
  /** 是否為載入狀態 */
  loading?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 是否為區塊按鈕（滿寬） */
  block?: boolean
  /** 圖示名稱（Material Icons） */
  icon?: string
  /** 原生按鈕類型 */
  nativeType?: 'button' | 'submit' | 'reset'
}>(), {
  type: 'primary',
  size: 'default',
  loading: false,
  disabled: false,
  block: false,
  nativeType: 'button',
})

const emit = defineEmits<{
  /** 點擊事件 */
  (e: 'click', event: MouseEvent): void
}>()

const { isMobile } = useDevice()

/** 根據設備類型決定按鈕樣式類別 */
const buttonClass = computed(() => {
  const classes = ['salon-btn']

  // 按鈕類型
  classes.push(`salon-btn--${props.type}`)

  // 按鈕尺寸
  classes.push(`salon-btn--${props.size}`)

  // 區塊按鈕
  if (props.block) {
    classes.push('salon-btn--block')
  }

  // 移動端樣式
  if (isMobile.value) {
    classes.push('salon-btn--mobile')
  }

  return classes
})

function handleClick(event: MouseEvent): void {
  if (!props.loading && !props.disabled) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :class="buttonClass"
    :disabled="disabled || loading"
    :type="nativeType"
    @click="handleClick"
  >
    <!-- 載入動畫 -->
    <span v-if="loading" class="salon-btn__loading">
      <span class="salon-btn__spinner" />
    </span>

    <!-- 圖示 -->
    <span v-if="icon && !loading" class="salon-btn__icon material-symbols-outlined">
      {{ icon }}
    </span>

    <!-- 文字內容 -->
    <span v-if="$slots.default" class="salon-btn__text">
      <slot />
    </span>
  </button>
</template>

<style scoped lang="scss">
.salon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
  border-radius: 8px;
  font-weight: 600;
  outline: none;
  position: relative;
  overflow: hidden;

  // 禁用狀態
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  // ===== 類型樣式 =====

  &--primary {
    background: linear-gradient(135deg, #ac235a, #cc3e73);
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(172, 35, 90, 0.25);

    &:hover:not(:disabled) {
      box-shadow: 0 6px 20px rgba(172, 35, 90, 0.35);
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(172, 35, 90, 0.2);
    }
  }

  &--secondary {
    background: #ffffff;
    color: #ac235a;
    border: 1.5px solid #debfc5;

    &:hover:not(:disabled) {
      border-color: #ac235a;
      background: #fff5f8;
    }
  }

  &--danger {
    background: linear-gradient(135deg, #ba1a1a, #e53935);
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(186, 26, 26, 0.25);

    &:hover:not(:disabled) {
      box-shadow: 0 6px 20px rgba(186, 26, 26, 0.35);
    }
  }

  &--text {
    background: transparent;
    color: #ac235a;
    box-shadow: none;

    &:hover:not(:disabled) {
      background: rgba(172, 35, 90, 0.08);
    }
  }

  // ===== 尺寸樣式 =====

  &--large {
    height: 56px;
    padding: 0 32px;
    font-size: 18px;
    border-radius: 28px;
  }

  &--default {
    height: 40px;
    padding: 0 20px;
    font-size: 14px;
  }

  &--small {
    height: 32px;
    padding: 0 12px;
    font-size: 13px;
    border-radius: 6px;
  }

  // ===== 區塊按鈕 =====

  &--block {
    width: 100%;
  }

  // ===== 移動端適配 =====

  &--mobile {
    &.salon-btn--large {
      height: 48px;
      font-size: 16px;
      border-radius: 24px;
    }

    &.salon-btn--default {
      height: 36px;
      font-size: 14px;
    }
  }
}

// 載入動畫
.salon-btn__loading {
  display: flex;
  align-items: center;
}

.salon-btn__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.salon-btn__icon {
  font-size: 20px;
  line-height: 1;
}

.salon-btn__text {
  line-height: 1;
}
</style>
