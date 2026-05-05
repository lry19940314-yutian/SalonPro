<!--
  InfoCenterView.vue - 資訊中心總覽（PC / 平板端）
  權限：美容師 / 店長 | 設備：PC 端（含平板響應式，≥768px）
  設計稿：docs/UI設計稿/資訊中心/總覽/資訊中心-總覽.html
  接口：
    - GET /admin/information/yearly    門店年度營業額
    - GET /admin/information/category  分類營業額
    - GET /admin/information/staff     員工業績排行
  數據庫表結構參考：backend/database/README.md
    - performance 表：業績記錄，按 shop_id + 日期聚合
    - service_category 表：服務分類
    - staff 表：員工資料
  技術棧：Vue 3 Composition API + TypeScript + SCSS + Element Plus + ECharts
  響應式斷點：
    - 桌面端 ≥1200px：三欄/雙欄網格佈局，ElTable 表格視圖
    - 平板端 768px ~ 1199px：單欄堆叠，卡片列表視圖，圖表自適應縮放
    - 小屏 <768px：簡化佈局（由 isMobile 控制）
-->
<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useDevice } from '@/composables/useDevice'
import { getYearlyRevenueApi, getCategoryRevenueApi, getStaffRankingApi } from '@/api/info-center'
import type { YearlyRevenueData, CategoryRevenueItem, StaffRankingItem } from '@/api/info-center'

// ==================== Element Plus ====================
import { ElTable, ElTableColumn, ElLoading } from 'element-plus'

// ==================== ECharts 導入 ====================
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer])

const { isMobile, windowWidth } = useDevice()

// ==================== 響應式斷點 ====================
/** 桌面端斷點（≥1200px） */
const BREAKPOINT_DESKTOP = 1200
/** 平板端斷點下限（≥768px） */
const BREAKPOINT_TABLET = 768

/** 是否為平板端（768px ~ 1199px） */
const isTablet = computed(() => {
  const w = windowWidth.value
  return w >= BREAKPOINT_TABLET && w < BREAKPOINT_DESKTOP
})

/** 是否為桌面端（≥1200px） */
const isDesktop = computed(() => windowWidth.value >= BREAKPOINT_DESKTOP)

/** 當前是否為雙欄佈局（桌面端用於 grid-col-2） */
const isDualColumn = computed(() => windowWidth.value >= BREAKPOINT_DESKTOP)

interface CategoryDisplay extends CategoryRevenueItem { color: string }
interface StaffRankingDisplay { rank: number; staffId: number; name: string; amount: number; percentage: number; isMedal: boolean; medal: string }

const CATEGORY_COLORS = ['#ac235a','#cc3e73','#e8624a','#f0a03a','#328517','#1a8a7a','#2d6eb0','#794c8f','#a22c70','#d44c68']
const RANK_MEDALS: Record<number, string> = { 1:'🥇', 2:'🥈', 3:'🥉' }
const MONTH_LABELS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

// ==================== 時間維度切換 ====================
/** 當前選中年份 */
const selectedYear = ref<number>(new Date().getFullYear())
/** 當前選中月份（0=全年，1-12=指定月份） */
const selectedMonth = ref<number>(0)
/** 年份範圍（前後3年） */
const yearOptions = computed(() => {
  const y = new Date().getFullYear()
  return [y - 3, y - 2, y - 1, y, y + 1, y + 2, y + 3]
})
/** 月份選項 */
const monthOptions = [
  { value: 0, label: '全年' },
  { value: 1, label: '1月' },
  { value: 2, label: '2月' },
  { value: 3, label: '3月' },
  { value: 4, label: '4月' },
  { value: 5, label: '5月' },
  { value: 6, label: '6月' },
  { value: 7, label: '7月' },
  { value: 8, label: '8月' },
  { value: 9, label: '9月' },
  { value: 10, label: '10月' },
  { value: 11, label: '11月' },
  { value: 12, label: '12月' },
]
/** 當前月份標籤 */
const currentMonthLabel = computed(() => {
  const m = monthOptions.find(o => o.value === selectedMonth.value)
  return m ? m.label : '全年'
})

/** 切換年份 */
function switchYear(year: number) {
  selectedYear.value = year
  fetchYearlyRevenue()
}

/** 切換月份（影響分類營業額和業績排行的日期範圍） */
function switchMonth(month: number) {
  selectedMonth.value = month
  fetchCategoryRevenue()
  fetchStaffRanking()
}

/** 根據選中月份計算日期範圍 */
function getDateRange(): { startDate: string; endDate: string } {
  const y = selectedYear.value
  if (selectedMonth.value === 0) {
    return { startDate: `${y}-01-01`, endDate: `${y}-12-31` }
  }
  const m = String(selectedMonth.value).padStart(2, '0')
  // 計算該月最後一天
  const lastDay = new Date(y, selectedMonth.value, 0).getDate()
  return { startDate: `${y}-${m}-01`, endDate: `${y}-${m}-${lastDay}` }
}

// ==================== 板1：門店年度營業額 ====================
const yearlyRevenue = ref<YearlyRevenueData>({ year: new Date().getFullYear(), totalAmount: 0, monthlyData: [], growthRate: 0 })
const yearlyLoading = ref(true)
const yearlyError = ref('')
const growthDirection = computed<'up'|'down'|'flat'>(() => yearlyRevenue.value.growthRate > 0 ? 'up' : yearlyRevenue.value.growthRate < 0 ? 'down' : 'flat')
const growthText = computed(() => { const r = Math.abs(yearlyRevenue.value.growthRate); return growthDirection.value === 'up' ? `較去年同期增長 ${r}%` : growthDirection.value === 'down' ? `較去年同期下降 ${r}%` : '與去年同期持平' })
const hasMonthlyData = computed(() => yearlyRevenue.value.monthlyData && yearlyRevenue.value.monthlyData.length > 0)

/** 年度營業額卡片是否處於全局加載狀態（用於 v-loading） */
const yearlyFullLoading = computed(() => yearlyLoading.value && !yearlyError.value)

/** 圖表響應式字體大小 */
const chartFontSize = computed(() => {
  const w = windowWidth.value
  if (w < 768) return 10
  if (w < 1200) return 11
  return 12
})

/** ECharts 折線圖配置 */
const lineChartOption = computed(() => {
  const data = yearlyRevenue.value.monthlyData
  if (!data || data.length === 0) return {}
  const isSmall = windowWidth.value < 1200

  return {
    grid: {
      left: isSmall ? 40 : 50,
      right: isSmall ? 10 : 20,
      top: isSmall ? 10 : 20,
      bottom: isSmall ? 25 : 30,
    },
    xAxis: {
      type: 'category',
      data: MONTH_LABELS,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontSize: isSmall ? 10 : 11,
        color: '#8a7a7e',
        fontWeight: 500,
        interval: isSmall ? 1 : 0, // 平板端間隔顯示標籤避免重疊
      },
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: '#f0e6e8',
          type: 'dashed' as const,
        },
      },
      axisLabel: {
        fontSize: isSmall ? 10 : 11,
        color: '#8a7a7e',
        formatter: (v: number) => {
          if (v >= 10000) return `${Math.round(v / 10000)}萬`
          if (v >= 1000) return `${Math.round(v / 1000)}k`
          return `${v}`
        },
      },
    },
    series: [
      {
        type: 'line',
        data,
        smooth: true,
        symbol: 'circle',
        symbolSize: isSmall ? 4 : 6,
        lineStyle: {
          width: isSmall ? 2 : 3,
          color: '#ac235a',
        },
        itemStyle: {
          color: '#ac235a',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(172, 35, 90, 0.25)' },
              { offset: 1, color: 'rgba(172, 35, 90, 0.02)' },
            ],
          },
        },
        emphasis: {
          itemStyle: {
            color: '#ac235a',
            borderColor: '#fff',
            borderWidth: 2,
          },
        },
      },
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#f0e6e8',
      borderWidth: 1,
      borderRadius: 8,
      padding: [10, 14],
      textStyle: {
        fontSize: 13,
        color: '#23191d',
      },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        return `<strong>${p.name}</strong><br/>營業額：<strong style="color:#ac235a">${formatCurrency(Number(p.value))}</strong>`
      },
    },
  }
})

// 板2：服務分類營業額統計
const categoryRevenueRaw = ref<CategoryRevenueItem[]>([])
const categoryLoading = ref(true)
const categoryError = ref('')
const categoryRevenue = computed<CategoryDisplay[]>(() => categoryRevenueRaw.value.map((item, i) => ({ ...item, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] })))
const maxCategoryAmount = computed(() => Math.max(...categoryRevenue.value.map(i => i.amount), 1))
const hasCategoryData = computed(() => categoryRevenue.value.length > 0)
const categoryFullLoading = computed(() => categoryLoading.value && !categoryError.value)

/** ECharts 環圖配置（響應式） */
const pieChartOption = computed(() => {
  const data = categoryRevenue.value
  if (!data || data.length === 0) return {}
  const isSmall = windowWidth.value < 1200

  return {
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: '#fff',
      borderColor: '#f0e6e8',
      borderWidth: 1,
      borderRadius: 8,
      padding: [10, 14],
      textStyle: {
        fontSize: 13,
        color: '#23191d',
      },
      formatter: (params: any) => {
        return `<strong>${params.name}</strong><br/>營業額：<strong style="color:#ac235a">${formatCurrency(Number(params.value))}</strong><br/>佔比：${params.percent}%`
      },
    },
    legend: {
      show: false,
    },
    series: [
      {
        type: 'pie',
        radius: isSmall ? ['50%', '75%'] : ['55%', '80%'],
        avoidLabelOverlap: true,
        padAngle: 2,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.15)',
          },
        },
        labelLine: {
          show: false,
        },
        data: data.map(item => ({
          value: item.amount,
          name: item.categoryName,
          itemStyle: { color: item.color },
        })),
      },
    ],
  }
})

// ==================== 板3：工作人員業績排行榜 ====================
const staffRankingRaw = ref<StaffRankingItem[]>([])
const staffRankingLoading = ref(true)
const staffRankingError = ref('')
const staffRanking = computed<StaffRankingDisplay[]>(() => staffRankingRaw.value.map((item, i) => {
  const r = i + 1
  return {
    rank: r,
    staffId: item.staffId,
    name: item.name,
    amount: item.amount,
    percentage: item.percentage,
    isMedal: r <= 3,
    medal: RANK_MEDALS[r] || '',
  }
}))
const hasStaffRanking = computed(() => staffRanking.value.length > 0)
const staffRankingFullLoading = computed(() => staffRankingLoading.value && !staffRankingError.value)

/** 排名高亮 row-class-name */
const rankRowClass = computed(() => {
  return ({ row }: { row: StaffRankingDisplay }) => {
    if (row.rank === 1) return 'info-overview__table-row--top'
    if (row.rank === 2) return 'info-overview__table-row--second'
    if (row.rank === 3) return 'info-overview__table-row--third'
    return ''
  }
})

// ==================== ElLoading 實例管理 ====================
const yearlyCardRef = ref<HTMLElement | null>(null)
const categoryCardRef = ref<HTMLElement | null>(null)
const staffRankingCardRef = ref<HTMLElement | null>(null)
let yearlyLoadingInstance: ReturnType<typeof ElLoading.service> | null = null
let categoryLoadingInstance: ReturnType<typeof ElLoading.service> | null = null
let staffRankingLoadingInstance: ReturnType<typeof ElLoading.service> | null = null

onMounted(async () => {
  // 啟動 ElLoading 指令加載
  startLoading()
  await Promise.all([fetchYearlyRevenue(), fetchCategoryRevenue(), fetchStaffRanking()])
  // 關閉 ElLoading
  stopLoading()
})

/** 啟動所有卡片 ElLoading 實例 */
function startLoading() {
  nextTick(() => {
    if (yearlyCardRef.value) {
      yearlyLoadingInstance = ElLoading.service({
        target: yearlyCardRef.value,
        text: '年度數據加載中...',
        background: 'rgba(255,255,255,0.85)',
      })
    }
    if (categoryCardRef.value) {
      categoryLoadingInstance = ElLoading.service({
        target: categoryCardRef.value,
        text: '分類數據加載中...',
        background: 'rgba(255,255,255,0.85)',
      })
    }
    if (staffRankingCardRef.value) {
      staffRankingLoadingInstance = ElLoading.service({
        target: staffRankingCardRef.value,
        text: '排行數據加載中...',
        background: 'rgba(255,255,255,0.85)',
      })
    }
  })
}

/** 關閉所有 ElLoading 實例 */
function stopLoading() {
  if (yearlyLoadingInstance) {
    yearlyLoadingInstance.close()
    yearlyLoadingInstance = null
  }
  if (categoryLoadingInstance) {
    categoryLoadingInstance.close()
    categoryLoadingInstance = null
  }
  if (staffRankingLoadingInstance) {
    staffRankingLoadingInstance.close()
    staffRankingLoadingInstance = null
  }
}

// ==================== API 請求函數 ====================

/**
 * 獲取門店年度營業額
 * GET /admin/information/yearly?year=2026
 *
 * 數據庫來源：performance 表
 * - 按 shop_id + YEAR(performance_date) 分組聚合 totalAmount
 * - 按 MONTH(performance_date) 分組計算 monthlyData
 * - 與去年同比計算 growthRate
 */
async function fetchYearlyRevenue() {
  yearlyLoading.value = true
  yearlyError.value = ''
  try {
    const res = await getYearlyRevenueApi(selectedYear.value)
    if (res.code === 200 && res.data) {
      yearlyRevenue.value = res.data
    } else {
      console.warn('[年度營業額] API 返回異常', res)
      yearlyError.value = res.message || '年度營業額數據異常'
    }
  } catch (err: any) {
    console.warn('[年度營業額] API 請求失敗', err)
    yearlyError.value = err?.message || '無法獲取年度營業額數據，請檢查網路連線'
  } finally {
    yearlyLoading.value = false
  }
}

/**
 * 獲取分類營業額統計
 * GET /admin/information/category?startDate=2026-01-01&endDate=2026-12-31
 *
 * 數據庫來源：
 * - appointment_item 表：關聯 service_item.service_category_id
 * - service_category 表：分類名稱
 * - 按 service_category_id 分組聚合 amount
 */
async function fetchCategoryRevenue() {
  categoryLoading.value = true
  categoryError.value = ''
  try {
    const { startDate, endDate } = getDateRange()
    const res = await getCategoryRevenueApi(startDate, endDate)
    if (res.code === 200 && res.data && res.data.length > 0) {
      categoryRevenueRaw.value = res.data
    } else {
      console.warn('[分類營業額] API 返回空數據')
      categoryError.value = '暫無分類營業額數據'
    }
  } catch (err: any) {
    console.warn('[分類營業額] API 請求失敗', err)
    categoryError.value = err?.message || '無法獲取分類營業額數據，請檢查網路連線'
  } finally {
    categoryLoading.value = false
  }
}

/**
 * 獲取工作人員業績排行
 * GET /admin/information/staff?startDate=2026-05-01&endDate=2026-05-31&limit=10
 *
 * 數據庫來源：
 * - performance 表：按 staff_id 分組聚合 amount
 * - staff 表：員工姓名 name
 * - percentage = 該員工金額 / 第一名金額 * 100
 */
async function fetchStaffRanking() {
  staffRankingLoading.value = true
  staffRankingError.value = ''
  try {
    const { startDate, endDate } = getDateRange()
    const res = await getStaffRankingApi(startDate, endDate, 10)
    if (res.code === 200 && res.data && res.data.length > 0) {
      staffRankingRaw.value = res.data
    } else {
      console.warn('[業績排行] API 返回空數據')
      staffRankingError.value = '暫無業績排行數據'
    }
  } catch (err: any) {
    console.warn('[業績排行] API 請求失敗', err)
    staffRankingError.value = err?.message || '無法獲取業績排行數據，請檢查網路連線'
  } finally {
    staffRankingLoading.value = false
  }
}

// ==================== 格式化工具函數 ====================

/**
 * 格式化金額（千分位 + 貨幣符號）
 * 例如：1234567 → $1,234,567
 */
function formatCurrency(v: number): string {
  if (v === null || v === undefined || isNaN(v)) return '$0'
  return `$${v.toLocaleString('zh-TW')}`
}

/**
 * 格式化大額金額（萬/億），保留千分位
 * 例如：12800000 → $1,280萬
 * 例如：150000000 → $1.5億
 */
function formatLargeCurrency(v: number): string {
  if (v === null || v === undefined || isNaN(v)) return '$0'
  if (v >= 100000000) {
    return `$${Number((v / 100000000).toFixed(2)).toLocaleString('zh-TW')}億`
  }
  if (v >= 10000) {
    return `$${Math.round(v / 10000).toLocaleString('zh-TW')}萬`
  }
  return formatCurrency(v)
}

/**
 * 格式化百分比（保留一位小數 + 符號）
 * 例如：15.8 → +15.8%
 * 例如：-5.2 → -5.2%
 */
function formatPercent(v: number): string {
  if (v === null || v === undefined || isNaN(v)) return '0.0%'
  const prefix = v > 0 ? '+' : ''
  return `${prefix}${v.toFixed(1)}%`
}
</script>

<template>
  <div class="info-overview" :class="{ 'info-overview--mobile': isMobile, 'info-overview--tablet': isTablet, 'info-overview--desktop': isDesktop }">
    <!-- 頁面標題 -->
    <div class="info-overview__header">
      <div>
        <h1 class="info-overview__title">資訊中心總覽</h1>
        <p class="info-overview__subtitle">即時掌握門市營運狀況與業績趨勢</p>
      </div>
      <div class="info-overview__header-actions">
        <!-- 時間維度切換：年份選擇 -->
        <div class="info-overview__time-switcher">
          <button
            v-for="y in yearOptions"
            :key="y"
            class="info-overview__time-btn"
            :class="{ 'info-overview__time-btn--active': y === selectedYear }"
            @click="switchYear(y)"
          >
            {{ y }}
          </button>
        </div>
        <!-- 時間維度切換：月份選擇（平板/桌面） -->
        <div class="info-overview__month-switcher">
          <button
            v-for="m in monthOptions"
            :key="m.value"
            class="info-overview__time-btn info-overview__time-btn--month"
            :class="{ 'info-overview__time-btn--active': m.value === selectedMonth }"
            @click="switchMonth(m.value)"
          >
            {{ m.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="info-overview__grid">
      <!-- 板1：門店年度營業額（全寬） -->
      <section
        ref="yearlyCardRef"
        class="info-overview__card info-overview__card--full"
        v-loading="yearlyFullLoading"
        element-loading-text="年度數據加載中..."
        element-loading-background="rgba(255,255,255,0.85)"
        element-loading-spinner="el-icon-loading"
      >
        <div class="info-overview__card-header">
          <div class="info-overview__card-title-wrapper">
            <span class="info-overview__card-accent"></span>
            <h3 class="info-overview__card-title">門店年度營業額</h3>
          </div>
          <!-- 當前選中時間標籤 -->
          <span class="info-overview__card-time-label">{{ selectedYear }}年 {{ currentMonthLabel }}</span>
        </div>

        <!-- 錯誤狀態 -->
        <div v-if="yearlyError && !yearlyLoading" class="info-overview__error">
          <span class="material-symbols-outlined">error_outline</span>
          <span>{{ yearlyError }}</span>
          <button class="info-overview__retry-btn" @click="fetchYearlyRevenue">重新加載</button>
        </div>

        <!-- 數據內容 -->
        <template v-else>
          <div class="info-overview__revenue-panel">
            <div class="info-overview__revenue-summary">
              <div class="info-overview__revenue-total">
                <span class="info-overview__revenue-label">{{ yearlyRevenue.year }} 年度總營業額</span>
                <span class="info-overview__revenue-amount">{{ formatLargeCurrency(yearlyRevenue.totalAmount) }}</span>
              </div>
              <div class="info-overview__growth" :class="{ 'info-overview__growth--up': growthDirection === 'up', 'info-overview__growth--down': growthDirection === 'down', 'info-overview__growth--flat': growthDirection === 'flat' }">
                <span class="material-symbols-outlined info-overview__growth-icon">{{ growthDirection === 'up' ? 'trending_up' : growthDirection === 'down' ? 'trending_down' : 'remove' }}</span>
                <span>{{ growthText }}</span>
              </div>
            </div>
            <div v-if="hasMonthlyData" class="info-overview__chart-area">
              <VChart
                class="info-overview__line-chart"
                :option="lineChartOption"
                autoresize
              ></VChart>
            </div>
            <div v-else class="info-overview__empty">
              <span class="material-symbols-outlined">bar_chart</span>
              <span>暫無月度營業額數據</span>
            </div>
          </div>
        </template>
      </section>

      <!-- 板2 + 板3：雙列網格 -->
      <div class="info-overview__grid-col-2">
        <!-- 板2：服務分類營業額統計 -->
        <section
          ref="categoryCardRef"
          class="info-overview__card"
          v-loading="categoryFullLoading"
          element-loading-text="分類數據加載中..."
          element-loading-background="rgba(255,255,255,0.85)"
          element-loading-spinner="el-icon-loading"
        >
          <div class="info-overview__card-header">
            <div class="info-overview__card-title-wrapper">
              <span class="info-overview__card-accent info-overview__card-accent--secondary"></span>
              <h3 class="info-overview__card-title">服務分類營業額統計</h3>
            </div>
          </div>

          <!-- 錯誤狀態 -->
          <div v-if="categoryError && !categoryLoading" class="info-overview__error">
            <span class="material-symbols-outlined">error_outline</span>
            <span>{{ categoryError }}</span>
            <button class="info-overview__retry-btn" @click="fetchCategoryRevenue">重新加載</button>
          </div>

          <!-- 空數據狀態 -->
          <div v-else-if="!categoryLoading && !categoryError && !hasCategoryData" class="info-overview__empty">
            <span class="material-symbols-outlined">donut_small</span>
            <span>暫無分類營業額數據</span>
          </div>

          <!-- 數據內容 -->
          <template v-else-if="hasCategoryData">
            <div class="info-overview__category-content">
              <div class="info-overview__pie-section">
                <VChart
                  class="info-overview__pie-chart"
                  :option="pieChartOption"
                  autoresize
                ></VChart>
              </div>
              <div class="info-overview__category-list-scroll">
                <div class="info-overview__category-list">
                  <div v-for="item in categoryRevenue" :key="item.categoryId" class="info-overview__category-item">
                    <div class="info-overview__category-item-header">
                      <div class="info-overview__category-item-left">
                        <span class="info-overview__category-dot" :style="{ backgroundColor: item.color }"></span>
                        <span class="info-overview__category-name">{{ item.categoryName }}</span>
                      </div>
                      <span class="info-overview__category-ratio">{{ item.ratio }}%</span>
                    </div>
                    <div class="info-overview__category-bar-track">
                      <div class="info-overview__category-bar-fill" :style="{ width: (item.amount / maxCategoryAmount) * 100 + '%', backgroundColor: item.color }"></div>
                    </div>
                    <span class="info-overview__category-amount">{{ formatCurrency(item.amount) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </section>

        <!-- 板3：工作人員業績排行榜 -->
        <section
          ref="staffRankingCardRef"
          class="info-overview__card"
          v-loading="staffRankingFullLoading"
          element-loading-text="排行數據加載中..."
          element-loading-background="rgba(255,255,255,0.85)"
          element-loading-spinner="el-icon-loading"
        >
          <div class="info-overview__card-header">
            <div class="info-overview__card-title-wrapper">
              <span class="info-overview__card-accent info-overview__card-accent--tertiary"></span>
              <h3 class="info-overview__card-title">工作人員業績排行榜</h3>
            </div>
            <button class="info-overview__view-all">查看全部</button>
          </div>

          <!-- 錯誤狀態 -->
          <div v-if="staffRankingError && !staffRankingLoading" class="info-overview__error">
            <span class="material-symbols-outlined">error_outline</span>
            <span>{{ staffRankingError }}</span>
            <button class="info-overview__retry-btn" @click="fetchStaffRanking">重新加載</button>
          </div>

          <!-- 空數據狀態 -->
          <div v-else-if="!staffRankingLoading && !staffRankingError && !hasStaffRanking" class="info-overview__empty">
            <span class="material-symbols-outlined">leaderboard</span>
            <span>暫無業績排行數據</span>
          </div>

          <!-- 桌面端（≥1200px）：ElTable 表格視圖 + 排名高亮 -->
          <template v-else-if="isDesktop && hasStaffRanking">
            <div class="info-overview__table-scroll">
              <ElTable
                :data="staffRanking"
                class="info-overview__ranking-table"
                :row-class-name="rankRowClass"
                stripe
                size="small"
                max-height="480"
              >
                <ElTableColumn label="排名" width="80" align="center">
                  <template #default="{ row }: { row: StaffRankingDisplay }">
                    <span v-if="row.isMedal" class="info-overview__ranking-medal">{{ row.medal }}</span>
                    <span v-else class="info-overview__ranking-num">{{ String(row.rank).padStart(2, '0') }}</span>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="姓名" min-width="140">
                  <template #default="{ row }: { row: StaffRankingDisplay }">
                    <span class="info-overview__ranking-name">{{ row.name }}</span>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="業績金額" width="160" align="right">
                  <template #default="{ row }: { row: StaffRankingDisplay }">
                    <span class="info-overview__ranking-amount" :class="{ 'info-overview__ranking-amount--top': row.rank === 1 }">
                      {{ formatCurrency(row.amount) }}
                    </span>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="完成進度" min-width="180">
                  <template #default="{ row }: { row: StaffRankingDisplay }">
                    <div class="info-overview__table-progress-wrapper">
                      <div class="info-overview__progress">
                        <div
                          class="info-overview__progress-bar"
                          :class="{
                            'info-overview__progress-bar--top': row.rank === 1,
                            'info-overview__progress-bar--second': row.rank === 2,
                            'info-overview__progress-bar--third': row.rank === 3,
                            'info-overview__progress-bar--normal': row.rank > 3,
                          }"
                          :style="{ width: row.percentage + '%' }"
                        ></div>
                      </div>
                      <span class="info-overview__table-progress-text">{{ row.percentage }}%</span>
                    </div>
                  </template>
                </ElTableColumn>
              </ElTable>
            </div>
          </template>

          <!-- 平板端（768px ~ 1024px）：卡片列表視圖 -->
          <template v-else-if="hasStaffRanking">
            <div class="info-overview__ranking-list-scroll">
              <div class="info-overview__ranking-list">
                <div
                  v-for="item in staffRanking"
                  :key="item.staffId"
                  class="info-overview__ranking-card"
                  :class="{
                    'info-overview__ranking-card--top': item.rank === 1,
                    'info-overview__ranking-card--second': item.rank === 2,
                    'info-overview__ranking-card--third': item.rank === 3,
                  }"
                >
                  <div class="info-overview__ranking-card-row">
                    <div class="info-overview__ranking-card-left">
                      <span v-if="item.isMedal" class="info-overview__ranking-medal">{{ item.medal }}</span>
                      <span v-else class="info-overview__ranking-num">{{ String(item.rank).padStart(2, '0') }}</span>
                      <div class="info-overview__ranking-card-info">
                        <span class="info-overview__ranking-name">{{ item.name }}</span>
                        <span class="info-overview__ranking-card-label">工作人員</span>
                      </div>
                    </div>
                    <div class="info-overview__ranking-card-right">
                      <span class="info-overview__ranking-amount" :class="{ 'info-overview__ranking-amount--top': item.rank === 1 }">
                        {{ formatCurrency(item.amount) }}
                      </span>
                    </div>
                  </div>
                  <div class="info-overview__ranking-card-progress">
                    <div class="info-overview__progress">
                      <div
                        class="info-overview__progress-bar"
                        :class="{
                          'info-overview__progress-bar--top': item.rank === 1,
                          'info-overview__progress-bar--second': item.rank === 2,
                          'info-overview__progress-bar--third': item.rank === 3,
                          'info-overview__progress-bar--normal': item.rank > 3,
                        }"
                        :style="{ width: item.percentage + '%' }"
                      ></div>
                    </div>
                    <span class="info-overview__ranking-card-progress-text">{{ item.percentage }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </section>
      </div>

      <!-- 底部 KPI 指標 -->
      <div class="info-overview__kpi-grid">
        <div class="info-overview__kpi-card">
          <div class="info-overview__kpi-icon"><span class="material-symbols-outlined">trending_up</span></div>
          <div><p class="info-overview__kpi-label">平均客單價</p><p class="info-overview__kpi-value">$3,450</p></div>
        </div>
        <div class="info-overview__kpi-card">
          <div class="info-overview__kpi-icon"><span class="material-symbols-outlined">person_add</span></div>
          <div><p class="info-overview__kpi-label">本月新客</p><p class="info-overview__kpi-value">128</p></div>
        </div>
        <div class="info-overview__kpi-card">
          <div class="info-overview__kpi-icon"><span class="material-symbols-outlined">event_available</span></div>
          <div><p class="info-overview__kpi-label">今日預約</p><p class="info-overview__kpi-value">24</p></div>
        </div>
        <div class="info-overview__kpi-card">
          <div class="info-overview__kpi-icon"><span class="material-symbols-outlined">star</span></div>
          <div><p class="info-overview__kpi-label">顧客滿意度</p><p class="info-overview__kpi-value">4.9 / 5</p></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// ============================================================================
// 響應式斷點變數
// ============================================================================
$bp-tablet: 768px;
$bp-desktop: 1200px;

$color-primary: #ac235a;
$color-primary-light: #cc3e73;
$color-primary-dark: #8a1b48;
$color-secondary: #794c8f;
$color-tertiary: #328517;
$color-up: #d32f2f;
$color-up-bg: rgba(#d32f2f, 0.08);
$color-down: #2e7d32;
$color-down-bg: rgba(#2e7d32, 0.08);
$color-flat: #554149;
$color-flat-bg: rgba(#554149, 0.08);
$color-surface: #fff8f8;
$color-surface-container: #fde9ef;
$color-white: #ffffff;
$color-on-surface: #23191d;
$color-on-surface-variant: #554149;
$color-on-surface-muted: #8a7a7e;
$color-border: #f0e6e8;
$card-radius: 12px;
$card-shadow: 0 2px 12px rgba(#23191d, 0.06);
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-lg: 16px;
$spacing-xl: 20px;
$spacing-2xl: 24px;

// ============================================================================
// 主容器 — 響應式內邊距
// ============================================================================
.info-overview {
  width: 100%; max-width: 1600px; margin: 0 auto; padding: $spacing-2xl;
  display: flex; flex-direction: column; gap: $spacing-xl; box-sizing: border-box;

  // 平板端（<1200px）：縮小內邊距
  @media (max-width: 1199px) {
    padding: $spacing-xl;
    gap: $spacing-lg;
  }

  // 小屏
  &--mobile { padding: $spacing-lg; gap: $spacing-lg; }
}

// ============================================================================
// 頁面標題 — 響應式佈局
// ============================================================================
.info-overview__header {
  display: flex; flex-direction: row; justify-content: space-between;
  align-items: flex-end; gap: $spacing-lg; margin-bottom: $spacing-xs;

  // 平板端（<1200px）：垂直堆叠
  @media (max-width: 1199px) {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-md;
  }
}
.info-overview__title { font-size: 24px; font-weight: 600; line-height: 32px; color: $color-on-surface; margin: 0; }
.info-overview__subtitle { font-size: 14px; line-height: 20px; color: $color-on-surface-variant; margin: 4px 0 0 0; }

// 標題右側操作區
.info-overview__header-actions {
  display: flex; align-items: center; gap: $spacing-sm; flex-shrink: 0;
  flex-wrap: wrap;

  // 平板端（<1200px）：滿寬換行
  @media (max-width: 1199px) {
    width: 100%;
    justify-content: flex-start;
  }
}

// ============================================================================
// 時間維度切換器
// ============================================================================

/** 年份切換按鈕組 */
.info-overview__time-switcher {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: $color-surface;
  border-radius: 8px;
  border: 1px solid $color-border;

  // 平板端（<1200px）：可橫向滾動
  @media (max-width: 1199px) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
    max-width: 100%;
  }
}

/** 月份切換按鈕組 */
.info-overview__month-switcher {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: $color-surface;
  border-radius: 8px;
  border: 1px solid $color-border;

  // 平板端（<1200px）：可橫向滾動
  @media (max-width: 1199px) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
    max-width: 100%;
  }
}

/** 時間切換按鈕 */
.info-overview__time-btn {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  color: $color-on-surface-variant;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  font-family: inherit;

  &:hover {
    color: $color-primary;
    background: rgba($color-primary, 0.06);
  }

  &--active {
    color: $color-white;
    background: $color-primary;
    font-weight: 600;

    &:hover {
      color: $color-white;
      background: $color-primary-dark;
    }
  }

  &--month {
    padding: 4px 8px;
    font-size: 11px;
  }
}

/** 卡片右上角時間標籤 */
.info-overview__card-time-label {
  font-size: 12px;
  color: $color-on-surface-muted;
  font-weight: 500;
  flex-shrink: 0;
}

// ============================================================================
// 響應式網格
// ============================================================================
.info-overview__grid { display: flex; flex-direction: column; gap: $spacing-xl; }

.info-overview__grid-col-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-xl;

  // 平板端（<1200px）：單欄
  @media (max-width: 1199px) {
    grid-template-columns: 1fr;
    gap: $spacing-lg;
  }
}

// ============================================================================
// 卡片通用 — 響應式內邊距
// ============================================================================
.info-overview__card {
  background: $color-white; padding: $spacing-2xl; border-radius: $card-radius;
  border: 1px solid $color-border; box-shadow: $card-shadow; width: 100%; box-sizing: border-box;

  // 平板端（<1200px）：縮小卡片內邊距
  @media (max-width: 1199px) {
    padding: $spacing-xl;
  }
}
.info-overview__card-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: $spacing-xl;

  // 平板端（<1200px）
  @media (max-width: 1199px) {
    margin-bottom: $spacing-lg;
  }
}
.info-overview__card-title-wrapper { display: flex; align-items: center; gap: $spacing-md; }
.info-overview__card-accent {
  width: 4px; height: 22px; border-radius: 2px; background: $color-primary; flex-shrink: 0;
  &--secondary { background: $color-secondary; }
  &--tertiary { background: $color-tertiary; }
}
.info-overview__card-title {
  font-size: 18px; font-weight: 600; line-height: 24px; color: $color-on-surface; margin: 0;

  // 平板端（<1200px）
  @media (max-width: 1199px) {
    font-size: 16px;
  }
}
.info-overview__view-all {
  font-size: 13px; font-weight: 600; color: $color-primary; background: none; border: none;
  cursor: pointer; padding: 4px 8px; border-radius: 6px;
  &:hover { background: rgba($color-primary, 0.08); text-decoration: underline; }
}

// ============================================================================
// 加載/錯誤/空數據 — 響應式內邊距
// ============================================================================
.info-overview__loading { display: flex; align-items: center; justify-content: center; gap: $spacing-sm; padding: 40px 0; font-size: 14px; color: $color-on-surface-variant; }
.info-overview__loading-spinner { width: 20px; height: 20px; border: 2px solid $color-border; border-top-color: $color-primary; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.info-overview__error { display: flex; align-items: center; justify-content: center; gap: $spacing-sm; padding: 40px 0; font-size: 14px; color: $color-up; }
.info-overview__retry-btn {
  margin-left: $spacing-sm; padding: 4px 12px; font-size: 12px; font-weight: 600;
  color: $color-primary; background: rgba($color-primary, 0.08); border: 1px solid rgba($color-primary, 0.2);
  border-radius: 6px; cursor: pointer; transition: all 0.2s ease;
  &:hover { background: rgba($color-primary, 0.15); }
}
.info-overview__empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: $spacing-sm; padding: 40px 0; font-size: 14px; color: $color-on-surface-variant; .material-symbols-outlined { font-size: 36px; color: #d4c8cc; } }

// ============================================================================
// 板1：門店年度營業額 — 響應式佈局
// ============================================================================
.info-overview__revenue-panel {
  display: flex; gap: $spacing-2xl; align-items: flex-start;

  // 平板端（<1200px）：垂直堆叠
  @media (max-width: 1199px) {
    flex-direction: column;
    gap: $spacing-xl;
  }
}
.info-overview__revenue-summary {
  flex-shrink: 0; min-width: 220px; display: flex; flex-direction: column; gap: $spacing-md;

  // 平板端（<1200px）
  @media (max-width: 1199px) {
    min-width: unset;
    width: 100%;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }
}
.info-overview__revenue-total { display: flex; flex-direction: column; gap: $spacing-xs; }
.info-overview__revenue-label { font-size: 13px; line-height: 18px; color: $color-on-surface-variant; font-weight: 500; }
.info-overview__revenue-amount {
  font-size: 32px; font-weight: 700; line-height: 40px; color: $color-primary; letter-spacing: -0.5px;

  // 平板端（<1200px）
  @media (max-width: 1199px) {
    font-size: 26px;
    line-height: 34px;
  }
}
.info-overview__growth {
  display: inline-flex; align-items: center; gap: $spacing-xs; padding: $spacing-xs $spacing-sm;
  border-radius: 9999px; font-size: 12px; font-weight: 600; line-height: 16px; width: fit-content;
  &--up { color: $color-up; background: $color-up-bg; }
  &--down { color: $color-down; background: $color-down-bg; }
  &--flat { color: $color-flat; background: $color-flat-bg; }
}
.info-overview__growth-icon { font-size: 16px; font-variation-settings: 'FILL' 1; }

// 月度折線圖（ECharts）— 響應式高度
.info-overview__chart-area { flex: 1; min-width: 0; }
.info-overview__line-chart {
  width: 100%;
  height: 220px;

  // 平板端（768px ~ 1199px）
  @media (min-width: $bp-tablet) and (max-width: 1199px) {
    height: 200px;
  }

  // 小屏
  @media (max-width: 767px) {
    height: 180px;
  }
}

// ============================================================================
// 板2：服務分類營業額 — 響應式佈局
// ============================================================================
.info-overview__category-content {
  display: flex; gap: $spacing-2xl; align-items: flex-start;

  // 平板端（<1200px）：垂直居中
  @media (max-width: 1199px) {
    flex-direction: column;
    align-items: center;
    gap: $spacing-xl;
  }
}
.info-overview__pie-section {
  flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  width: 200px; height: 200px;

  // 平板端（768px ~ 1199px）
  @media (min-width: $bp-tablet) and (max-width: 1199px) {
    width: 180px;
    height: 180px;
  }

  // 小屏
  @media (max-width: 767px) {
    width: 160px;
    height: 160px;
  }
}
.info-overview__pie-chart { width: 100%; height: 100%; }
.info-overview__category-list-scroll { flex: 1; min-width: 0; overflow-x: auto; -webkit-overflow-scrolling: touch; &::-webkit-scrollbar { height: 4px; } &::-webkit-scrollbar-thumb { background: #d4c8cc; border-radius: 2px; } &::-webkit-scrollbar-track { background: transparent; } }
.info-overview__category-list { display: flex; flex-direction: column; gap: $spacing-md; min-width: 280px; }
.info-overview__category-item { display: flex; flex-direction: column; gap: 6px; }
.info-overview__category-item-header { display: flex; justify-content: space-between; align-items: center; }
.info-overview__category-item-left { display: flex; align-items: center; gap: $spacing-sm; min-width: 0; flex: 1; }
.info-overview__category-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.info-overview__category-name { font-size: 14px; font-weight: 500; line-height: 20px; color: $color-on-surface; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.info-overview__category-ratio { font-size: 13px; font-weight: 700; line-height: 18px; color: $color-on-surface-variant; flex-shrink: 0; margin-left: $spacing-sm; }
.info-overview__category-bar-track { width: 100%; height: 8px; background: #f1f1f1; border-radius: 9999px; overflow: hidden; }
.info-overview__category-bar-fill { height: 100%; border-radius: 9999px; transition: width 0.5s ease; min-width: 3px; }
.info-overview__category-amount { font-size: 13px; font-weight: 700; line-height: 18px; color: $color-on-surface; font-variant-numeric: tabular-nums; }

// ============================================================================
// 板3：工作人員業績排行榜 — 桌面端表格視圖（≥1200px）
// ============================================================================

/** 表格滾動容器 */
.info-overview__table-scroll {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/** ElTable 自定義樣式 */
.info-overview__ranking-table {
  width: 100%;

  // 覆蓋 Element Plus 默認樣式
  :deep(.el-table__header-wrapper) {
    .el-table__header {
      th.el-table__cell {
        background-color: $color-surface;
        color: $color-on-surface-variant;
        font-weight: 600;
        font-size: 13px;
        border-bottom: 2px solid $color-border;
      }
    }
  }

  :deep(.el-table__body-wrapper) {
    .el-table__body {
      td.el-table__cell {
        padding: 10px 0;
        border-bottom: 1px solid $color-border;
      }
    }
  }

  // 斑馬紋
  :deep(.el-table__row--striped) {
    td.el-table__cell {
      background-color: #fcf8f9;
    }
  }
}

/** 表格行排名高亮 */
.info-overview__table-row {
  &--top {
    :deep(td.el-table__cell) {
      background-color: rgba($color-primary, 0.06) !important;
    }
  }
  &--second {
    :deep(td.el-table__cell) {
      background-color: rgba(#7c3aed, 0.04) !important;
    }
  }
  &--third {
    :deep(td.el-table__cell) {
      background-color: rgba(#2563eb, 0.04) !important;
    }
  }
}

/** 表格內進度條包裝 */
.info-overview__table-progress-wrapper {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .info-overview__progress {
    flex: 1;
    min-width: 80px;
  }
}

.info-overview__table-progress-text {
  font-size: 12px;
  font-weight: 600;
  color: $color-on-surface-variant;
  flex-shrink: 0;
  min-width: 36px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

// ============================================================================
// 板3：工作人員業績排行榜 — 平板端卡片列表視圖（768px ~ 1199px）
// ============================================================================

/** 卡片列表滾動容器 */
.info-overview__ranking-list-scroll {
  width: 100%;
  max-height: 480px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #d4c8cc;
    border-radius: 2px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

/** 卡片列表 */
.info-overview__ranking-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

/** 單個排名卡片 */
.info-overview__ranking-card {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding: $spacing-lg;
  border-radius: 10px;
  background: $color-white;
  border: 1px solid $color-border;
  transition: all 0.2s ease;

  &--top {
    background: linear-gradient(135deg, rgba($color-primary, 0.04), rgba($color-primary-light, 0.08));
    border-color: rgba($color-primary, 0.2);
  }
  &--second {
    background: linear-gradient(135deg, rgba(#7c3aed, 0.03), rgba(#a78bfa, 0.06));
    border-color: rgba(#7c3aed, 0.15);
  }
  &--third {
    background: linear-gradient(135deg, rgba(#2563eb, 0.03), rgba(#60a5fa, 0.06));
    border-color: rgba(#2563eb, 0.15);
  }

  &:hover {
    box-shadow: 0 2px 8px rgba(#23191d, 0.08);
  }
}

.info-overview__ranking-card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info-overview__ranking-card-left {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  min-width: 0;
  flex: 1;
}

.info-overview__ranking-card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.info-overview__ranking-card-label {
  font-size: 11px;
  line-height: 14px;
  color: $color-on-surface-muted;
}

.info-overview__ranking-card-right {
  flex-shrink: 0;
  margin-left: $spacing-md;
}

.info-overview__ranking-card-progress {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .info-overview__progress {
    flex: 1;
  }
}

.info-overview__ranking-card-progress-text {
  font-size: 12px;
  font-weight: 600;
  color: $color-on-surface-variant;
  flex-shrink: 0;
  min-width: 36px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

// ============================================================================
// 板3：工作人員業績排行榜 — 共用元件
// ============================================================================

/** 排名獎牌 */
.info-overview__ranking-medal {
  font-size: 20px;
  line-height: 24px;
  flex-shrink: 0;
  width: 26px;
  text-align: center;
}

/** 排名數字 */
.info-overview__ranking-num {
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  color: $color-on-surface-variant;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/** 姓名 */
.info-overview__ranking-name {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: $color-on-surface;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/** 業績金額 */
.info-overview__ranking-amount {
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

/** 進度條 */
.info-overview__progress {
  width: 100%;
  height: 6px;
  background: #f1f1f1;
  border-radius: 9999px;
  overflow: hidden;
}

.info-overview__progress-bar {
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

// ============================================================================
// 底部 KPI 指標 — 響應式網格
// ============================================================================
.info-overview__kpi-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: $spacing-xl;

  // 平板端（<1200px）：2列
  @media (max-width: 1199px) {
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-lg;
  }

  // 小屏（<768px）：1列
  @media (max-width: 767px) {
    grid-template-columns: 1fr;
  }
}
.info-overview__kpi-card {
  display: flex; align-items: center; gap: $spacing-lg; padding: $spacing-xl;
  background: $color-surface-container; border-radius: $card-radius;
  border: 1px solid $color-border;

  // 平板端（<1200px）
  @media (max-width: 1199px) {
    padding: $spacing-lg;
    gap: $spacing-md;
  }
}
.info-overview__kpi-icon {
  width: 48px; height: 48px; border-radius: 50%; background: $color-white;
  display: flex; align-items: center; justify-content: center; color: $color-primary;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04); flex-shrink: 0;
  .material-symbols-outlined { font-size: 24px; }

  // 平板端（<1200px）
  @media (max-width: 1199px) {
    width: 40px;
    height: 40px;
    .material-symbols-outlined { font-size: 20px; }
  }
}
.info-overview__kpi-label { font-size: 12px; font-weight: 500; line-height: 16px; color: $color-on-surface-variant; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; }
.info-overview__kpi-value {
  font-size: 20px; font-weight: 700; line-height: 28px; color: $color-on-surface; margin: 0;

  // 平板端（<1200px）
  @media (max-width: 1199px) {
    font-size: 18px;
    line-height: 24px;
  }
}
</style>
