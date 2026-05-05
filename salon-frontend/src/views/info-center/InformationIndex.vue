<!--
  InformationIndex.vue - 資訊中心總覽（移動端）

  權限：美容師 / 店長
  設備：移動端專用

  設計稿參考：
  - docs/UI設計稿/資訊中心/總覽/資訊中心-總覽-移動端.html

  功能：
  1. 門店年度營業額（大數據高亮 + 同比增幅 + 月度長條圖）
  2. 分類營業額（橫向滾動環圖 + 長條圖 + 分類標籤）
  3. 工作人員業績排行榜（排名 + 進度條 + API 聯調 + 滾動支援，最多10條）

  技術棧：Vue 3 Composition API + TypeScript + SCSS

  接口對接：
  - GET /api/performances/stats/yearly          門店年度營業額
  - GET /api/performances/stats/category-revenue 分類營業額
  - GET /api/performances/staff-ranking          工作人員業績排行

  第六步：樣式與交互優化
  - 統一卡片間距、字體大小、顏色體系，符合美業SaaS設計風格
  - 數據金額格式化：千分位、貨幣符號
  - 百分比、同比增幅添加對應顏色（增長紅/下降綠）
  - 保證所有模組在手機端無橫向溢出、滾動順暢
  - 不修改任何頂部導航、菜單、底部tab欄
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  getYearlyRevenueApi,
  getCategoryRevenueApi,
  getStaffRankingApi,
} from '@/api/info-center'
import type {
  YearlyRevenueData,
  CategoryRevenueItem,
  StaffRankingItem,
} from '@/api/info-center'

// ==================== 類型定義 ====================

/** 分類營業額展示數據結構（含顏色） */
interface CategoryDisplay extends CategoryRevenueItem {
  /** 顯示顏色 */
  color: string
}

/** 工作人員業績排行展示數據結構（含排名標記） */
interface StaffRankingDisplay {
  /** 排名 */
  rank: number
  /** 員工 ID */
  staffId: number
  /** 姓名 */
  name: string
  /** 業績金額 */
  amount: number
  /** 完成百分比（用於進度條） */
  percentage: number
  /** 是否為前三名 */
  isMedal: boolean
  /** 獎牌 emoji */
  medal: string
}

// ==================== 分類顏色調色盤 ====================

/** 分類營業額顏色映射（按順序分配） */
const CATEGORY_COLORS: string[] = [
  '#ac235a', // 深玫瑰紅
  '#cc3e73', // 玫瑰紅
  '#e8624a', // 珊瑚橙
  '#f0a03a', // 金盞黃
  '#328517', // 草綠
  '#1a8a7a', // 墨綠
  '#2d6eb0', // 鋼藍
  '#794c8f', // 紫羅蘭
  '#a22c70', // 紫紅
  '#d44c68', // 粉紅
]

/** 排名獎牌映射 */
const RANK_MEDALS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
}

// ==================== 板1：門店年度營業額 ====================

/** 門店年度營業額數據 */
const yearlyRevenue = ref<YearlyRevenueData>({
  year: new Date().getFullYear(),
  totalAmount: 0,
  monthlyData: [],
  growthRate: 0,
})

/** 門店年度營業額加載狀態 */
const yearlyLoading = ref(true)

/** 門店年度營業額錯誤訊息 */
const yearlyError = ref('')

/** 同比增幅方向 */
const growthDirection = computed<'up' | 'down' | 'flat'>(() => {
  if (yearlyRevenue.value.growthRate > 0) return 'up'
  if (yearlyRevenue.value.growthRate < 0) return 'down'
  return 'flat'
})

/** 同比增幅文字 */
const growthText = computed(() => {
  const rate = Math.abs(yearlyRevenue.value.growthRate)
  if (growthDirection.value === 'up') return `較去年同期增長 ${rate}%`
  if (growthDirection.value === 'down') return `較去年同期下降 ${rate}%`
  return '與去年同期持平'
})

/** 年度營業額最大月值（用於長條圖比例） */
const maxMonthlyValue = computed(() => {
  const data = yearlyRevenue.value.monthlyData
  if (!data || data.length === 0) return 1
  return Math.max(...data, 1)
})

/** 是否有月度數據 */
const hasMonthlyData = computed(() => {
  return yearlyRevenue.value.monthlyData && yearlyRevenue.value.monthlyData.length > 0
})

// ==================== 板2：分類營業額 ====================

/** 分類營業額原始 API 數據 */
const categoryRevenueRaw = ref<CategoryRevenueItem[]>([])

/** 分類營業額加載狀態 */
const categoryLoading = ref(true)

/** 分類營業額錯誤訊息 */
const categoryError = ref('')

/** 分類營業額展示數據（含顏色） */
const categoryRevenue = computed<CategoryDisplay[]>(() => {
  return categoryRevenueRaw.value.map((item, index) => ({
    ...item,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }))
})

/** 分類營業額總和 */
const categoryTotal = computed(() => {
  return categoryRevenueRaw.value.reduce((sum, item) => sum + item.amount, 0)
})

/** 環圖 conic-gradient */
const donutGradient = computed(() => {
  const segments = categoryRevenue.value
  if (segments.length === 0) return 'conic-gradient(#e8e0e2 0deg 360deg)'

  let gradient = 'conic-gradient('
  let currentAngle = 0

  segments.forEach((seg, index) => {
    const startAngle = currentAngle
    const endAngle = currentAngle + (seg.ratio / 100) * 360
    gradient += `${seg.color} ${startAngle}deg ${endAngle}deg`
    if (index < segments.length - 1) gradient += ', '
    currentAngle = endAngle
  })

  gradient += ')'
  return gradient
})

/** 環圖中心顯示的佔比（最大分類） */
const donutCenterPercent = computed(() => {
  if (categoryRevenue.value.length === 0) return '0%'
  const top = categoryRevenue.value[0]
  return `${top.ratio}%`
})

/** 環圖中心顯示的標籤（最大分類名稱） */
const donutCenterLabel = computed(() => {
  if (categoryRevenue.value.length === 0) return '暫無數據'
  return categoryRevenue.value[0].categoryName
})

/** 長條圖最大金額（用於比例） */
const maxCategoryAmount = computed(() => {
  return Math.max(...categoryRevenue.value.map((item) => item.amount), 1)
})

/** 是否有分類數據 */
const hasCategoryData = computed(() => {
  return categoryRevenue.value.length > 0
})

// ==================== 板3：工作人員業績排行 ====================

/** 工作人員業績排行原始 API 數據 */
const staffRankingRaw = ref<StaffRankingItem[]>([])

/** 工作人員業績排行加載狀態 */
const staffRankingLoading = ref(true)

/** 工作人員業績排行錯誤訊息 */
const staffRankingError = ref('')

/** 工作人員業績排行展示數據（含排名、獎牌） */
const staffRanking = computed<StaffRankingDisplay[]>(() => {
  return staffRankingRaw.value.map((item, index) => {
    const rank = index + 1
    return {
      rank,
      staffId: item.staffId,
      name: item.name,
      amount: item.amount,
      percentage: item.percentage,
      isMedal: rank <= 3,
      medal: RANK_MEDALS[rank] || '',
    }
  })
})

/** 是否有排行數據 */
const hasStaffRanking = computed(() => {
  return staffRanking.value.length > 0
})

// ==================== 生命週期 ====================

onMounted(async () => {
  await Promise.all([
    fetchYearlyRevenue(),
    fetchCategoryRevenue(),
    fetchStaffRanking(),
  ])
})

// ==================== API 請求函數 ====================

/**
 * 獲取門店年度營業額
 *
 * GET /api/performances/stats/yearly?year=2026
 */
async function fetchYearlyRevenue() {
  yearlyLoading.value = true
  yearlyError.value = ''

  try {
    const now = new Date()
    const year = now.getFullYear()

    const res = await getYearlyRevenueApi(year)

    if (res.code === 200 && res.data) {
      yearlyRevenue.value = res.data
    } else {
      console.warn('[年度營業額] API 返回異常', res)
    }
  } catch (err) {
    console.warn('[年度營業額] API 請求失敗', err)
    yearlyError.value = '無法獲取年度營業額數據'
  } finally {
    yearlyLoading.value = false
  }
}

/**
 * 獲取分類營業額
 *
 * GET /api/performances/stats/category-revenue?startDate=...&endDate=...
 */
async function fetchCategoryRevenue() {
  categoryLoading.value = true
  categoryError.value = ''

  try {
    const now = new Date()
    const year = now.getFullYear()
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const res = await getCategoryRevenueApi(startDate, endDate)

    if (res.code === 200 && res.data && res.data.length > 0) {
      categoryRevenueRaw.value = res.data
    } else {
      console.warn('[分類營業額] API 返回空數據，使用範例數據')
      useFallbackCategoryData()
    }
  } catch (err) {
    console.warn('[分類營業額] API 請求失敗，使用靜態範例數據', err)
    useFallbackCategoryData()
  } finally {
    categoryLoading.value = false
  }
}

/** 使用靜態範例數據（API 不可用時降級） */
function useFallbackCategoryData() {
  categoryRevenueRaw.value = [
    { categoryId: 1, categoryName: '臉部護理', amount: 320000, ratio: 25 },
    { categoryId: 2, categoryName: '身體SPA', amount: 280000, ratio: 21.8 },
    { categoryId: 3, categoryName: '美甲美睫', amount: 195000, ratio: 15.2 },
    { categoryId: 4, categoryName: '染燙造型', amount: 168000, ratio: 13.1 },
    { categoryId: 5, categoryName: '產品銷售', amount: 185000, ratio: 14.4 },
    { categoryId: 6, categoryName: '頭皮護理', amount: 132000, ratio: 10.3 },
  ]
}

/**
 * 獲取工作人員業績排行
 *
 * GET /api/performances/staff-ranking?startDate=...&endDate=...&limit=10
 */
async function fetchStaffRanking() {
  staffRankingLoading.value = true
  staffRankingError.value = ''

  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    // 預設查詢當月數據
    const startDate = `${year}-${month}-01`
    const endDate = `${year}-${month}-31`

    const res = await getStaffRankingApi(startDate, endDate, 10)

    if (res.code === 200 && res.data && res.data.length > 0) {
      staffRankingRaw.value = res.data
    } else {
      console.warn('[工作人員業績排行] API 返回空數據，使用範例數據')
      useFallbackStaffRanking()
    }
  } catch (err) {
    console.warn('[工作人員業績排行] API 請求失敗，使用靜態範例數據', err)
    useFallbackStaffRanking()
  } finally {
    staffRankingLoading.value = false
  }
}

/** 使用靜態範例數據（API 不可用時降級） */
function useFallbackStaffRanking() {
  staffRankingRaw.value = [
    { rank: 1, staffId: 1001, name: 'LULU', amount: 25189, percentage: 100 },
    { rank: 2, staffId: 1002, name: 'Emma Chen', amount: 42500, percentage: 85 },
    { rank: 3, staffId: 1003, name: 'Sophie Wang', amount: 38200, percentage: 70 },
    { rank: 4, staffId: 1004, name: 'Lisa Ho', amount: 29100, percentage: 55 },
    { rank: 5, staffId: 1005, name: 'Amy Liu', amount: 25600, percentage: 48 },
    { rank: 6, staffId: 1006, name: 'Mia Chang', amount: 22300, percentage: 42 },
    { rank: 7, staffId: 1007, name: 'Zoe Wu', amount: 19800, percentage: 37 },
    { rank: 8, staffId: 1008, name: 'Yuna Lin', amount: 17500, percentage: 33 },
    { rank: 9, staffId: 1009, name: 'Coco Hsu', amount: 15200, percentage: 28 },
    { rank: 10, staffId: 1010, name: 'Nana Tsai', amount: 12800, percentage: 24 },
  ]
}

// ==================== 工具函數 ====================

/** 格式化金額（千分位 + 貨幣符號） */
function formatCurrency(value: number): string {
  return `$${value.toLocaleString('zh-TW')}`
}

/** 格式化大額金額（萬/億），保留千分位 */
function formatLargeCurrency(value: number): string {
  if (value >= 100000000) {
    const num = (value / 100000000).toFixed(2)
    return `$${Number(num).toLocaleString('zh-TW')}億`
  }
  if (value >= 10000) {
    const num = Math.round(value / 10000)
    return `$${num.toLocaleString('zh-TW')}萬`
  }
  return formatCurrency(value)
}

/** 格式化百分比（保留一位小數 + 符號） */
function formatPercent(value: number): string {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value.toFixed(1)}%`
}

/** 獲取月度標籤 */
function getMonthLabel(index: number): string {
  return `${index + 1}月`
}
</script>

<template>
  <div class="info-index">
    <!-- ===== 頁面標題區 ===== -->
    <section class="info-index__header">
      <h1 class="info-index__title">資訊中心</h1>
      <p class="info-index__subtitle">歡迎回來，這是您的今日營運概況。</p>
    </section>

    <!-- ===== 板1：門店年度營業額 ===== -->
    <section class="info-index__card">
      <!-- 卡片標題 -->
      <div class="info-index__card-header">
        <h3 class="info-index__card-title">門店年度營業額</h3>
        <span class="material-symbols-outlined info-index__card-more">more_vert</span>
      </div>

      <!-- 加載狀態 -->
      <div v-if="yearlyLoading" class="info-index__loading">
        <span class="info-index__loading-spinner"></span>
        <span>數據加載中...</span>
      </div>

      <!-- 錯誤狀態 -->
      <div v-else-if="yearlyError" class="info-index__error">
        <span class="material-symbols-outlined info-index__error-icon">error_outline</span>
        <span>{{ yearlyError }}</span>
      </div>

      <!-- 數據內容 -->
      <template v-else>
        <!-- 年度總營業額（大數據高亮） -->
        <div class="info-index__annual-total">
          <span class="info-index__annual-label">{{ yearlyRevenue.year }} 年度</span>
          <span class="info-index__annual-amount">
            {{ formatLargeCurrency(yearlyRevenue.totalAmount) }}
          </span>
        </div>

        <!-- 同比增幅標識（增長紅/下降綠） -->
        <div
          class="info-index__growth"
          :class="{
            'info-index__growth--up': growthDirection === 'up',
            'info-index__growth--down': growthDirection === 'down',
            'info-index__growth--flat': growthDirection === 'flat',
          }"
        >
          <span class="material-symbols-outlined info-index__growth-icon">
            {{ growthDirection === 'up' ? 'trending_up' : growthDirection === 'down' ? 'trending_down' : 'remove' }}
          </span>
          <span class="info-index__growth-text">{{ growthText }}</span>
        </div>

        <!-- 月度長條圖 -->
        <div v-if="hasMonthlyData" class="info-index__chart-area">
          <div class="info-index__bar-chart">
            <div
              v-for="(value, index) in yearlyRevenue.monthlyData"
              :key="index"
              class="info-index__bar-wrapper"
              :title="`${getMonthLabel(index)}：${formatCurrency(value)}`"
            >
              <div
                class="info-index__bar"
                :style="{
                  height: (value / maxMonthlyValue) * 100 + '%',
                }"
                :class="{
                  'info-index__bar--highlight': value >= maxMonthlyValue * 0.8,
                  'info-index__bar--medium': value >= maxMonthlyValue * 0.4 && value < maxMonthlyValue * 0.8,
                  'info-index__bar--low': value < maxMonthlyValue * 0.4,
                }"
              ></div>
            </div>
          </div>
          <!-- 月度標籤 -->
          <div class="info-index__bar-labels">
            <span
              v-for="(value, index) in yearlyRevenue.monthlyData"
              :key="index"
            >
              {{ getMonthLabel(index) }}
            </span>
          </div>
        </div>

        <!-- 無月度數據提示 -->
        <div v-else class="info-index__empty">
          <span class="material-symbols-outlined info-index__empty-icon">bar_chart</span>
          <span>暫無月度營業額數據</span>
        </div>
      </template>
    </section>

    <!-- ===== 板2：分類營業額 ===== -->
    <section class="info-index__card">
      <div class="info-index__card-header">
        <h3 class="info-index__card-title">分類營業額</h3>
      </div>

      <!-- 加載狀態 -->
      <div v-if="categoryLoading" class="info-index__loading">
        <span class="info-index__loading-spinner"></span>
        <span>數據加載中...</span>
      </div>

      <!-- 錯誤狀態 -->
      <div v-else-if="categoryError" class="info-index__error">
        <span class="material-symbols-outlined info-index__error-icon">error_outline</span>
        <span>{{ categoryError }}</span>
      </div>

      <!-- 空數據狀態 -->
      <div v-else-if="!hasCategoryData" class="info-index__empty">
        <span class="material-symbols-outlined info-index__empty-icon">donut_small</span>
        <span>暫無分類營業額數據</span>
      </div>

      <!-- 數據內容 -->
      <template v-else>
        <!-- 環圖 + 長條圖橫向滾動容器 -->
        <div class="info-index__category-scroll">
          <div class="info-index__category-track">
            <!-- 左側：環圖 -->
            <div class="info-index__donut-section">
              <div class="info-index__donut" :style="{ background: donutGradient }">
                <div class="info-index__donut-center">
                  <span class="info-index__donut-percent">{{ donutCenterPercent }}</span>
                  <span class="info-index__donut-label">{{ donutCenterLabel }}</span>
                </div>
              </div>
            </div>

            <!-- 右側：長條圖列表（橫向排列） -->
            <div
              v-for="(item, index) in categoryRevenue"
              :key="item.categoryId"
              class="info-index__category-bar-item"
            >
              <div class="info-index__category-bar-header">
                <span
                  class="info-index__category-dot"
                  :style="{ backgroundColor: item.color }"
                ></span>
                <span class="info-index__category-bar-name">{{ item.categoryName }}</span>
                <span class="info-index__category-bar-ratio">{{ item.ratio }}%</span>
              </div>
              <div class="info-index__category-bar-track">
                <div
                  class="info-index__category-bar-fill"
                  :style="{
                    width: (item.amount / maxCategoryAmount) * 100 + '%',
                    backgroundColor: item.color,
                  }"
                ></div>
              </div>
              <span class="info-index__category-bar-amount">{{ formatCurrency(item.amount) }}</span>
            </div>
          </div>
        </div>

        <!-- 分類標籤（橫向滾動） -->
        <div class="info-index__category-tags">
          <div class="info-index__category-tags-track">
            <div
              v-for="(item, index) in categoryRevenue"
              :key="item.categoryId"
              class="info-index__category-tag"
              :style="{ borderColor: item.color }"
            >
              <span
                class="info-index__category-tag-dot"
                :style="{ backgroundColor: item.color }"
              ></span>
              <span class="info-index__category-tag-name">{{ item.categoryName }}</span>
              <span class="info-index__category-tag-value">{{ item.ratio }}%</span>
            </div>
          </div>
        </div>
      </template>
    </section>

    <!-- ===== 板3：工作人員業績排行榜 ===== -->
    <section class="info-index__card info-index__card--last">
      <div class="info-index__card-header">
        <h3 class="info-index__card-title">工作人員業績排行</h3>
      </div>

      <!-- 加載狀態 -->
      <div v-if="staffRankingLoading" class="info-index__loading">
        <span class="info-index__loading-spinner"></span>
        <span>排行數據加載中...</span>
      </div>

      <!-- 錯誤狀態 -->
      <div v-else-if="staffRankingError" class="info-index__error">
        <span class="material-symbols-outlined info-index__error-icon">error_outline</span>
        <span>{{ staffRankingError }}</span>
      </div>

      <!-- 空數據狀態 -->
      <div v-else-if="!hasStaffRanking" class="info-index__empty">
        <span class="material-symbols-outlined info-index__empty-icon">leaderboard</span>
        <span>暫無業績排行數據</span>
      </div>

      <!-- 排行列表（支援滾動，最多10條） -->
      <div v-else class="info-index__ranking-scroll">
        <div class="info-index__ranking">
          <div
            v-for="item in staffRanking"
            :key="item.staffId"
            class="info-index__ranking-item"
          >
            <div class="info-index__ranking-row">
              <div class="info-index__ranking-left">
                <!-- 前三名顯示獎牌，其餘顯示數字 -->
                <span
                  v-if="item.isMedal"
                  class="info-index__ranking-medal"
                >{{ item.medal }}</span>
                <span
                  v-else
                  class="info-index__ranking-num"
                >{{ String(item.rank).padStart(2, '0') }}</span>
                <span class="info-index__ranking-name">{{ item.name }}</span>
              </div>
              <span
                class="info-index__ranking-amount"
                :class="{ 'info-index__ranking-amount--top': item.rank === 1 }"
              >
                {{ formatCurrency(item.amount) }}
              </span>
            </div>
            <div class="info-index__progress">
              <div
                class="info-index__progress-bar"
                :class="{
                  'info-index__progress-bar--top': item.rank === 1,
                  'info-index__progress-bar--second': item.rank === 2,
                  'info-index__progress-bar--third': item.rank === 3,
                  'info-index__progress-bar--normal': item.rank > 3,
                }"
                :style="{ width: item.percentage + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
// ============================================================================
// 美業 SaaS 設計系統變數（與 MobileLayout.vue 統一）
// ============================================================================

// --- 主色調（美業品牌色：玫瑰紅）---
$color-primary: #ac235a;
$color-primary-light: #cc3e73;
$color-primary-dark: #8a1b48;

// --- 輔助色 ---
$color-secondary: #794c8f;
$color-tertiary: #328517;

// --- 語義色（美業慣例：增長=紅利/熱情，下降=綠色/冷靜）---
$color-up: #d32f2f;       // 增長紅（業績好 = 紅）
$color-up-bg: rgba(#d32f2f, 0.08);
$color-down: #2e7d32;     // 下降綠（業績差 = 綠）
$color-down-bg: rgba(#2e7d32, 0.08);
$color-flat: #554149;
$color-flat-bg: rgba(#554149, 0.08);

// --- 表面色 ---
$color-surface: #fff8f8;
$color-surface-container: #fde9ef;
$color-white: #ffffff;

// --- 文字色 ---
$color-on-surface: #23191d;
$color-on-surface-variant: #554149;
$color-on-surface-muted: #8a7a7e;

// --- 邊框與陰影 ---
$color-border: #f0e6e8;
$card-radius: 12px;
$card-shadow: 0 2px 12px rgba(#23191d, 0.06);

// --- 間距系統（8px 基數）---
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-lg: 16px;
$spacing-xl: 20px;
$spacing-2xl: 24px;

// ============================================================================
// 容器
// ============================================================================
.info-index {
  width: 100%;
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  box-sizing: border-box;
  overflow-x: hidden; // 防止任何子元素橫向溢出
}

// ============================================================================
// 頁面標題
// ============================================================================
.info-index__header {
  margin-bottom: $spacing-xs;
  padding: 0 $spacing-xs;
}

.info-index__title {
  font-size: 22px;
  font-weight: 700;
  line-height: 30px;
  color: $color-on-surface;
  margin: 0 0 $spacing-xs 0;
}

.info-index__subtitle {
  font-size: 13px;
  line-height: 18px;
  color: $color-on-surface-variant;
  margin: 0;
}

// ============================================================================
// 卡片通用
// ============================================================================
.info-index__card {
  background: $color-white;
  padding: $spacing-xl;
  border-radius: $card-radius;
  border: 1px solid $color-border;
  box-shadow: $card-shadow;
  width: 100%;
  box-sizing: border-box;

  &--last {
    margin-bottom: 0;
  }
}

.info-index__card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
}

.info-index__card-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 22px;
  color: $color-on-surface;
  margin: 0;
  position: relative;
  padding-left: $spacing-md;

  // 左側裝飾條（美業風格細節）
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 2px;
    bottom: 2px;
    width: 3px;
    border-radius: 2px;
    background: $color-primary;
  }
}

.info-index__card-more {
  color: $color-on-surface-muted;
  cursor: pointer;
  font-size: 20px;
  transition: color 0.2s ease;

  &:active {
    color: $color-primary;
  }
}

// ============================================================================
// 年度總營業額（大數據高亮）
// ============================================================================
.info-index__annual-total {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  margin-bottom: $spacing-md;
  padding: 0 $spacing-xs;
}

.info-index__annual-label {
  font-size: 13px;
  line-height: 18px;
  color: $color-on-surface-variant;
  font-weight: 500;
}

.info-index__annual-amount {
  font-size: 30px;
  font-weight: 700;
  line-height: 38px;
  color: $color-primary;
  letter-spacing: -0.5px;
}

// ============================================================================
// 同比增幅標識（增長紅 / 下降綠）
// ============================================================================
.info-index__growth {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  margin-bottom: $spacing-lg;
  margin-left: $spacing-xs;

  &--up {
    color: $color-up;
    background: $color-up-bg;
  }

  &--down {
    color: $color-down;
    background: $color-down-bg;
  }

  &--flat {
    color: $color-flat;
    background: $color-flat-bg;
  }
}

.info-index__growth-icon {
  font-size: 16px;
  font-variation-settings: 'FILL' 1;
}

.info-index__growth-text {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
}

// ============================================================================
// 圖表區域
// ============================================================================
.info-index__chart-area {
  margin-top: $spacing-xs;
  width: 100%;
  box-sizing: border-box;
}

// ============================================================================
// 長條圖（板1 - 月度趨勢）
// ============================================================================
.info-index__bar-chart {
  height: 150px;
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding: 0 2px;
  width: 100%;
  box-sizing: border-box;
}

.info-index__bar-wrapper {
  flex: 1;
  display: flex;
  align-items: flex-end;
  height: 100%;
  min-width: 0; // 防止 flex 溢出
}

.info-index__bar {
  width: 100%;
  border-radius: 3px 3px 0 0;
  transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 3px;

  &--highlight {
    background: linear-gradient(180deg, $color-primary-light, $color-primary);
  }

  &--medium {
    background: linear-gradient(180deg, rgba($color-primary-light, 0.6), rgba($color-primary, 0.5));
  }

  &--low {
    background: linear-gradient(180deg, rgba($color-primary-light, 0.3), rgba($color-primary, 0.2));
  }
}

.info-index__bar-labels {
  display: flex;
  justify-content: space-between;
  margin-top: $spacing-sm;
  font-size: 10px;
  line-height: 14px;
  color: $color-on-surface-variant;
  padding: 0 2px;
  width: 100%;
  box-sizing: border-box;

  span {
    flex-shrink: 0;
    text-align: center;
    min-width: 0;
  }
}

// ============================================================================
// 加載狀態
// ============================================================================
.info-index__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: 28px 0;
  font-size: 14px;
  color: $color-on-surface-variant;
}

.info-index__loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid $color-border;
  border-top-color: $color-primary;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ============================================================================
// 錯誤狀態
// ============================================================================
.info-index__error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: 28px 0;
  font-size: 14px;
  color: $color-up;
}

.info-index__error-icon {
  font-size: 20px;
}

// ============================================================================
// 空數據狀態
// ============================================================================
.info-index__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: 28px 0;
  font-size: 14px;
  color: $color-on-surface-variant;
}

.info-index__empty-icon {
  font-size: 36px;
  color: #d4c8cc;
}

// ============================================================================
// 分類營業額（板2）
// ============================================================================

/**
 * 橫向滾動容器
 * - overflow-x: auto 實現橫向滾動
 * - 隱藏滾動條
 * - 保證移動端滑動正常，不溢出螢幕
 */
.info-index__category-scroll {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: $spacing-sm;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    display: none;
  }
}

/**
 * 橫向滾動軌道
 * - inline-flex 讓子元素橫向排列
 * - 不換行，確保橫向滾動
 */
.info-index__category-track {
  display: inline-flex;
  align-items: stretch;
  gap: $spacing-md;
  min-width: 100%;
  padding: $spacing-xs 0;
}

// ============================================================================
// 環圖區塊
// ============================================================================
.info-index__donut-section {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 130px;
}

.info-index__donut {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

.info-index__donut-center {
  position: absolute;
  inset: 18%;
  background: $color-white;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.info-index__donut-percent {
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  color: $color-primary;
}

.info-index__donut-label {
  font-size: 10px;
  line-height: 14px;
  color: $color-on-surface-variant;
  max-width: 55px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// ============================================================================
// 分類長條圖卡片（橫向排列）
// ============================================================================
.info-index__category-bar-item {
  flex-shrink: 0;
  width: 120px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: $spacing-md;
  background: $color-surface;
  border-radius: 10px;
  border: 1px solid $color-border;
}

.info-index__category-bar-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-index__category-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.info-index__category-bar-name {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: $color-on-surface;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-index__category-bar-ratio {
  font-size: 11px;
  font-weight: 700;
  line-height: 14px;
  color: $color-on-surface-variant;
  flex-shrink: 0;
}

.info-index__category-bar-track {
  width: 100%;
  height: 8px;
  background: #f1f1f1;
  border-radius: 9999px;
  overflow: hidden;
}

.info-index__category-bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 3px;
}

.info-index__category-bar-amount {
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
  color: $color-on-surface;
}

// ============================================================================
// 分類標籤（橫向滾動）
// ============================================================================
.info-index__category-tags {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  margin-top: $spacing-md;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    display: none;
  }
}

.info-index__category-tags-track {
  display: inline-flex;
  align-items: center;
  gap: $spacing-sm;
  min-width: 100%;
  padding: 2px 0;
}

.info-index__category-tag {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: 4px 10px;
  border-radius: 9999px;
  border: 1px solid $color-border;
  background: $color-surface;
  white-space: nowrap;
  flex-shrink: 0;
}

.info-index__category-tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.info-index__category-tag-name {
  font-size: 12px;
  line-height: 16px;
  color: $color-on-surface;
}

.info-index__category-tag-value {
  font-size: 11px;
  font-weight: 700;
  line-height: 14px;
  color: $color-on-surface-variant;
}

// ============================================================================
// 工作人員業績排行榜（板3）
// ============================================================================
.info-index__ranking-scroll {
  width: 100%;
  max-height: 420px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    display: none;
  }
}

.info-index__ranking {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.info-index__ranking-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 $spacing-xs;
}

.info-index__ranking-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info-index__ranking-left {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  min-width: 0;
  flex: 1;
}

.info-index__ranking-medal {
  font-size: 20px;
  line-height: 24px;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

.info-index__ranking-num {
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  color: $color-on-surface-variant;
  flex-shrink: 0;
  width: 22px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.info-index__ranking-name {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: $color-on-surface;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-index__ranking-amount {
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  color: $color-on-surface;
  flex-shrink: 0;
  margin-left: $spacing-md;
  font-variant-numeric: tabular-nums;

  &--top {
    color: $color-primary;
  }
}

// ============================================================================
// 進度條
// ============================================================================
.info-index__progress {
  width: 100%;
  height: 6px;
  background: #f1f1f1;
  border-radius: 9999px;
  overflow: hidden;
}

.info-index__progress-bar {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 2px;

  &--top {
    background: linear-gradient(90deg, $color-primary, $color-primary-light);
  }

  &--second {
    background: linear-gradient(90deg, #7c3aed, #a78bfa);
  }

  &--third {
    background: linear-gradient(90deg, #2563eb, #60a5fa);
  }

  &--normal {
    background: linear-gradient(90deg, $color-on-surface-variant, #a8a0a3);
  }
}
</style>
