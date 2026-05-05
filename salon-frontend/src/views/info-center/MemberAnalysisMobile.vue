<!--
  MemberAnalysisMobile.vue - 會員分析 - 新客總覽（移動端）
  權限：店長 | 設備：移動端（<768px）
  設計稿：docs/UI設計稿/資訊中心/會員分析/會員分析-新客總覽-移動端.html
  技術棧：Vue 3 Composition API + TypeScript + SCSS + Element Plus
  說明：Step 5 - 接口聯調與真實數據綁定
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// ==================== 子組件導入 ====================
import MemberBackflowMobile from './MemberBackflowMobile.vue'

// ==================== API 導入 ====================
import { getNewCustomerAnalysisApi } from '@/api/info-center'
import type { NewCustomerAnalysisData, NewCustomerMetrics, NewCustomerTrendItem, SourceStatItem } from '@/api/info-center'

// ==================== ECharts 導入 ====================
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

// ==================== 型別定義 ====================
interface PieDataItem {
  label: string
  value: number
  color: string
}

interface NewCustomerCard {
  id: string
  name: string
  avatar: string
  phone: string
  source: string
  staff: string
  date: string
  amount: number
  status: string
  services: string[]
}

interface StaffPerformanceItem {
  rank: number
  name: string
  title: string
  newCustomers: number
  conversionRate: number
  revenue: number
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

// ==================== 頁籤導航 ====================
const tabs = [
  { key: 'overview', label: '新客總覽' },
  { key: 'return', label: '回流分析' },
  { key: 'basic', label: '基本分析' },
]
const activeTab = ref('overview')

// ==================== 時間選擇 ====================
const timePeriods = ['本季', '本月', '去年同期']
const selectedPeriod = ref('本月')

// ==================== 客群組成比例（靜態資料） ====================
const customerMix: PieDataItem[] = [
  { label: '新客', value: 45, color: '#c84c8f' },
  { label: '回流客', value: 30, color: '#794c8f' },
  { label: '忠實客', value: 25, color: '#e8d5db' },
]

// ==================== 近期成交新客（靜態資料） ====================
const recentCustomers: NewCustomerCard[] = [
  {
    id: 'C001', name: '吳佩珊', avatar: '吳', phone: '0912-345-678',
    source: 'LINE 預約', staff: '林美玲', date: '2025-05-04', amount: 4500,
    status: '已成交', services: ['深層清潔護理', '頭部舒壓按摩'],
  },
  {
    id: 'C002', name: '黃雅琳', avatar: '黃', phone: '0987-654-321',
    source: 'Google 地圖', staff: '張雅婷', date: '2025-05-04', amount: 3200,
    status: '已成交', services: ['玻尿酸保濕導入'],
  },
  {
    id: 'C003', name: '劉怡君', avatar: '劉', phone: '0923-456-789',
    source: 'Instagram', staff: '王怡君', date: '2025-05-03', amount: 5800,
    status: '已成交', services: ['全身精油舒壓', '背部去角質'],
  },
]

// ==================== 客源管道分佈（靜態資料） ====================
const channelData: PieDataItem[] = [
  { label: 'LINE 預約', value: 35, color: '#c84c8f' },
  { label: 'Google 地圖', value: 25, color: '#794c8f' },
  { label: 'Instagram', value: 18, color: '#e8d5db' },
  { label: '朋友推薦', value: 15, color: '#f0d6df' },
  { label: '其他', value: 7, color: '#dcc7e1' },
]

// ==================== 職業類型分析（靜態資料） ====================
const occupationData: PieDataItem[] = [
  { label: '上班族', value: 45, color: '#c84c8f' },
  { label: '家管', value: 20, color: '#794c8f' },
  { label: '自由業', value: 18, color: '#e8d5db' },
  { label: '學生', value: 10, color: '#f0d6df' },
  { label: '其他', value: 7, color: '#dcc7e1' },
]

// ==================== 美容師新客開發績效（靜態資料） ====================
const staffPerformance: StaffPerformanceItem[] = [
  { rank: 1, name: '林美玲', title: '資深美療師', newCustomers: 28, conversionRate: 85, revenue: 168000 },
  { rank: 2, name: '張雅婷', title: '美療師', newCustomers: 22, conversionRate: 78, revenue: 132000 },
  { rank: 3, name: '王怡君', title: '資深美療師', newCustomers: 19, conversionRate: 72, revenue: 114000 },
]

// ==================== Step 5：新客增長趨勢（API 數據）====================

/** 新客增長趨勢數據 */
const trendData = ref<NewCustomerTrendItem[]>([])

/** ECharts 折線圖配置 - 新客增長趨勢（移動端） */
const trendChartOption = computed(() => {
  const data = trendData.value
  if (!data || data.length === 0) return {}

  return {
    grid: {
      left: 36,
      right: 12,
      top: 16,
      bottom: 28,
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date.slice(5)),
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontSize: 10,
        color: '#8a7a7e',
        fontWeight: 500,
        interval: 5,
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
        fontSize: 10,
        color: '#8a7a7e',
      },
    },
    series: [
      {
        type: 'line',
        data: data.map(item => item.newCustomerCount),
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          width: 2,
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
      padding: [8, 12],
      textStyle: {
        fontSize: 12,
        color: '#23191d',
      },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        const item = data[p.dataIndex]
        return `<strong>${item.date}</strong><br/>新客數：<strong style="color:#ac235a">${item.newCustomerCount.toLocaleString()} 人</strong>`
      },
    },
  }
})

// ==================== 工具函數 ====================
function formatCurrency(value: number): string {
  return `$${value.toLocaleString('zh-TW')}`
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

// ==================== Step 5：新客來源統計（API 數據）====================

/** 新客來源統計數據 */
const sourceStats = ref<SourceStatItem[]>([])

/** 新客來源統計 - 環形圖配色（與系統色系統一） */
const sourceColors = ['#c84c8f', '#794c8f', '#e8a838', '#328517', '#dcc7e1']

/** 新客來源統計 - 環形圖 ECharts 配置（移動端） */
const sourceChartOption = computed(() => {
  const data = sourceStats.value
  if (!data || data.length === 0) return {}

  return {
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: '#fff',
      borderColor: '#f0e6e8',
      borderWidth: 1,
      borderRadius: 8,
      padding: [8, 12],
      textStyle: {
        fontSize: 12,
        color: '#23191d',
      },
      formatter: (params: any) => {
        return `<strong>${params.name}</strong><br/>新客數：<strong style="color:#c84c8f">${params.value} 人</strong><br/>佔比：${params.percent}%`
      },
    },
    legend: {
      show: false,
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
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
            fontSize: 12,
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

// ==================== 工具函數 ====================
/** 格式化新客數量（千分位） */
function formatCount(value: number): string {
  return value.toLocaleString('zh-TW')
}

/** 格式化百分比（保留1位小數 + %後綴） */
function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

// ==================== Step 5：API 數據加載 ====================

/**
 * 加載新客分析數據
 * 在 onMounted 生命週期中調用，獲取全量數據
 * 包含加載狀態、空數據狀態、接口異常捕獲
 */
async function fetchNewCustomerData() {
  loading.value = true
  loadError.value = null

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
  }
}

onMounted(() => {
  fetchNewCustomerData()
})
</script>

<template>
  <div class="member-analysis-mobile">
    <!-- ==================== 頁面標題 ==================== -->
    <div class="member-analysis-mobile__header">
      <nav class="member-analysis-mobile__breadcrumb">
        <span class="member-analysis-mobile__breadcrumb-item">會員管理</span>
        <span class="member-analysis-mobile__breadcrumb-separator material-symbols-outlined">chevron_right</span>
        <span class="member-analysis-mobile__breadcrumb-item member-analysis-mobile__breadcrumb-item--current">會員分析</span>
      </nav>
      <h1 class="member-analysis-mobile__title">新客分析總覽</h1>
    </div>

    <!-- ==================== 黏性頁籤導航 ==================== -->
    <div class="member-analysis-mobile__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="member-analysis-mobile__tab"
        :class="{ 'member-analysis-mobile__tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ==================== 篩選條件列 ==================== -->
    <div class="member-analysis-mobile__filters">
      <div class="member-analysis-mobile__filter-row">
        <div class="member-analysis-mobile__time-switcher">
          <button
            v-for="period in timePeriods"
            :key="period"
            class="member-analysis-mobile__time-btn"
            :class="{ 'member-analysis-mobile__time-btn--active': period === selectedPeriod }"
            @click="selectedPeriod = period"
          >
            {{ period }}
          </button>
        </div>
        <button class="member-analysis-mobile__date-btn">
          <span class="material-symbols-outlined">calendar_today</span>
          <span>2025-01-01 ~ 2025-05-05</span>
        </button>
      </div>
    </div>

    <!-- ==================== 錯誤狀態 ==================== -->
    <div v-if="loadError" class="member-analysis-mobile__error">
      <span class="material-symbols-outlined member-analysis-mobile__error-icon">error_outline</span>
      <p class="member-analysis-mobile__error-text">{{ loadError }}</p>
      <button class="member-analysis-mobile__error-retry" @click="fetchNewCustomerData">重新加載</button>
    </div>

    <!-- ==================== 空數據狀態 ==================== -->
    <div v-else-if="isEmpty" class="member-analysis-mobile__empty">
      <span class="material-symbols-outlined member-analysis-mobile__empty-icon">inbox</span>
      <p class="member-analysis-mobile__empty-text">暫無新客數據</p>
    </div>

    <!-- ==================== 主要內容（加載完成且有數據）==================== -->
    <template v-else>
      <!-- ==================== 回流分析頁面 ==================== -->
      <MemberBackflowMobile v-if="activeTab === 'return'" />

      <!-- ==================== 新客總覽內容 ==================== -->
      <template v-if="activeTab === 'overview'">
      <!-- ==================== 新客核心數據概覽（4 指標卡片）==================== -->
      <div class="member-analysis-mobile__metrics">
        <!-- 指標 1：累計總新客數 -->
        <div class="member-analysis-mobile__metric-card">
          <div class="member-analysis-mobile__metric-icon member-analysis-mobile__metric-icon--total">
            <span class="material-symbols-outlined">group_add</span>
          </div>
          <div class="member-analysis-mobile__metric-info">
            <span class="member-analysis-mobile__metric-label">累計總新客數</span>
            <span class="member-analysis-mobile__metric-value">{{ formatCount(newCustomerMetrics?.totalNewCustomer ?? 0) }}</span>
          </div>
        </div>

        <!-- 指標 2：本月新增新客數 -->
        <div class="member-analysis-mobile__metric-card">
          <div class="member-analysis-mobile__metric-icon member-analysis-mobile__metric-icon--month">
            <span class="material-symbols-outlined">calendar_month</span>
          </div>
          <div class="member-analysis-mobile__metric-info">
            <span class="member-analysis-mobile__metric-label">本月新增新客</span>
            <div class="member-analysis-mobile__metric-value-row">
              <span class="member-analysis-mobile__metric-value">{{ formatCount(newCustomerMetrics?.monthNewCustomer ?? 0) }}</span>
              <span
                class="member-analysis-mobile__metric-growth"
                :class="{
                  'member-analysis-mobile__metric-growth--up': growthRateDirection === 'up',
                  'member-analysis-mobile__metric-growth--down': growthRateDirection === 'down',
                }"
              >
                <span class="material-symbols-outlined member-analysis-mobile__metric-growth-icon">
                  {{ growthRateDirection === 'up' ? 'trending_up' : 'trending_down' }}
                </span>
                {{ growthRateDisplay }}
              </span>
            </div>
          </div>
        </div>

        <!-- 指標 3：本周新增新客數 -->
        <div class="member-analysis-mobile__metric-card">
          <div class="member-analysis-mobile__metric-icon member-analysis-mobile__metric-icon--week">
            <span class="material-symbols-outlined">date_range</span>
          </div>
          <div class="member-analysis-mobile__metric-info">
            <span class="member-analysis-mobile__metric-label">本周新增新客</span>
            <span class="member-analysis-mobile__metric-value">{{ formatCount(newCustomerMetrics?.weekNewCustomer ?? 0) }}</span>
          </div>
        </div>

        <!-- 指標 4：今日新增新客數 -->
        <div class="member-analysis-mobile__metric-card">
          <div class="member-analysis-mobile__metric-icon member-analysis-mobile__metric-icon--day">
            <span class="material-symbols-outlined">today</span>
          </div>
          <div class="member-analysis-mobile__metric-info">
            <span class="member-analysis-mobile__metric-label">今日新增新客</span>
            <span class="member-analysis-mobile__metric-value">{{ formatCount(newCustomerMetrics?.dayNewCustomer ?? 0) }}</span>
          </div>
        </div>
      </div>

    <!-- ==================== 內容區塊 ==================== -->
    <div class="member-analysis-mobile__content">
      <!-- 區塊 1：客群組成比例 -->
      <section class="member-analysis-mobile__card">
        <div class="member-analysis-mobile__card-header">
          <div class="member-analysis-mobile__card-title-wrapper">
            <span class="member-analysis-mobile__card-accent"></span>
            <h3 class="member-analysis-mobile__card-title">客群組成比例</h3>
          </div>
        </div>
        <div class="member-analysis-mobile__donut-section">
          <div class="member-analysis-mobile__donut-wrapper">
            <svg class="member-analysis-mobile__donut" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f0e6e8" stroke-width="16" />
              <circle
                v-for="(item, i) in customerMix"
                :key="item.label"
                cx="50" cy="50" r="42" fill="none"
                :stroke="item.color" stroke-width="16" stroke-linecap="butt"
                :stroke-dasharray="donutDashArray(item.value)"
                :stroke-dashoffset="donutDashOffset(i, customerMix)"
                transform="rotate(-90 50 50)"
                class="member-analysis-mobile__donut-segment"
              />
            </svg>
            <div class="member-analysis-mobile__donut-center">
              <span class="member-analysis-mobile__donut-value">{{ customerMix[0].value }}%</span>
              <span class="member-analysis-mobile__donut-label">新客佔比</span>
            </div>
          </div>
          <div class="member-analysis-mobile__donut-legend">
            <div v-for="item in customerMix" :key="item.label" class="member-analysis-mobile__legend-item">
              <span class="member-analysis-mobile__legend-dot" :style="{ backgroundColor: item.color }"></span>
              <span class="member-analysis-mobile__legend-label">{{ item.label }}</span>
              <span class="member-analysis-mobile__legend-value">{{ item.value }}%</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 區塊 2：近期成交新客 -->
      <section class="member-analysis-mobile__section">
        <div class="member-analysis-mobile__section-header">
          <h3 class="member-analysis-mobile__section-title">近期成交新客</h3>
          <button class="member-analysis-mobile__section-more">查看全部</button>
        </div>
        <div class="member-analysis-mobile__customer-list">
          <div
            v-for="customer in recentCustomers"
            :key="customer.id"
            class="member-analysis-mobile__customer-card"
          >
            <div class="member-analysis-mobile__customer-top">
              <div class="member-analysis-mobile__customer-info">
                <div class="member-analysis-mobile__customer-avatar">{{ customer.avatar }}</div>
                <div>
                  <div class="member-analysis-mobile__customer-name">{{ customer.name }}</div>
                  <div class="member-analysis-mobile__customer-meta">{{ customer.source }} · {{ customer.staff }}</div>
                </div>
              </div>
              <span
                class="member-analysis-mobile__customer-status"
                :class="{
                  'member-analysis-mobile__customer-status--success': customer.status === '已成交',
                  'member-analysis-mobile__customer-status--pending': customer.status === '未成交',
                }"
              >
                {{ customer.status }}
              </span>
            </div>
            <div class="member-analysis-mobile__customer-details">
              <div class="member-analysis-mobile__detail-item">
                <span class="member-analysis-mobile__detail-label">日期</span>
                <span class="member-analysis-mobile__detail-value">{{ customer.date }}</span>
              </div>
              <div class="member-analysis-mobile__detail-item">
                <span class="member-analysis-mobile__detail-label">消費</span>
                <span class="member-analysis-mobile__detail-value member-analysis-mobile__detail-value--amount">{{ formatCurrency(customer.amount) }}</span>
              </div>
              <div class="member-analysis-mobile__detail-item member-analysis-mobile__detail-item--full">
                <span class="member-analysis-mobile__detail-label">服務項目</span>
                <div class="member-analysis-mobile__service-tags">
                  <span v-for="svc in customer.services" :key="svc" class="member-analysis-mobile__service-tag">{{ svc }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== Step 3：新客增長趨勢圖表 ==================== -->
      <section class="member-analysis-mobile__section">
        <div class="member-analysis-mobile__section-header">
          <h3 class="member-analysis-mobile__section-title">新客增長趨勢</h3>
          <span class="member-analysis-mobile__section-time-label">最近 30 天</span>
        </div>
        <div class="member-analysis-mobile__trend-card">
          <VChart
            class="member-analysis-mobile__trend-chart"
            :option="trendChartOption"
            autoresize
          ></VChart>
        </div>
      </section>

      <!-- 區塊 3：客源管道分佈 + 職業類型分析 -->
      <section class="member-analysis-mobile__section">
        <div class="member-analysis-mobile__section-header">
          <h3 class="member-analysis-mobile__section-title">客源管道分佈</h3>
        </div>
        <div class="member-analysis-mobile__channel-card">
          <div class="member-analysis-mobile__bar-chart">
            <div
              v-for="item in channelData"
              :key="item.label"
              class="member-analysis-mobile__bar-row"
            >
              <span class="member-analysis-mobile__bar-label">{{ item.label }}</span>
              <div class="member-analysis-mobile__bar-track">
                <div
                  class="member-analysis-mobile__bar-fill"
                  :style="{ width: item.value + '%', backgroundColor: item.color }"
                ></div>
              </div>
              <span class="member-analysis-mobile__bar-value">{{ item.value }}%</span>
            </div>
          </div>
        </div>
      </section>

      <section class="member-analysis-mobile__section">
        <div class="member-analysis-mobile__section-header">
          <h3 class="member-analysis-mobile__section-title">職業類型分析</h3>
        </div>
        <div class="member-analysis-mobile__occupation-card">
          <div class="member-analysis-mobile__stacked-bar">
            <div class="member-analysis-mobile__stacked-track">
              <div
                v-for="item in occupationData"
                :key="item.label"
                class="member-analysis-mobile__stacked-segment"
                :style="{ width: item.value + '%', backgroundColor: item.color }"
                :title="item.label + ': ' + item.value + '%'"
              ></div>
            </div>
          </div>
          <div class="member-analysis-mobile__occupation-legend">
            <div v-for="item in occupationData" :key="item.label" class="member-analysis-mobile__occ-item">
              <span class="member-analysis-mobile__occ-dot" :style="{ backgroundColor: item.color }"></span>
              <span class="member-analysis-mobile__occ-label">{{ item.label }}</span>
              <span class="member-analysis-mobile__occ-value">{{ item.value }}%</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 區塊 4：美容師新客開發績效 -->
      <section class="member-analysis-mobile__section">
        <div class="member-analysis-mobile__section-header">
          <h3 class="member-analysis-mobile__section-title">美容師新客開發績效</h3>
          <button class="member-analysis-mobile__section-more">查看全部</button>
        </div>
        <div class="member-analysis-mobile__staff-table-wrapper">
          <table class="member-analysis-mobile__staff-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>姓名</th>
                <th>新客數</th>
                <th>轉化率</th>
                <th>業績</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="staff in staffPerformance" :key="staff.rank">
                <td>
                  <span v-if="staff.rank <= 3" class="member-analysis-mobile__rank-medal">{{ ['🥇', '🥈', '🥉'][staff.rank - 1] }}</span>
                  <span v-else class="member-analysis-mobile__rank-num">{{ staff.rank }}</span>
                </td>
                <td>
                  <div class="member-analysis-mobile__staff-cell">
                    <div class="member-analysis-mobile__staff-avatar">{{ staff.name.charAt(0) }}</div>
                    <div>
                      <div class="member-analysis-mobile__staff-name">{{ staff.name }}</div>
                      <div class="member-analysis-mobile__staff-title">{{ staff.title }}</div>
                    </div>
                  </div>
                </td>
                <td class="member-analysis-mobile__text-primary">{{ staff.newCustomers }}</td>
                <td class="member-analysis-mobile__text-success">{{ staff.conversionRate }}%</td>
                <td class="member-analysis-mobile__text-right">{{ formatCurrency(staff.revenue) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ==================== Step 4：新客來源統計模組（ECharts 環形圖 + 列表）==================== -->
      <section class="member-analysis-mobile__section">
        <div class="member-analysis-mobile__section-header">
          <h3 class="member-analysis-mobile__section-title">新客來源統計</h3>
        </div>
        <div class="member-analysis-mobile__source-card">
          <!-- 上方：ECharts 環形圖 -->
          <div class="member-analysis-mobile__source-chart-wrapper">
            <VChart
              class="member-analysis-mobile__source-chart"
              :option="sourceChartOption"
              autoresize
            ></VChart>
          </div>
          <!-- 下方：渠道列表 -->
          <div class="member-analysis-mobile__source-list">
            <div
              v-for="(item, index) in sourceStats"
              :key="item.sourceName"
              class="member-analysis-mobile__source-list-item"
            >
              <div class="member-analysis-mobile__source-list-left">
                <span
                  class="member-analysis-mobile__source-dot"
                  :style="{ backgroundColor: sourceColors[index % sourceColors.length] }"
                ></span>
                <span class="member-analysis-mobile__source-name">{{ item.sourceName }}</span>
              </div>
              <div class="member-analysis-mobile__source-list-right">
                <span class="member-analysis-mobile__source-count">{{ formatCount(item.sourceCount) }} 人</span>
                <span class="member-analysis-mobile__source-ratio">{{ formatPercent(item.sourceRatio) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
      </template><!-- end overview -->
  </template>
</div>
</template>

<style scoped lang="scss">
// ============================================================================
// 系統顏色變數（與 InfoCenterView 統一）
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
// 響應式斷點
// ============================================================================
$breakpoint-tablet: 768px;
$breakpoint-desktop: 1200px;

// ============================================================================
// 主容器 - 防止水平溢出 + 平滑滾動
// ============================================================================
.member-analysis-mobile {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  min-height: 100vh;
  background: $color-surface;
  padding-bottom: 80px; // 為底部導航留空間
  -webkit-overflow-scrolling: touch;

  // 平板端（768px ~ 1199px）優化
  @media (min-width: $breakpoint-tablet) and (max-width: 1199px) {
    padding-bottom: 40px;
    max-width: 100%;
  }

  // 桌面端（≥1200px）居中限制最大寬度
  @media (min-width: $breakpoint-desktop) {
    max-width: 1200px;
    margin: 0 auto;
    padding: $spacing-2xl;
    padding-bottom: 40px;
  }
}

// ============================================================================
// 頁面標題
// ============================================================================
.member-analysis-mobile__header {
  padding: $spacing-lg $spacing-lg $spacing-md;
  background: $color-white;
}

.member-analysis-mobile__breadcrumb {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: $spacing-sm;
}

.member-analysis-mobile__breadcrumb-item {
  font-size: 12px;
  color: $color-on-surface-muted;

  &--current {
    color: $color-on-surface-variant;
    font-weight: 500;
  }
}

.member-analysis-mobile__breadcrumb-separator {
  font-size: 14px;
  color: $color-on-surface-muted;
}

.member-analysis-mobile__title {
  font-size: 20px;
  font-weight: 600;
  color: $color-on-surface;
  margin: 0;
}

// ============================================================================
// 黏性頁籤導航
// ============================================================================
.member-analysis-mobile__tabs {
  display: flex;
  overflow-x: auto;
  gap: 0;
  padding: 0 $spacing-lg;
  border-bottom: 1px solid $color-outline-variant;
  background: $color-white;
  position: sticky;
  top: 0;
  z-index: 10;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.member-analysis-mobile__tab {
  flex-shrink: 0;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: $color-on-surface-variant;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  white-space: nowrap;

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
// 篩選條件列
// ============================================================================
.member-analysis-mobile__filters {
  padding: $spacing-md $spacing-lg;
  background: $color-white;
}

.member-analysis-mobile__filter-row {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.member-analysis-mobile__time-switcher {
  display: flex;
  gap: 2px;
  padding: 3px;
  background: $color-surface;
  border-radius: 8px;
  border: 1px solid $color-border;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.member-analysis-mobile__time-btn {
  flex-shrink: 0;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
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
}

.member-analysis-mobile__date-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  font-size: 12px;
  color: $color-on-surface-variant;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  width: 100%;
  justify-content: center;

  .material-symbols-outlined {
    font-size: 16px;
    color: $color-on-surface-muted;
  }
}

// ============================================================================
// 內容區塊
// ============================================================================
.member-analysis-mobile__content {
  padding: $spacing-md $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

// ============================================================================
// 卡片通用
// ============================================================================
.member-analysis-mobile__card {
  background: $color-white;
  border-radius: $card-radius;
  border: 1px solid $color-border;
  box-shadow: $card-shadow;
  padding: $spacing-lg;
}

.member-analysis-mobile__card-header {
  display: flex;
  align-items: center;
  margin-bottom: $spacing-lg;
}

.member-analysis-mobile__card-title-wrapper {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.member-analysis-mobile__card-accent {
  width: 4px;
  height: 16px;
  border-radius: 2px;
  background: $color-primary;
  flex-shrink: 0;
}

.member-analysis-mobile__card-title {
  font-size: 15px;
  font-weight: 600;
  color: $color-on-surface;
  margin: 0;
}

// ============================================================================
// Donut Chart
// ============================================================================
.member-analysis-mobile__donut-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-lg;
}

.member-analysis-mobile__donut-wrapper {
  position: relative;
  width: 180px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.member-analysis-mobile__donut {
  width: 100%;
  height: 100%;
}

.member-analysis-mobile__donut-segment {
  transition: stroke-dashoffset 0.5s ease;
}

.member-analysis-mobile__donut-center {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.member-analysis-mobile__donut-value {
  font-size: 24px;
  font-weight: 700;
  color: $color-primary;
  line-height: 1;
}

.member-analysis-mobile__donut-label {
  font-size: 11px;
  color: $color-on-surface-muted;
  margin-top: 2px;
}

.member-analysis-mobile__donut-legend {
  display: flex;
  gap: $spacing-xl;
  justify-content: center;
}

.member-analysis-mobile__legend-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.member-analysis-mobile__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.member-analysis-mobile__legend-label {
  font-size: 12px;
  color: $color-on-surface;
}

.member-analysis-mobile__legend-value {
  font-size: 12px;
  font-weight: 600;
  color: $color-on-surface;
}

// ============================================================================
// 區塊通用
// ============================================================================
.member-analysis-mobile__section {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.member-analysis-mobile__section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.member-analysis-mobile__section-title {
  font-size: 15px;
  font-weight: 600;
  color: $color-on-surface;
  margin: 0;
}

.member-analysis-mobile__section-more {
  font-size: 13px;
  color: $color-primary;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  font-family: inherit;

  &:hover {
    text-decoration: underline;
  }
}

// ============================================================================
// 近期成交新客卡片
// ============================================================================
.member-analysis-mobile__customer-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.member-analysis-mobile__customer-card {
  background: $color-white;
  border-radius: $card-radius;
  border: 1px solid $color-border;
  box-shadow: $card-shadow;
  padding: $spacing-lg;
}

.member-analysis-mobile__customer-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-md;
}

.member-analysis-mobile__customer-info {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.member-analysis-mobile__customer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, $color-primary, $color-secondary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.member-analysis-mobile__customer-name {
  font-size: 14px;
  font-weight: 600;
  color: $color-on-surface;
}

.member-analysis-mobile__customer-meta {
  font-size: 12px;
  color: $color-on-surface-muted;
  margin-top: 2px;
}

.member-analysis-mobile__customer-status {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 4px;
  font-weight: 500;
  flex-shrink: 0;

  &--success {
    background: rgba(#328517, 0.1);
    color: #328517;
  }

  &--pending {
    background: rgba(#e8a838, 0.1);
    color: #e8a838;
  }
}

.member-analysis-mobile__customer-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-sm;
  border-top: 1px dashed $color-border;
  padding-top: $spacing-md;
}

.member-analysis-mobile__detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;

  &--full {
    grid-column: 1 / -1;
  }
}

.member-analysis-mobile__detail-label {
  font-size: 11px;
  color: $color-on-surface-muted;
}

.member-analysis-mobile__detail-value {
  font-size: 13px;
  color: $color-on-surface;

  &--amount {
    font-weight: 600;
    color: $color-primary;
  }
}

.member-analysis-mobile__service-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.member-analysis-mobile__service-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 4px;
  background: $color-surface;
  color: $color-on-surface-variant;
}

// ============================================================================
// 橫條圖
// ============================================================================
.member-analysis-mobile__channel-card,
.member-analysis-mobile__occupation-card {
  background: $color-white;
  border-radius: $card-radius;
  border: 1px solid $color-border;
  box-shadow: $card-shadow;
  padding: $spacing-lg;
}

.member-analysis-mobile__bar-chart {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.member-analysis-mobile__bar-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.member-analysis-mobile__bar-label {
  width: 70px;
  font-size: 13px;
  color: $color-on-surface;
  flex-shrink: 0;
}

.member-analysis-mobile__bar-track {
  flex: 1;
  height: 20px;
  background: $color-surface;
  border-radius: 10px;
  overflow: hidden;
}

.member-analysis-mobile__bar-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s ease;
  min-width: 4px;
}

.member-analysis-mobile__bar-value {
  width: 40px;
  font-size: 13px;
  font-weight: 600;
  color: $color-on-surface;
  text-align: right;
  flex-shrink: 0;
}

// ============================================================================
// 堆疊橫條圖
// ============================================================================
.member-analysis-mobile__stacked-bar {
  margin-bottom: $spacing-lg;
}

.member-analysis-mobile__stacked-track {
  display: flex;
  height: 24px;
  border-radius: 12px;
  overflow: hidden;
}

.member-analysis-mobile__stacked-segment {
  height: 100%;
  transition: width 0.5s ease;
}

.member-analysis-mobile__occupation-legend {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-sm;
}

.member-analysis-mobile__occ-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.member-analysis-mobile__occ-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.member-analysis-mobile__occ-label {
  font-size: 12px;
  color: $color-on-surface;
  flex: 1;
}

.member-analysis-mobile__occ-value {
  font-size: 12px;
  font-weight: 600;
  color: $color-on-surface;
}

// ============================================================================
// 美容師績效表格
// ============================================================================
.member-analysis-mobile__staff-table-wrapper {
  background: $color-white;
  border-radius: $card-radius;
  border: 1px solid $color-border;
  box-shadow: $card-shadow;
  overflow: hidden;
}

.member-analysis-mobile__staff-table {
  width: 100%;
  border-collapse: collapse;

  thead {
    background: $color-surface-container-low;
  }

  th {
    padding: 12px $spacing-md;
    font-size: 12px;
    font-weight: 500;
    color: $color-on-surface-variant;
    text-align: left;
    white-space: nowrap;
  }

  td {
    padding: 12px $spacing-md;
    font-size: 13px;
    color: $color-on-surface;
    border-top: 1px solid $color-border;
  }

  tbody tr:first-child td {
    border-top: none;
  }
}

.member-analysis-mobile__staff-cell {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.member-analysis-mobile__staff-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, $color-primary, $color-secondary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.member-analysis-mobile__staff-name {
  font-size: 13px;
  font-weight: 500;
  color: $color-on-surface;
  line-height: 1.3;
}

.member-analysis-mobile__staff-title {
  font-size: 11px;
  color: $color-on-surface-muted;
  line-height: 1.3;
}

.member-analysis-mobile__rank-medal {
  font-size: 16px;
}

.member-analysis-mobile__rank-num {
  font-size: 12px;
  font-weight: 600;
  color: $color-on-surface-muted;
}

.member-analysis-mobile__text-primary {
  color: $color-primary;
  font-weight: 600;
}

.member-analysis-mobile__text-success {
  color: #328517;
  font-weight: 500;
}

.member-analysis-mobile__text-right {
  text-align: right;
  font-weight: 600;
}

// ============================================================================
// 新客核心數據概覽（4 指標卡片）- 移動端
// ============================================================================

/** 指標網格容器 - 移動端 2x2 排列 */
.member-analysis-mobile__metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-md;
  padding: $spacing-md $spacing-lg;
}

/** 單個指標卡片 */
.member-analysis-mobile__metric-card {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-lg;
  background: $color-white;
  border-radius: $card-radius;
  border: 1px solid $color-border;
  box-shadow: $card-shadow;
}

/** 指標圖標容器 */
.member-analysis-mobile__metric-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .material-symbols-outlined {
    font-size: 20px;
    color: $color-white;
  }

  &--total {
    background: linear-gradient(135deg, $color-primary, #cc3e73);
  }

  &--month {
    background: linear-gradient(135deg, #794c8f, #9b6db0);
  }

  &--week {
    background: linear-gradient(135deg, #328517, #4aad2a);
  }

  &--day {
    background: linear-gradient(135deg, #e8a838, #f0c05a);
  }
}

/** 指標資訊區 */
.member-analysis-mobile__metric-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

/** 指標標籤 */
.member-analysis-mobile__metric-label {
  font-size: 11px;
  font-weight: 500;
  line-height: 14px;
  color: $color-on-surface-variant;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/** 指標數值 */
.member-analysis-mobile__metric-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 28px;
  color: $color-primary;
  font-variant-numeric: tabular-nums;
}

/** 指標數值行（含增長率） */
.member-analysis-mobile__metric-value-row {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  flex-wrap: wrap;
}

/** 增長率標籤 */
.member-analysis-mobile__metric-growth {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  padding: 1px 6px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 600;
  line-height: 14px;
  white-space: nowrap;

  &--up {
    color: #d32f2f;
    background: rgba(#d32f2f, 0.08);
  }

  &--down {
    color: #2e7d32;
    background: rgba(#2e7d32, 0.08);
  }
}

/** 增長率圖標 */
.member-analysis-mobile__metric-growth-icon {
  font-size: 12px;
  font-variation-settings: 'FILL' 1;
}

// ============================================================================
// Step 3：新客增長趨勢圖表（ECharts 折線圖）- 移動端
// ============================================================================

/** 區塊時間標籤 */
.member-analysis-mobile__section-time-label {
  font-size: 11px;
  color: $color-on-surface-muted;
  font-weight: 500;
}

/** 趨勢圖表卡片容器 */
.member-analysis-mobile__trend-card {
  background: $color-white;
  border-radius: $card-radius;
  border: 1px solid $color-border;
  box-shadow: $card-shadow;
  padding: $spacing-md;
}

/** ECharts 折線圖 - 移動端高度 300px，自適應縮放 */
.member-analysis-mobile__trend-chart {
  width: 100%;
  height: 300px;
}

// ============================================================================
// Step 4：新客來源統計模組（ECharts 環形圖 + 列表）- 移動端
// ============================================================================

/** 新客來源統計卡片容器 - 移動端垂直堆叠 */
.member-analysis-mobile__source-card {
  background: $color-white;
  border-radius: $card-radius;
  border: 1px solid $color-border;
  box-shadow: $card-shadow;
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xl;
}

/** ECharts 環形圖容器 - 移動端 */
.member-analysis-mobile__source-chart-wrapper {
  width: 200px;
  height: 200px;
  flex-shrink: 0;
}

/** ECharts 環形圖 - 移動端 */
.member-analysis-mobile__source-chart {
  width: 100%;
  height: 100%;
}

/** 渠道列表容器 - 移動端 */
.member-analysis-mobile__source-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

/** 單個渠道列表項 - 移動端 */
.member-analysis-mobile__source-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md $spacing-md;
  background: $color-surface;
  border-radius: 8px;
}

/** 渠道列表左側（圓點 + 名稱） */
.member-analysis-mobile__source-list-left {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

/** 渠道圓點 */
.member-analysis-mobile__source-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/** 渠道名稱 */
.member-analysis-mobile__source-name {
  font-size: 14px;
  font-weight: 500;
  color: $color-on-surface;
}

/** 渠道列表右側（數量 + 占比） */
.member-analysis-mobile__source-list-right {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  flex-shrink: 0;
}

/** 渠道新客數量 */
.member-analysis-mobile__source-count {
  font-size: 13px;
  font-weight: 500;
  color: $color-on-surface-variant;
  font-variant-numeric: tabular-nums;
}

/** 渠道占比（含 % 後綴） */
.member-analysis-mobile__source-ratio {
  font-size: 14px;
  font-weight: 700;
  color: $color-primary;
  min-width: 50px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

// ============================================================================
// 平板響應式覆寫（768px ~ 1199px）
// ============================================================================
@media (min-width: 768px) and (max-width: 1199px) {
  .member-analysis-mobile {
    // 平板端指標卡片改為 4 列
    &__metrics {
      grid-template-columns: repeat(4, 1fr);
      padding: $spacing-lg $spacing-xl;
    }

    &__metric-card {
      flex-direction: column;
      align-items: flex-start;
      padding: $spacing-lg;
    }

    &__metric-icon {
      width: 36px;
      height: 36px;

      .material-symbols-outlined {
        font-size: 18px;
      }
    }

    &__metric-value {
      font-size: 20px;
      line-height: 26px;
    }

    &__metric-label {
      font-size: 12px;
    }

    // 平板端內容區 padding 加大
    &__content {
      padding: $spacing-lg $spacing-xl;
      gap: $spacing-xl;
    }

    // 平板端標題字體加大
    &__title {
      font-size: 22px;
    }

    // 平板端圖表高度加大
    &__trend-chart {
      height: 350px;
    }

    // 平板端環形圖容器加大
    &__source-chart-wrapper {
      width: 240px;
      height: 240px;
    }

    // 平板端 donut chart 加大
    &__donut-wrapper {
      width: 220px;
      height: 220px;
    }

    &__donut-value {
      font-size: 28px;
    }

    // 平板端篩選列水平排列
    &__filter-row {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }

    &__date-btn {
      width: auto;
    }

    // 平板端卡片 padding 加大
    &__card {
      padding: $spacing-xl;
    }

    // 平板端顧客卡片改為 2 列網格
    &__customer-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: $spacing-md;
    }

    // 平板端美容師績效表格字體加大
    &__staff-table {
      th {
        font-size: 13px;
        padding: 14px $spacing-lg;
      }

      td {
        font-size: 14px;
        padding: 14px $spacing-lg;
      }
    }

    // 平板端渠道列表項 padding 加大
    &__source-list-item {
      padding: $spacing-lg $spacing-md;
    }

    &__source-name {
      font-size: 15px;
    }

    &__source-count {
      font-size: 14px;
    }

    &__source-ratio {
      font-size: 15px;
    }

    // 平板端職業圖例改為 3 列
    &__occupation-legend {
      grid-template-columns: repeat(3, 1fr);
    }

    // 平板端區塊標題字體加大
    &__section-title {
      font-size: 16px;
    }

    &__card-title {
      font-size: 16px;
    }
  }
}

// ============================================================================
// 桌面端響應式覆寫（≥1200px）
// ============================================================================
@media (min-width: 1200px) {
  .member-analysis-mobile {
    // 桌面端指標卡片改為 4 列
    &__metrics {
      grid-template-columns: repeat(4, 1fr);
      padding: $spacing-xl $spacing-2xl;
    }

    &__metric-card {
      flex-direction: column;
      align-items: flex-start;
      padding: $spacing-xl;
    }

    &__metric-icon {
      width: 44px;
      height: 44px;

      .material-symbols-outlined {
        font-size: 22px;
      }
    }

    &__metric-value {
      font-size: 24px;
    }

    // 桌面端內容區 padding 加大
    &__content {
      padding: $spacing-xl $spacing-2xl;
      gap: $spacing-2xl;
    }

    // 桌面端標題
    &__title {
      font-size: 24px;
    }

    // 桌面端圖表高度
    &__trend-chart {
      height: 400px;
    }

    // 桌面端環形圖容器
    &__source-chart-wrapper {
      width: 280px;
      height: 280px;
    }

    // 桌面端 donut chart
    &__donut-wrapper {
      width: 240px;
      height: 240px;
    }

    &__donut-value {
      font-size: 30px;
    }

    // 桌面端篩選列水平排列
    &__filter-row {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }

    &__date-btn {
      width: auto;
    }

    // 桌面端顧客卡片改為 3 列網格
    &__customer-list {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: $spacing-lg;
    }

    // 桌面端職業圖例改為 5 列
    &__occupation-legend {
      grid-template-columns: repeat(5, 1fr);
    }
  }
}
</style>
