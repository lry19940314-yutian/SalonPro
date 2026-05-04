<!--
  SalonStatusTag.vue - 全局狀態標籤組件

  功能：
  1. 顯示業務狀態標籤（預約狀態、訂單狀態、庫存狀態等）
  2. 支援自訂顏色映射
  3. 根據設備類型自動適配尺寸

  技術棧：Vue 3 Composition API
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useDevice } from '@/composables/useDevice'

/** 狀態類型映射 */
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  // ===== 預約狀態 =====
  pending: { label: '待確認', color: '#e6a23c', bg: '#fdf6ec' },
  confirmed: { label: '已確認', color: '#409eff', bg: '#ecf5ff' },
  in_progress: { label: '進行中', color: '#67c23a', bg: '#f0f9eb' },
  completed: { label: '已完成', color: '#67c23a', bg: '#f0f9eb' },
  cancelled: { label: '已取消', color: '#909399', bg: '#f4f4f5' },
  no_show: { label: '未到店', color: '#e74c3c', bg: '#fef0f0' },

  // ===== 庫存狀態 =====
  in_stock: { label: '庫存充足', color: '#67c23a', bg: '#f0f9eb' },
  low_stock: { label: '庫存不足', color: '#e6a23c', bg: '#fdf6ec' },
  out_of_stock: { label: '缺貨', color: '#e74c3c', bg: '#fef0f0' },

  // ===== 員工狀態 =====
  active: { label: '在職', color: '#67c23a', bg: '#f0f9eb' },
  inactive: { label: '離職', color: '#909399', bg: '#f4f4f5' },
  on_leave: { label: '請假中', color: '#e6a23c', bg: '#fdf6ec' },

  // ===== 通用狀態 =====
  enabled: { label: '啟用', color: '#67c23a', bg: '#f0f9eb' },
  disabled: { label: '停用', color: '#909399', bg: '#f4f4f5' },
  yes: { label: '是', color: '#67c23a', bg: '#f0f9eb' },
  no: { label: '否', color: '#909399', bg: '#f4f4f5' },
}

const props = withDefaults(defineProps<{
  /** 狀態值 */
  status: string
  /** 自訂顯示文字（覆蓋預設映射） */
  label?: string
  /** 自訂顏色（覆蓋預設映射） */
  color?: string
  /** 自訂背景色（覆蓋預設映射） */
  bgColor?: string
  /** 標籤尺寸：large | default | small */
  size?: 'large' | 'default' | 'small'
  /** 是否為空心樣式 */
  outline?: boolean
}>(), {
  size: 'default',
  outline: false,
})

const { isMobile } = useDevice()

/** 解析狀態樣式 */
const statusStyle = computed(() => {
  const preset = STATUS_MAP[props.status]

  return {
    label: props.label || preset?.label || props.status,
    color: props.color || preset?.color || '#909399',
    bg: props.bgColor || preset?.bg || '#f4f4f5',
  }
})

/** 標籤類別 */
const tagClass = computed(() => {
  const classes = ['salon-tag']

  classes.push(`salon-tag--${props.size}`)

  if (props.outline) {
    classes.push('salon-tag--outline')
  }

  if (isMobile.value) {
    classes.push('salon-tag--mobile')
  }

  return classes
})
</script>

<template>
  <span
    :class="tagClass"
    :style="{
      '--tag-color': statusStyle.color,
      '--tag-bg': statusStyle.bg,
    }"
  >
    <!-- 狀態指示點 -->
    <span v-if="!outline" class="salon-tag__dot" />
    {{ statusStyle.label }}
  </span>
</template>

<style scoped lang="scss">
.salon-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;
  color: var(--tag-color);
  background: var(--tag-bg);

  // 尺寸
  &--large {
    padding: 4px 14px;
    font-size: 14px;
    border-radius: 6px;
  }

  &--default {
    padding: 2px 10px;
    font-size: 12px;
  }

  &--small {
    padding: 1px 8px;
    font-size: 11px;
    border-radius: 3px;
  }

  // 空心樣式
  &--outline {
    background: transparent;
    border: 1px solid var(--tag-color);
  }

  // 移動端適配
  &--mobile {
    font-size: 11px;
    padding: 1px 8px;
  }
}

// 狀態指示點
.salon-tag__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tag-color);
  flex-shrink: 0;
}
</style>
