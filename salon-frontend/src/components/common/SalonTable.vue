<!--
  SalonTable.vue - 全局表格組件（PC 端專用）

  功能：
  1. 封裝 Element Plus el-table，提供統一樣式
  2. 支援排序、選取、空狀態
  3. 支援自訂欄位模板
  4. 整合分頁組件

  技術棧：Vue 3 Composition API + Element Plus
-->
<script setup lang="ts">
import { computed } from 'vue'

interface TableColumn {
  /** 欄位鍵值 */
  prop: string
  /** 欄位標題 */
  label: string
  /** 欄位寬度 */
  width?: string | number
  /** 最小寬度 */
  minWidth?: string | number
  /** 是否可排序 */
  sortable?: boolean
  /** 是否固定：left | right */
  fixed?: 'left' | 'right'
  /** 自訂格式化函數 */
  formatter?: (row: any, column: any, cellValue: any, index: number) => string
  /** 對齊方式 */
  align?: 'left' | 'center' | 'right'
}

const props = withDefaults(defineProps<{
  /** 表格數據 */
  data: any[]
  /** 表格欄位配置 */
  columns: TableColumn[]
  /** 是否顯示邊框 */
  border?: boolean
  /** 是否顯示斑馬紋 */
  stripe?: boolean
  /** 是否為載入狀態 */
  loading?: boolean
  /** 是否可選取 */
  selectable?: boolean
  /** 最大高度 */
  maxHeight?: string | number
  /** 空狀態提示文字 */
  emptyText?: string
  /** 是否隱藏分頁 */
  hidePagination?: boolean
  /** 當前頁碼 */
  currentPage?: number
  /** 每頁筆數 */
  pageSize?: number
  /** 總筆數 */
  total?: number
}>(), {
  border: true,
  stripe: true,
  loading: false,
  selectable: false,
  emptyText: '暫無數據',
  hidePagination: false,
  currentPage: 1,
  pageSize: 20,
  total: 0,
})

const emit = defineEmits<{
  (e: 'selection-change', selection: any[]): void
  (e: 'page-change', page: number): void
  (e: 'page-size-change', size: number): void
  (e: 'row-click', row: any, column: any, event: Event): void
}>()

/** 分頁佈局配置 */
const paginationLayout = computed(() => {
  return 'total, sizes, prev, pager, next, jumper'
})

/** 每頁筆數選項 */
const pageSizeOptions = [10, 20, 50, 100]

function handleSelectionChange(selection: any[]): void {
  emit('selection-change', selection)
}

function handleCurrentChange(page: number): void {
  emit('page-change', page)
}

function handleSizeChange(size: number): void {
  emit('page-size-change', size)
}

function handleRowClick(row: any, column: any, event: Event): void {
  emit('row-click', row, column, event)
}
</script>

<template>
  <div class="salon-table-wrapper">
    <el-table
      :data="data"
      :border="border"
      :stripe="stripe"
      :loading="loading"
      :max-height="maxHeight"
      :empty-text="emptyText"
      style="width: 100%"
      @selection-change="handleSelectionChange"
      @row-click="handleRowClick"
    >
      <!-- 選取欄 -->
      <el-table-column
        v-if="selectable"
        type="selection"
        width="50"
        fixed="left"
        align="center"
      />

      <!-- 序號欄 -->
      <el-table-column
        type="index"
        label="#"
        width="60"
        align="center"
        fixed="left"
      />

      <!-- 動態欄位 -->
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        :sortable="col.sortable"
        :fixed="col.fixed"
        :formatter="col.formatter"
        :align="col.align || 'left'"
      >
        <template #default="{ row, column, $index }">
          <slot
            :name="col.prop"
            :row="row"
            :column="column"
            :index="$index"
          >
            {{ col.formatter ? col.formatter(row, column, row[col.prop], $index) : row[col.prop] }}
          </slot>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分頁 -->
    <div v-if="!hidePagination && total > 0" class="salon-table__pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizeOptions"
        :total="total"
        :layout="paginationLayout"
        background
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.salon-table-wrapper {
  width: 100%;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);

  // Element Plus 表格樣式覆蓋
  :deep(.el-table) {
    --el-table-border-color: #f0e6e8;
    --el-table-header-bg-color: #faf5f6;
    --el-table-row-hover-bg-color: #fff5f8;

    th.el-table__cell {
      font-weight: 600;
      color: #574146;
      background-color: #faf5f6;
    }

    .cell {
      color: #1b1c1c;
      font-size: 14px;
    }
  }
}

.salon-table__pagination {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #f0e6e8;
  background: #ffffff;
}
</style>
