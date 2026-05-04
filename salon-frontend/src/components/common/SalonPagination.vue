<!--
  SalonPagination.vue - 全局分頁組件

  功能：
  1. 封裝 Element Plus / Vant 分頁，提供統一樣式
  2. 支援頁碼切換、每頁筆數切換
  3. 根據設備類型自動適配

  技術棧：Vue 3 Composition API + Element Plus / Vant
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useDevice } from '@/composables/useDevice'

const props = withDefaults(defineProps<{
  /** 當前頁碼 */
  currentPage: number
  /** 每頁筆數 */
  pageSize: number
  /** 總筆數 */
  total: number
  /** 每頁筆數選項 */
  pageSizes?: number[]
  /** 是否為載入狀態 */
  loading?: boolean
}>(), {
  currentPage: 1,
  pageSize: 20,
  total: 0,
  pageSizes: () => [10, 20, 50, 100],
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
  (e: 'update:pageSize', size: number): void
  (e: 'change', page: number, pageSize: number): void
}>()

const { isMobile } = useDevice()

/** 總頁數 */
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(props.total / props.pageSize))
})

/** 是否顯示分頁 */
const showPagination = computed(() => {
  return props.total > 0 && props.total > props.pageSize
})

/** 分頁按鈕列表（移動端簡化） */
const pageButtons = computed(() => {
  const pages: (number | string)[] = []
  const current = props.currentPage
  const total = totalPages.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i)
    }
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }

  return pages
})

function handlePageChange(page: number): void {
  if (page < 1 || page > totalPages.value || page === props.currentPage) return
  emit('update:currentPage', page)
  emit('change', page, props.pageSize)
}

function handlePrev(): void {
  handlePageChange(props.currentPage - 1)
}

function handleNext(): void {
  handlePageChange(props.currentPage + 1)
}

function handleSizeChange(size: number): void {
  emit('update:pageSize', size)
  emit('change', 1, size)
}
</script>

<template>
  <div v-if="showPagination" class="salon-pagination">
    <!-- PC 端使用 Element Plus Pagination -->
    <template v-if="!isMobile">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizes"
        :total="total"
        :disabled="loading"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @current-change="(page: number) => handlePageChange(page)"
        @size-change="handleSizeChange"
      />
    </template>

    <!-- 移動端簡化分頁 -->
    <template v-else>
      <div class="salon-pagination__mobile">
        <span class="salon-pagination__info">
          共 {{ total }} 筆
        </span>

        <div class="salon-pagination__controls">
          <button
            class="salon-pagination__btn"
            :disabled="currentPage <= 1 || loading"
            @click="handlePrev"
          >
            <span class="material-symbols-outlined">chevron_left</span>
          </button>

          <span class="salon-pagination__current">{{ currentPage }} / {{ totalPages }}</span>

          <button
            class="salon-pagination__btn"
            :disabled="currentPage >= totalPages || loading"
            @click="handleNext"
          >
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.salon-pagination {
  display: flex;
  justify-content: center;
  padding: 16px 0;

  :deep(.el-pagination) {
    --el-pagination-button-color: #574146;
    --el-pagination-hover-color: #ac235a;
    --el-pagination-button-bg-color: #ffffff;

    .el-pager li {
      border-radius: 6px;

      &.is-active {
        background-color: #ac235a;
        color: #ffffff;
      }
    }
  }

  &__mobile {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0 16px;
  }

  &__info {
    font-size: 13px;
    color: #8b7076;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid #debfc5;
    border-radius: 8px;
    background: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #574146;

    &:hover:not(:disabled) {
      border-color: #ac235a;
      color: #ac235a;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__current {
    font-size: 14px;
    font-weight: 600;
    color: #1b1c1c;
    min-width: 60px;
    text-align: center;
  }
}
</style>
