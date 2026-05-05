<!--
  MemberAnalysisView.vue - 會員分析 - 新客總覽（PC / 平板端）
  權限：店長 | 設備：PC 端（含平板響應式，≥768px）
  設計稿：docs/UI設計稿/資訊中心/會員分析/新客總覽.html
  技術棧：Vue 3 Composition API + TypeScript + SCSS + Element Plus
  響應式斷點：
    - 桌面端 ≥1200px：12 欄網格佈局，雙欄卡片
    - 平板端 768px ~ 1199px：單欄堆叠，卡片自適應縮放
  說明：Step 5 - 接口聯調與真實數據綁定
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDevice } from '@/composables/useDevice'

// ==================== Element Plus ====================
import { ElTable, ElTableColumn, ElPagination, ElLoading } from 'element-plus'

// ==================== ECharts 導入 ====================
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([LineChart, PieChart, GridComponent, TooltipComponent, DataZoomComponent, LegendComponent, CanvasRenderer])

// ==================== API 導入 ====================
import { getNewCustomerAnalysisApi } from '@/api/info-center'
import type { NewCustomerAnalysisData, NewCustomerMetrics, NewCustomerTrendItem, SourceStatItem } from '@/api/info-center'

const { isMobile, windowWidth } = useDevice()

// ==================== 響應式斷點 ====================
const BREAKPOINT_DESKTOP = 1200
const BREAKPOINT_TABLET = 768

const isTablet = computed(() => {
  const w = windowWidth.value
  return w >= BREAKPOINT_TABLET && w < BREAKPOINT_DESKTOP
})

const isDesktop = computed(() => windowWidth.value >= BREAKPOINT_DESKTOP)

// ==================== 型別定義 ====================
interface StaffPerformanceItem {
  rank: number
  name: string
  title: string
  newCustomers: number
  conversionRate: number
  revenue: number
  avatar: null
}

interface NewCustomerItem {
  id: string
  name: string
  phone: string
  source: string
  staff: string
  date: string
  amount: number
  status: string
}

interface PieDataItem {
  label: string
  value: number
  color: string
}

// ==================== 加載狀態管理 ====================
const loading = ref(true)
const loadError = ref<string | null>(null)
const isEmpty = computed(() => {
  return !loading.value && !loadError.value && newCustomerMetrics.value === null
})

// ==================== 新客核心數據概覽（API 數據）====================
/** 新客核心指標數據 */
const newCustomerMetrics = ref<NewCustomerMetrics | null>(null)

/** 增長率方向判斷 */
const growthRateDirection = computed<'up' | 'down'>(() => {
  const rate = newCustomerMetrics.value?.monthGrowthRate ?? 0
  return rate >= 0 ? 'up' : 'down'
})

/** 增長率絕對值（含 % 後綴） */
const growthRateDisplay = computed<string>(() => {
  const absVal = Math.abs(newCustomerMetrics.value?.monthGrowthRate ?? 0)
  return `${absVal.toFixed(1)}%`
})

// ==================== 時間選擇 ====================
const timePeriods = ['本季', '本月', '去年同期']
const selectedPeriod = ref('本月')

// ==================== 頁籤導航 ====================
const tabs = [
  { key: 'overview', label: '新客總覽' },
  { key: 'return', label: '回流分析' },
  { key: 'basic', label: '基本分析' },
]
const activeTab = ref('overview')

// ==================== 客群組成比例（靜態資料） ====================
const customerMix: PieDataItem[] = [
  { label: '新客', value: 45, color: '#c84c8f' },
  { label: '回流客', value: 30, color: '#794c8f' },
  { label: '忠實客', value: 25, color: '#e8d5db' },
]

// ==================== 美療師轉化表現（靜態資料） ====================
const staffPerformance: StaffPerformanceItem[] = [
  { rank: 1, name: '林美玲', title: '資深美療師', newCustomers: 28, conversionRate: 85, revenue: 168000, avatar: null },
  { rank: 2, name: '張雅婷', title: '美療師', newCustomers: 22, conversionRate: 78, revenue: 132000, avatar: null },
  { rank: 3, name: '王怡君', title: '資深美療師', newCustomers: 19, conversionRate: 72, revenue: 114000, avatar: null },
  { rank: 4, name: '陳詩涵', title: '美療師', newCustomers: 15, conversionRate: 68, revenue: 96000, avatar: null },
  { rank: 5, name: '李佳穎', title: '實習美療師', newCustomers: 12, conversionRate: 60, revenue: 72000, avatar: null },
]

// ==================== 新客職業分布（靜態資料） ====================
const occupationData: PieDataItem[] = [
  { label: '上班族', value: 45, color: '#c84c8f' },
  { label: '家管', value: 20, color: '#794c8f' },
  { label: '自由業', value: 18, color: '#e8d5db' },
  { label: '學生', value: 10, color: '#f0d6df' },
  { label: '其他', value: 7, color: '#dcc7e1' },
]

// ==================== 新客來源分析（靜態資料） ====================
const sourceData: PieDataItem[] = [
  { label: 'LINE 預約', value: 35, color: '#c84c8f' },
  { label: 'Google 地圖', value: 25, color: '#794c8f' },
  { label: 'Instagram', value: 18, color: '#e8d5db' },
  { label: '朋友推薦', value: 15, color: '#f0d6df' },
  { label: '其他', value: 7, color: '#dcc7e1' },
]

// ==================== Step 5：新客增長趨勢（API 數據）====================

/** 新客增長趨勢數據 */
const trendData = ref<NewCustomerTrendItem[]>([])

/** 圖表響應式字體大小 */
const chartFontSize = computed(() => {
  const w = windowWidth.value
  if (w < 768) return 10
  if (w < 1200) return 11
  return 12
})

/** 圖表高度：PC/平板 400px，移動端 300px（此處僅 PC/平板） */
const chartHeight = computed(() => {
  return windowWidth.value < 768 ? 300 : 400
})

/** ECharts 折線圖配置 - 新客增長趨勢 */
const trendChartOption = computed(() => {
  const data = trendData.value
  if (!data || data.length === 0) return {}
  const isSmall = windowWidth.value < 1200

  return {
    grid: {
      left: isSmall ? 40 : 50,
      right: isSmall ? 16 : 24,
      top: isSmall ? 20 : 30,
      bottom: isSmall ? 30 : 40,
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date.slice(5)), // MM-DD
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontSize: chartFontSize.value,
        color: '#8a7a7e',
        fontWeight: 500,
        interval: isSmall ? 4 : 2,
      },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: {
        lineStyle: {
          color: '#f0e6e8',
          type: 'dashed' as const,
        },
      },
      axisLabel: {
        fontSize: chartFontSize.value,
        color: '#8a7a7e',
      },
    },
    series: [
      {
        type: 'line',
        data: data.map(item => item.newCustomerCount),
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
              { offset: 0, color: 'rgba(172, 35, 90, 0.20)' },
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
        const item = data[p.dataIndex]
        return `<strong>${item.date}</strong><br/>新客數：<strong style="color:#ac235a">${item.newCustomerCount.toLocaleString()} 人</strong>`
      },
    },
    dataZoom: isSmall ? undefined : [
      {
        type: 'inside',
        start: 0,
        end: 100,
      },
    ],
  }
})

// ==================== 新客詳細名單（靜態資料） ====================
const newCustomerList: NewCustomerItem[] = [
  { id: 'C001', name: '吳佩珊', phone: '0912-345-678', source: 'LINE 預約', staff: '林美玲', date: '2025-05-04', amount: 4500, status: '已成交' },
  { id: 'C002', name: '黃雅琳', phone: '0987-654-321', source: 'Google 地圖', staff: '張雅婷', date: '2025-05-04', amount: 3200, status: '已成交' },
  { id: 'C003', name: '劉怡君', phone: '0923-456-789', source: 'Instagram', staff: '王怡君', date: '2025-05-03', amount: 5800, status: '已成交' },
  { id: 'C004', name: '陳曉婷', phone: '0978-123-456', source: '朋友推薦', staff: '林美玲', date: '2025-05-03', amount: 2100, status: '已成交' },
  { id: 'C005', name: '林郁婷', phone: '0955-789-123', source: 'LINE 預約', staff: '陳詩涵', date: '2025-05-02', amount: 6800, status: '已成交' },
  { id: 'C006', name: '張雅雯', phone: '0934-567-890', source: 'Google 地圖', staff: '李佳穎', date: '2025-05-02', amount: 1500, status: '未成交' },
  { id: 'C007', name: '李姿穎', phone: '0967-890-123', source: 'Instagram', staff: '林美玲', date: '2025-05-01', amount: 4200, status: '已成交' },
  { id: 'C008', name: '王思涵', phone: '0911-222-333', source: '朋友推薦', staff: '張雅婷', date: '2025-05-01', amount: 3500, status: '已成交' },
]

const currentPage = ref(1)
const pageSize = ref(5)

// ==================== 工具函數 ====================
function formatCurrency(value: number): string {
  return `$${value.toLocaleString('zh-TW')}`
}

/** 格式化新客數量（千分位） */
function formatCount(value: number): string {
  return value.toLocaleString('zh-TW')
}

/** 格式化百分比（保留1位小數 + %後綴） */
function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

/** 計算 SVG donut chart 的 stroke-dasharray */
function donutDashArray(percentage: number): string {
  const circumference = 2 * Math.PI * 42
  return `${(percentage / 100) * circumference} ${circumference}`
}

/** 計算 SVG donut chart 的 stroke-dashoffset（累積偏移） */
function donutDashOffset(index: number, data: PieDataItem[]): number {
  const circumference = 2 * Math.PI * 42
  let offset = 0
  for (let i = 0; i < index; i++) {
    offset += (data[i].value / 100) * circumference
  }
  return circumference - offset
}

/** 計算圓餅圖的扇形路徑 */
function pieSlicePath(index: number, data: PieDataItem[], radius: number): string {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  let startAngle = 0
  for (let i = 0; i < index; i++) {
    startAngle += (data[i].value / total) * 360
  }
  const angle = (data[index].value / total) * 360
  const endAngle = startAngle + angle

  const startRad = ((startAngle - 90) * Math.PI) / 180
  const endRad = ((endAngle - 90) * Math.PI) / 180

  const x1 = radius + radius * Math.cos(startRad)
  const y1 = radius + radius * Math.sin(startRad)
  const x2 = radius + radius * Math.cos(endRad)
  const y2 = radius + radius * Math.sin(endRad)

  const largeArc = angle > 180 ? 1 : 0

  return `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

// ==================== Step 5：新客來源統計（API 數據）====================

/** 新客來源統計數據 */
const sourceStats = ref<SourceStatItem[]>([])

/** 新客來源統計 - 環形圖配色（與系統色系統一） */
const sourceColors = ['#c84c8f', '#794c8f', '#e8a838', '#328517', '#dcc7e1']

/** 新客來源統計 - 環形圖 ECharts 配置 */
const sourceChartOption = computed(() => {
  const data = sourceStats.value
  if (!data || data.length === 0) return {}
  const isSmall = windowWidth.value < 1200
  const fs = chartFontSize.value

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
        return `<strong>${params.name}</strong><br/>新客數：<strong style="color:#c84c8f">${params.value.toLocaleString()} 人</strong><br/>佔比：${params.percent}%`
      },
    },
    legend: {
      show: false,
    },
    series: [
      {
        type: 'pie',
        radius: isSmall ? ['45%', '70%'] : ['50%', '75%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
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
            fontSize: fs + 2,
            fontWeight: 'bold' as const,
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
        data: data.map((item, index) => ({
          value: item.sourceCount,
          name: item.sourceName,
          itemStyle: {
            color: sourceColors[index % sourceColors.length],
          },
        })),
      },
    ],
  }
})

// ==================== Step 5：API 數據加載 ====================

/**
 * 加載新客分析數據
 * 在 onMounted 生命週期中調用，獲取全量數據
 * 包含加載狀態、空數據狀態、接口異常捕獲
 */
async function fetchNewCustomerData() {
  loading.value = true
  loadError.value = null

  // 顯示全局加載
  const loadingInstance = ElLoading.service({
    target: '.member-analysis',
    text: '數據加載中...',
    background: 'rgba(255, 255, 255, 0.8)',
  })

  try {
    const response = await getNewCustomerAnalysisApi()
    const data: NewCustomerAnalysisData = response.data

    // 賦值核心指標
    newCustomerMetrics.value = data.metrics

    // 賦值增長趨勢（日期格式化為 YYYY-MM-DD）
    trendData.value = data.trend.map((item: NewCustomerTrendItem) => ({
      date: item.date,
      newCustomerCount: item.newCustomerCount,
    }))

    // 賦值來源統計（占比保留1位小數）
    sourceStats.value = data.sources.map((item: SourceStatItem) => ({
      sourceName: item.sourceName,
      sourceCount: item.sourceCount,
      sourceRatio: item.sourceRatio,
    }))
  } catch (error: any) {
    console.error('[新客分析] 數據加載失敗:', error)
    loadError.value = error?.message || '數據加載失敗，請稍後重試'
  } finally {
    loading.value = false
    // 關閉加載
    loadingInstance.close()
  }
}

onMounted(() => {
  fetchNewCustomerData()
})
</script>

<template>
  <div
    class="member-analysis"
    :class="{
      'member-analysis--tablet': isTablet,
      'member-analysis--desktop': isDesktop,
    }"
  >
    <!-- ==================== 頁面標題與操作列 ==================== -->
    <div class="member-analysis__header">
      <div>
        <!-- 麵包屑 -->
        <nav class="member-analysis__breadcrumb">
          <span class="member-analysis__breadcrumb-item">會員管理</span>
          <span class="member-analysis__breadcrumb-separator material-symbols-outlined">chevron_right</span>
          <span class="member-analysis__breadcrumb-item member-analysis__breadcrumb-item--current">會員分析</span>
        </nav>
        <h1 class="member-analysis__title">新客分析總覽</h1>
      </div>
      <div class="member-analysis__header-actions">
        <!-- 時間維度切換 -->
        <div class="member-analysis__time-switcher">
          <button
            v-for="period in timePeriods"
            :key="period"
            class="member-analysis__time-btn"
            :class="{ 'member-analysis__time-btn--active': period === selectedPeriod }"
            @click="selectedPeriod = period"
          >
            {{ period }}
          </button>
        </div>
        <!-- 日期範圍選擇（靜態佔位） -->
        <div class="member-analysis__date-range">
          <span class="material-symbols-outlined">calendar_today</span>
          <span>2025-01-01 ~ 2025-05-05</span>
        </div>
      </div>
    </div>

    <!-- ==================== 頁籤導航 ==================== -->
    <div class="member-analysis__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="member-analysis__tab"
        :class="{ 'member-analysis__tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ==================== 錯誤狀態 ==================== -->
    <div v-if="loadError" class="member-analysis__error">
      <span class="material-symbols-outlined member-analysis__error-icon">error_outline</span>
      <p class="member-analysis__error-text">{{ loadError }}</p>
      <button class="member-analysis__error-retry" @click="fetchNewCustomerData">重新加載</button>
    </div>

    <!-- ==================== 空數據狀態 ==================== -->
    <div v-else-if="isEmpty" class="member-analysis__empty">
      <span class="material-symbols-outlined member-analysis__empty-icon">inbox</span>
      <p class="member-analysis__empty-text">暫無新客數據</p>
    </div>

    <!-- ==================== 主要內容（加載完成且有數據）==================== -->
    <template v-else>
      <!-- ==================== 新客核心數據概覽（4 指標卡片）==================== -->
      <div
        class="member-analysis__metrics"
        :class="{
          'member-analysis__metrics--tablet': isTablet,
          'member-analysis__metrics--desktop': isDesktop,
        }"
      >
        <!-- 指標 1：累計總新客數 -->
        <div class="member-analysis__metric-card">
          <div class="member-analysis__metric-icon member-analysis__metric-icon--total">
            <span class="material-symbols-outlined">group_add</span>
          </div>
          <div class="member-analysis__metric-info">
            <span class="member-analysis__metric-label">累計總新客數</span>
            <span class="member-analysis__metric-value">{{ formatCount(newCustomerMetrics?.totalNewCustomer ?? 0) }}</span>
          </div>
        </div>

        <!-- 指標 2：本月新增新客數 -->
        <div class="member-analysis__metric-card">
          <div class="member-analysis__metric-icon member-analysis__metric-icon--month">
            <span class="material-symbols-outlined">calendar_month</span>
          </div>
          <div class="member-analysis__metric-info">
            <span class="member-analysis__metric-label">本月新增新客</span>
            <div class="member-analysis__metric-value-row">
              <span class="member-analysis__metric-value">{{ formatCount(newCustomerMetrics?.monthNewCustomer ?? 0) }}</span>
              <span
                class="member-analysis__metric-growth"
                :class="{
                  'member-analysis__metric-growth--up': growthRateDirection === 'up',
                  'member-analysis__metric-growth--down': growthRateDirection === 'down',
                }"
              >
                <span class="material-symbols-outlined member-analysis__metric-growth-icon">
                  {{ growthRateDirection === 'up' ? 'trending_up' : 'trending_down' }}
                </span>
                {{ growthRateDisplay }}
              </span>
            </div>
          </div>
        </div>

        <!-- 指標 3：本周新增新客數 -->
        <div class="member-analysis__metric-card">
          <div class="member-analysis__metric-icon member-analysis__metric-icon--week">
            <span class="material-symbols-outlined">date_range</span>
          </div>
          <div class="member-analysis__metric-info">
            <span class="member-analysis__metric-label">本周新增新客</span>
            <span class="member-analysis__metric-value">{{ formatCount(newCustomerMetrics?.weekNewCustomer ?? 0) }}</span>
          </div>
        </div>

        <!-- 指標 4：今日新增新客數 -->
        <div class="member-analysis__metric-card">
          <div class="member-analysis__metric-icon member-analysis__metric-icon--day">
            <span class="material-symbols-outlined">today</span>
          </div>
          <div class="member-analysis__metric-info">
            <span class="member-analysis__metric-label">今日新增新客</span>
            <span class="member-analysis__metric-value">{{ formatCount(newCustomerMetrics?.dayNewCustomer ?? 0) }}</span>
          </div>
        </div>
      </div>

      <!-- ==================== 12 欄網格內容區 ==================== -->
      <div class="member-analysis__grid">
        <!-- 區塊 1：客群組成比例（4 欄） -->
        <section class="member-analysis__card member-analysis__card--mix">
          <div class="member-analysis__card-header">
            <div class="member-analysis__card-title-wrapper">
              <span class="member-analysis__card-accent"></span>
              <h3 class="member-analysis__card-title">客群組成比例</h3>
            </div>
          </div>
          <div class="member-analysis__mix-content">
            <!-- Donut Chart (SVG) -->
            <div class="member-analysis__donut-wrapper">
              <svg class="member-analysis__donut" viewBox="0 0 100 100">
                <!-- 背景圓環 -->
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f0e6e8" stroke-width="16" />
                <!-- 各區段 -->
                <circle
                  v-for="(item, i) in customerMix"
                  :key="item.label"
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  :stroke="item.color"
                  stroke-width="16"
                  stroke-linecap="butt"
                  :stroke-dasharray="donutDashArray(item.value)"
                  :stroke-dashoffset="donutDashOffset(i, customerMix)"
                  transform="rotate(-90 50 50)"
                  class="member-analysis__donut-segment"
                />
              </svg>
              <div class="member-analysis__donut-center">
                <span class="member-analysis__donut-value">{{ customerMix[0].value }}%</span>
                <span class="member-analysis__donut-label">新客佔比</span>
              </div>
            </div>
            <!-- 圖例 -->
            <div class="member-analysis__mix-legend">
              <div
                v-for="item in customerMix"
                :key="item.label"
                class="member-analysis__mix-legend-item"
              >
                <div class="member-analysis__mix-legend-left">
                  <span class="member-analysis__mix-dot" :style="{ backgroundColor: item.color }"></span>
                  <span class="member-analysis__mix-label">{{ item.label }}</span>
                </div>
                <span class="member-analysis__mix-value">{{ item.value }}%</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 區塊 2：美療師轉化表現（8 欄） -->
        <section class="member-analysis__card member-analysis__card--staff">
          <div class="member-analysis__card-header">
            <div class="member-analysis__card-title-wrapper">
              <span class="member-analysis__card-accent member-analysis__card-accent--secondary"></span>
              <h3 class="member-analysis__card-title">美療師轉化表現</h3>
            </div>
            <button class="member-analysis__view-all">查看全部</button>
          </div>
          <div class="member-analysis__table-scroll">
            <ElTable
              :data="staffPerformance"
              class="member-analysis__staff-table"
              stripe
              size="small"
              max-height="360"
            >
              <ElTableColumn label="排名" width="70" align="center">
                <template #default="{ row }: { row: StaffPerformanceItem }">
                  <span v-if="row.rank <= 3" class="member-analysis__rank-medal">{{ ['🥇', '🥈', '🥉'][row.rank - 1] }}</span>
                  <span v-else class="member-analysis__rank-num">{{ String(row.rank).padStart(2, '0') }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="姓名" min-width="120">
                <template #default="{ row }: { row: StaffPerformanceItem }">
                  <div class="member-analysis__staff-name-cell">
                    <div class="member-analysis__staff-avatar">{{ row.name.charAt(0) }}</div>
                    <div>
                      <span class="member-analysis__staff-name">{{ row.name }}</span>
                      <span class="member-analysis__staff-title">{{ row.title }}</span>
                    </div>
                  </div>
                </template>
              </ElTableColumn>
              <ElTableColumn label="新客數" width="90" align="center">
                <template #default="{ row }: { row: StaffPerformanceItem }">
                  <span class="member-analysis__staff-count">{{ row.newCustomers }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="轉化率" width="100" align="center">
                <template #default="{ row }: { row: StaffPerformanceItem }">
                  <span class="member-analysis__staff-rate">{{ row.conversionRate }}%</span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="業績金額" width="130" align="right">
                <template #default="{ row }: { row: StaffPerformanceItem }">
                  <span class="member-analysis__staff-revenue">{{ formatCurrency(row.revenue) }}</span>
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
        </section>

        <!-- 區塊 3 + 4：新客職業分布 + 新客來源分析（各 6 欄） -->
        <div class="member-analysis__grid-col-2">
          <!-- 新客職業分布 -->
          <section class="member-analysis__card">
            <div class="member-analysis__card-header">
              <div class="member-analysis__card-title-wrapper">
                <span class="member-analysis__card-accent member-analysis__card-accent--tertiary"></span>
                <h3 class="member-analysis__card-title">新客職業分布</h3>
              </div>
            </div>
            <div class="member-analysis__pie-content">
              <!-- Pie Chart (SVG) -->
              <div class="member-analysis__pie-chart-wrapper">
                <svg class="member-analysis__pie-svg" viewBox="0 0 100 100">
                  <path
                    v-for="(item, i) in occupationData"
                    :key="item.label"
                    :d="pieSlicePath(i, occupationData, 48)"
                    :fill="item.color"
                    class="member-analysis__pie-slice"
                  />
                  <circle cx="50" cy="50" r="22" fill="white" />
                </svg>
              </div>
              <!-- 圖例 -->
              <div class="member-analysis__pie-legend">
                <div
                  v-for="item in occupationData"
                  :key="item.label"
                  class="member-analysis__pie-legend-item"
                >
                  <div class="member-analysis__pie-legend-left">
                    <span class="member-analysis__pie-dot" :style="{ backgroundColor: item.color }"></span>
                    <span class="member-analysis__pie-label">{{ item.label }}</span>
                  </div>
                  <span class="member-analysis__pie-value">{{ item.value }}%</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 新客來源分析 -->
          <section class="member-analysis__card">
            <div class="member-analysis__card-header">
              <div class="member-analysis__card-title-wrapper">
                <span class="member-analysis__card-accent member-analysis__card-accent--quaternary"></span>
                <h3 class="member-analysis__card-title">新客來源分析</h3>
              </div>
            </div>
            <div class="member-analysis__pie-content">
              <!-- Pie Chart (SVG) -->
              <div class="member-analysis__pie-chart-wrapper">
                <svg class="member-analysis__pie-svg" viewBox="0 0 100 100">
                  <path
                    v-for="(item, i) in sourceData"
                    :key="item.label"
                    :d="pieSlicePath(i, sourceData, 48)"
                    :fill="item.color"
                    class="member-analysis__pie-slice"
                  />
                  <circle cx="50" cy="50" r="22" fill="white" />
                </svg>
              </div>
              <!-- 圖例 -->
              <div class="member-analysis__pie-legend">
                <div
                  v-for="item in sourceData"
                  :key="item.label"
                  class="member-analysis__pie-legend-item"
                >
                  <div class="member-analysis__pie-legend-left">
                    <span class="member-analysis__pie-dot" :style="{ backgroundColor: item.color }"></span>
                    <span class="member-analysis__pie-label">{{ item.label }}</span>
                  </div>
                  <span class="member-analysis__pie-value">{{ item.value }}%</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- ==================== Step 5：新客增長趨勢圖表（API 數據）==================== -->
        <section class="member-analysis__card member-analysis__card--full">
          <div class="member-analysis__card-header">
            <div class="member-analysis__card-title-wrapper">
              <span class="member-analysis__card-accent member-analysis__card-accent--trend"></span>
              <h3 class="member-analysis__card-title">新客增長趨勢</h3>
            </div>
            <span class="member-analysis__card-time-label">最近 30 天</span>
          </div>
          <div class="member-analysis__trend-chart-area">
            <VChart
              class="member-analysis__trend-chart"
              :option="trendChartOption"
              autoresize
            ></VChart>
          </div>
        </section>

        <!-- ==================== Step 5：新客來源統計模組（API 數據）==================== -->
        <section class="member-analysis__card member-analysis__card--full">
          <div class="member-analysis__card-header">
            <div class="member-analysis__card-title-wrapper">
              <span class="member-analysis__card-accent member-analysis__card-accent--source"></span>
              <h3 class="member-analysis__card-title">新客來源統計</h3>
            </div>
          </div>
          <div class="member-analysis__source-content">
            <!-- 環形圖（ECharts） -->
            <div class="member-analysis__source-chart-area">
              <VChart
                class="member-analysis__source-chart"
                :option="sourceChartOption"
                autoresize
              ></VChart>
            </div>
            <!-- 來源渠道列表 -->
            <div class="member-analysis__source-list">
              <div
                v-for="(item, index) in sourceStats"
                :key="item.sourceName"
                class="member-analysis__source-item"
              >
                <div class="member-analysis__source-item-left">
                  <span
                    class="member-analysis__source-dot"
                    :style="{ backgroundColor: sourceColors[index % sourceColors.length] }"
                  ></span>
                  <span class="member-analysis__source-name">{{ item.sourceName }}</span>
                </div>
                <div class="member-analysis__source-item-right">
                  <span class="member-analysis__source-count">{{ formatCount(item.sourceCount) }}</span>
                  <span class="member-analysis__source-ratio">{{ formatPercent(item.sourceRatio) }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ==================== 新客詳細名單 ==================== -->
        <section class="member-analysis__card member-analysis__card--full">
          <div class="member-analysis__card-header">
            <div class="member-analysis__card-title-wrapper">
              <span class="member-analysis__card-accent member-analysis__card-accent--detail"></span>
              <h3 class="member-analysis__card-title">新客詳細名單</h3>
            </div>
            <div class="member-analysis__card-header-actions">
              <button class="member-analysis__export-btn">
                <span class="material-symbols-outlined">download</span>
                匯出報表
              </button>
            </div>
          </div>
          <div class="member-analysis__table-scroll">
            <ElTable
              :data="newCustomerList.slice((currentPage - 1) * pageSize, currentPage * pageSize)"
              class="member-analysis__detail-table"
              stripe
              size="small"
              max-height="480"
            >
              <ElTableColumn label="會員編號" width="100" prop="id" />
              <ElTableColumn label="姓名" width="100" prop="name" />
              <ElTableColumn label="電話" width="140" prop="phone" />
              <ElTableColumn label="來源渠道" width="120" prop="source" />
              <ElTableColumn label="服務美療師" width="120" prop="staff" />
              <ElTableColumn label="到店日期" width="120" prop="date" />
              <ElTableColumn label="消費金額" width="120" align="right">
                <template #default="{ row }: { row: NewCustomerItem }">
                  <span class="member-analysis__detail-amount">{{ formatCurrency(row.amount) }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="狀態" width="100" align="center">
                <template #default="{ row }: { row: NewCustomerItem }">
                  <span
                    class="member-analysis__detail-status"
                    :class="{
                      'member-analysis__detail-status--success': row.status === '已成交',
                      'member-analysis__detail-status--pending': row.status === '未成交',
                    }"
                  >
                    {{ row.status }}
                  </span>
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
          <div class="member-analysis__pagination-wrapper">
            <ElPagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[5, 10, 20, 50]"
              :total="newCustomerList.length"
              layout="total, sizes, prev, pager, next, jumper"
              background
              small
            />
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
// ============================================================================
// 顏色變數
// ============================================================================
$color-primary: #c84c8f;
$color-primary-dark: #a22c70;
$color-secondary: #794c8f;
$color-surface: #fff8f8;
$color-surface-container: #fde9ef;
$color-surface-container-low: #fdf2f5;
$color-white: #ffffff;
$color-on-surface: #23191d;
$color-on-surface-variant: #554149;
$color-on-surface-muted: #8a7a7e;
$color-border: #f0e6e8;
$color-outline-variant: #f0e6e8;
$card-radius: 12px;
$card-shadow: 0 2px 12px rgba(#23191d, 0.06);
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-lg: 16px;
$spacing-xl: 20px;
$spacing-2xl: 24px;

// ============================================================================
// 主容器
// ============================================================================
.member-analysis {
  width: 100%;
  min-height: 100vh;
  background: $color-surface;
  padding: $spacing-2xl;

  &--tablet {
    padding: $spacing-lg;
  }

  &--desktop {
    padding: $spacing-2xl;
  }
}

// ============================================================================
// 頁面標題與操作列
// ============================================================================
.member-analysis__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-xl;
}

.member-analysis__breadcrumb {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: $spacing-sm;
}

.member-analysis__breadcrumb-item {
  font-size: 13px;
  color: $color-on-surface-muted;

  &--current {
    color: $color-on-surface-variant;
    font-weight: 500;
  }
}

.member-analysis__breadcrumb-separator {
  font-size: 14px;
  color: $color-on-surface-muted;
}

.member-analysis__title {
  font-size: 24px;
  font-weight: 600;
  color: $color-on-surface;
  margin: 0;
}

.member-analysis__header-actions {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.member-analysis__time-switcher {
  display: flex;
  gap: 2px;
  padding: 3px;
  background: $color-surface-container-low;
  border-radius: 8px;
  border: 1px solid $color-border;
}

.member-analysis__time-btn {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: $color-on-surface-variant;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
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
}

.member-analysis__date-range {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 13px;
  color: $color-on-surface-variant;
  background: $color-white;
  border: 1px solid $color-border;
  border-radius: 8px;
  cursor: pointer;

  .material-symbols-outlined {
    font-size: 16px;
    color: $color-on-surface-muted;
  }
}

// ============================================================================
// 頁籤導航
// ============================================================================
.member-analysis__tabs {
  display: flex;
  gap: 0;
  margin-bottom: $spacing-xl;
  border-bottom: 1px solid $color-outline-variant;
}

.member-analysis__tab {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: $color-on-surface-variant;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;

  &:hover {
    color: $color-primary;
  }

  &--active {
    color: $color-primary;
    border-bottom-color: $color-primary;
    font-weight: 600;
  }
}

// ============================================================================
// 錯誤狀態
// ============================================================================
.member-analysis__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.member-analysis__error-icon {
  font-size: 48px;
  color: #e74c3c;
  margin-bottom: $spacing-lg;
}

.member-analysis__error-text {
  font-size: 15px;
  color: $color-on-surface-variant;
  margin: 0 0 $spacing-lg;
}

.member-analysis__error-retry {
  padding: 8px 24px;
  font-size: 14px;
  font-weight: 500;
  color: $color-white;
  background: $color-primary;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s ease;

  &:hover {
    background: $color-primary-dark;
  }
}

// ============================================================================
// 空數據狀態
// ============================================================================
.member-analysis__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.member-analysis__empty-icon {
  font-size: 48px;
  color: $color-on-surface-muted;
  margin-bottom: $spacing-lg;
}

.member-analysis__empty-text {
  font-size: 15px;
  color: $color-on-surface-muted;
  margin: 0;
}

// ============================================================================
// 新客核心數據概覽（4 指標卡片）
// ============================================================================
.member-analysis__metrics {
  display: grid;
  gap: $spacing-lg;
  margin-bottom: $spacing-2xl;

  &--desktop {
    grid-template-columns: repeat(4, 1fr);
  }

  &--tablet {
    grid-template-columns: repeat(2, 1fr);
  }
}

.member-analysis__metric-card {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
  padding: $spacing-xl;
  background: $color-white;
  border-radius: $card-radius;
  box-shadow: $card-shadow;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(#23191d, 0.1);
  }
}

.member-analysis__metric-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;

  .material-symbols-outlined {
    font-size: 24px;
  }

  &--total {
    background: rgba($color-primary, 0.12);
    color: $color-primary;
  }

  &--month {
    background: rgba(#328517, 0.12);
    color: #328517;
  }

  &--week {
    background: rgba(#e8a838, 0.12);
    color: #e8a838;
  }

  &--day {
    background: rgba(#4a90d9, 0.12);
    color: #4a90d9;
  }
}

.member-analysis__metric-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.member-analysis__metric-label {
  font-size: 13px;
  color: $color-on-surface-muted;
  font-weight: 500;
}

.member-analysis__metric-value {
  font-size: 28px;
  font-weight: 700;
  color: $color-on-surface;
  line-height: 1.2;
}

.member-analysis__metric-value-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.member-analysis__metric-growth {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 13px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;

  &--up {
    color: #328517;
    background: rgba(#328517, 0.1);
  }

  &--down {
    color: #e74c3c;
    background: rgba(#e74c3c, 0.1);
  }
}

.member-analysis__metric-growth-icon {
  font-size: 16px !important;
}

// ============================================================================
// 12 欄網格內容區
// ============================================================================
.member-analysis__grid {
  display: grid;
  gap: $spacing-xl;
}

// ============================================================================
// 卡片通用
// ============================================================================
.member-analysis__card {
  background: $color-white;
  border-radius: $card-radius;
  box-shadow: $card-shadow;
  overflow: hidden;
}

.member-analysis__card--full {
  grid-column: 1 / -1;
}

.member-analysis__card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg $spacing-xl;
  border-bottom: 1px solid $color-border;
}

.member-analysis__card-title-wrapper {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.member-analysis__card-accent {
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: $color-primary;
  flex-shrink: 0;

  &--secondary {
    background: $color-secondary;
  }

  &--tertiary {
    background: #e8a838;
  }

  &--quaternary {
    background: #328517;
  }

  &--trend {
    background: #ac235a;
  }

  &--source {
    background: #c84c8f;
  }

  &--detail {
    background: $color-secondary;
  }
}

.member-analysis__card-title {
  font-size: 16px;
  font-weight: 600;
  color: $color-on-surface;
  margin: 0;
}

.member-analysis__card-time-label {
  font-size: 12px;
  color: $color-on-surface-muted;
}

.member-analysis__card-header-actions {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.member-analysis__view-all {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: $color-primary;
  background: rgba($color-primary, 0.08);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;

  &:hover {
    background: rgba($color-primary, 0.15);
  }
}

.member-analysis__export-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: $color-on-surface-variant;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;

  .material-symbols-outlined {
    font-size: 16px;
  }

  &:hover {
    background: $color-surface-container-low;
    border-color: $color-primary;
    color: $color-primary;
  }
}

// ============================================================================
// 客群組成比例（Donut Chart）
// ============================================================================
.member-analysis__card--mix {
  grid-column: span 4;
}

.member-analysis__mix-content {
  display: flex;
  align-items: center;
  gap: $spacing-xl;
  padding: $spacing-xl;
}

.member-analysis__donut-wrapper {
  position: relative;
  width: 140px;
  height: 140px;
  flex-shrink: 0;
}

.member-analysis__donut {
  width: 100%;
  height: 100%;
}

.member-analysis__donut-segment {
  transition: stroke-dashoffset 0.6s ease;
}

.member-analysis__donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.member-analysis__donut-value {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: $color-on-surface;
  line-height: 1.2;
}

.member-analysis__donut-label {
  display: block;
  font-size: 11px;
  color: $color-on-surface-muted;
  margin-top: 2px;
}

.member-analysis__mix-legend {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  flex: 1;
}

.member-analysis__mix-legend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.member-analysis__mix-legend-left {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.member-analysis__mix-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.member-analysis__mix-label {
  font-size: 14px;
  color: $color-on-surface-variant;
}

.member-analysis__mix-value {
  font-size: 14px;
  font-weight: 600;
  color: $color-on-surface;
}

// ============================================================================
// 美療師轉化表現（表格）
// ============================================================================
.member-analysis__card--staff {
  grid-column: span 8;
}

.member-analysis__table-scroll {
  overflow-x: auto;
}

.member-analysis__staff-table,
.member-analysis__detail-table {
  width: 100%;

  :deep(.el-table__header th) {
    background: $color-surface;
    color: $color-on-surface-variant;
    font-weight: 600;
    font-size: 13px;
  }

  :deep(.el-table__row) {
    font-size: 13px;
  }
}

.member-analysis__staff-name-cell {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.member-analysis__staff-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: $color-surface-container;
  color: $color-primary;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.member-analysis__staff-name {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: $color-on-surface;
}

.member-analysis__staff-title {
  display: block;
  font-size: 11px;
  color: $color-on-surface-muted;
}

.member-analysis__rank-medal {
  font-size: 18px;
}

.member-analysis__rank-num {
  font-size: 13px;
  font-weight: 600;
  color: $color-on-surface-muted;
}

.member-analysis__staff-count,
.member-analysis__staff-rate {
  font-weight: 600;
  color: $color-on-surface;
}

.member-analysis__staff-revenue {
  font-weight: 600;
  color: $color-primary;
}

// ============================================================================
// 新客職業分布 + 新客來源分析（雙欄 Pie Chart）
// ============================================================================
.member-analysis__grid-col-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-xl;
  grid-column: 1 / -1;
}

.member-analysis__pie-content {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
  padding: $spacing-lg;
}

.member-analysis__pie-chart-wrapper {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.member-analysis__pie-svg {
  width: 100%;
  height: 100%;
}

.member-analysis__pie-slice {
  transition: opacity 0.3s ease;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
}

.member-analysis__pie-legend {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  flex: 1;
}

.member-analysis__pie-legend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.member-analysis__pie-legend-left {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.member-analysis__pie-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.member-analysis__pie-label {
  font-size: 13px;
  color: $color-on-surface-variant;
}

.member-analysis__pie-value {
  font-size: 13px;
  font-weight: 600;
  color: $color-on-surface;
}

// ============================================================================
// 新客增長趨勢（ECharts 折線圖）
// ============================================================================
.member-analysis__trend-chart-area {
  padding: $spacing-lg;
}

.member-analysis__trend-chart {
  width: 100%;
  height: 400px;
}

// ============================================================================
// 新客來源統計（ECharts 環形圖 + 渠道列表）
// ============================================================================
.member-analysis__source-content {
  display: flex;
  gap: $spacing-xl;
  padding: $spacing-xl;
  align-items: stretch;
}

.member-analysis__source-chart-area {
  width: 280px;
  height: 280px;
  flex-shrink: 0;
}

.member-analysis__source-chart {
  width: 100%;
  height: 100%;
}

.member-analysis__source-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  justify-content: center;
  flex: 1;
  padding: 0 $spacing-lg;
}

.member-analysis__source-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-sm 0;
  border-bottom: 1px solid $color-border;

  &:last-child {
    border-bottom: none;
  }
}

.member-analysis__source-item-left {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.member-analysis__source-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.member-analysis__source-name {
  font-size: 14px;
  color: $color-on-surface-variant;
}

.member-analysis__source-item-right {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
}

.member-analysis__source-count {
  font-size: 14px;
  font-weight: 600;
  color: $color-on-surface;
  min-width: 60px;
  text-align: right;
}

.member-analysis__source-ratio {
  font-size: 13px;
  color: $color-on-surface-muted;
  min-width: 50px;
  text-align: right;
}

// ============================================================================
// 新客詳細名單（表格 + 分頁）
// ============================================================================
.member-analysis__detail-amount {
  font-weight: 600;
  color: $color-primary;
}

.member-analysis__detail-status {
  display: inline-block;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;

  &--success {
    color: #328517;
    background: rgba(#328517, 0.1);
  }

  &--pending {
    color: #e8a838;
    background: rgba(#e8a838, 0.1);
  }
}

.member-analysis__pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: $spacing-lg $spacing-xl;
  border-top: 1px solid $color-border;
}

// ============================================================================
// 平板響應式覆寫
// ============================================================================
.member-analysis--tablet {
  .member-analysis__header {
    flex-direction: column;
    gap: $spacing-md;
  }

  .member-analysis__header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .member-analysis__title {
    font-size: 20px;
  }

  .member-analysis__card--mix {
    grid-column: 1 / -1;
  }

  .member-analysis__card--staff {
    grid-column: 1 / -1;
  }

  .member-analysis__grid-col-2 {
    grid-template-columns: 1fr;
  }

  .member-analysis__mix-content {
    flex-direction: column;
    align-items: center;
  }

  .member-analysis__pie-content {
    flex-direction: column;
    align-items: center;
  }

  .member-analysis__source-content {
    flex-direction: column;
    align-items: center;
  }

  .member-analysis__source-chart-area {
    width: 240px;
    height: 240px;
  }

  .member-analysis__trend-chart {
    height: 300px;
  }

  .member-analysis__metric-value {
    font-size: 24px;
  }

  // 平板端卡片內容 padding 調整
  .member-analysis__card-header {
    padding: $spacing-md $spacing-lg;
  }

  .member-analysis__pie-content {
    padding: $spacing-md;
  }

  .member-analysis__source-content {
    padding: $spacing-lg;
  }

  .member-analysis__trend-chart-area {
    padding: $spacing-md;
  }

  .member-analysis__source-chart-area {
    width: 200px;
    height: 200px;
  }

  // 平板端表格字體調整
  .member-analysis__staff-table,
  .member-analysis__detail-table {
    :deep(.el-table__header th) {
      font-size: 12px;
    }
    :deep(.el-table__row) {
      font-size: 12px;
    }
  }

  // 平板端頁籤導航
  .member-analysis__tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }

  // 平板端防止水平溢出
  .member-analysis__table-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}

// ============================================================================
// 桌面端響應式覆寫
// ============================================================================
.member-analysis--desktop {
  .member-analysis__grid {
    grid-template-columns: repeat(12, 1fr);
  }
}

// ============================================================================
// 全局加載狀態樣式
// ============================================================================
.member-analysis {
  // ElLoading 自定義樣式
  :deep(.el-loading-mask) {
    border-radius: $card-radius;
  }

  :deep(.el-loading-spinner) {
    .circular {
      width: 36px;
      height: 36px;
    }
    .el-loading-text {
      font-size: 14px;
      color: $color-primary;
      margin-top: 8px;
    }
  }
}

</style>
