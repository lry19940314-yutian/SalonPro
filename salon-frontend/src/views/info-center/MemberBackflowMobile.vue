<!--
  MemberBackflowMobile.vue - 會員分析 - 回流分析（移動端）
  權限：店長 | 設備：移動端（<768px）
  設計稿：docs/UI設計稿/資訊中心/會員分析/會員分析-回流-移動端.html
  技術棧：Vue 3 Composition API + TypeScript + SCSS + Element Plus
  說明：Step 6 - PC/平板/移動端終極優化
    - 移動端：字體適配、禁止橫向滾動
    - 圖表懸浮提示：顯示工作人員+未回流數+占比
    - 列表空數據：展示友好提示文字
    - 樣式統一：所有模塊沿用系統變數、主題色、間距規範
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDevice } from '@/composables/useDevice'

// ==================== ECharts 導入 ====================
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

// ==================== API 導入 ====================
import {
  getStaffNonReturnStatsApi,
  getBackflowListApi,
  getNonReturnListApi,
} from '@/api/info-center'
import type {
  StaffNonReturnStatItem,
  BackflowMemberItem,
  NonReturnMemberItem,
} from '@/api/info-center'

const { windowWidth } = useDevice()

// ==================== 型別定義 ====================
interface PieDataItem {
  label: string
  value: number
  color: string
}

interface StaffBackflowCard {
  name: string
  avatar: string
  title: string
  returnCount: number
  nonReturnCount: number
  churnRate: number
}

// ==================== 加載狀態 ====================
const loading = ref({
  staffStat: false,
  returnList: false,
  nonReturnList: false,
})

const error = ref({
  staffStat: '',
  returnList: '',
  nonReturnList: '',
})

// ==================== 時間選擇 ====================
const timePeriods = ['本季', '本月', '去年同期']
const selectedPeriod = ref('本月')

// ==================== 回流客佔比分析（從接口匯總計算）====================
const totalReturnCount = ref(0)
const totalNonReturnCount = ref(0)

const returnRatioData = computed<PieDataItem[]>(() => {
  const totalReturn = totalReturnCount.value
  const totalNonReturn = totalNonReturnCount.value
  const total = totalReturn + totalNonReturn
  const returnPercent = total > 0 ? parseFloat(((totalReturn / total) * 100).toFixed(1)) : 0
  const nonReturnPercent = total > 0 ? parseFloat((100 - returnPercent).toFixed(1)) : 0

  return [
    { label: '回流客', value: returnPercent, color: '#a22c70' },
    { label: '未回流客', value: nonReturnPercent, color: '#794c8f' },
  ]
})

// ==================== 回流會員明細（接口數據）====================
const returnMemberList = ref<BackflowMemberItem[]>([])
const returnPage = ref(1)
const returnTotal = ref(0)
const pageSize = ref(10)

// ==================== 待喚回會員（接口數據）====================
const nonReturnMemberList = ref<NonReturnMemberItem[]>([])
const nonReturnPage = ref(1)
const nonReturnTotal = ref(0)

// ==================== 服務人員回流統計（從接口數據衍生）====================
const staffBackflowData = computed<StaffBackflowCard[]>(() => {
  return staffNonReturnData.value.map((item) => ({
    name: item.staffName,
    avatar: item.staffName.charAt(0),
    title: '',
    returnCount: 0,
    nonReturnCount: item.noBackflowCount,
    churnRate: item.noBackflowRatio,
  }))
})

// ==================== 工作人員未回流客統計（接口數據）====================
const staffNonReturnData = ref<StaffNonReturnStatItem[]>([])

/** 未回流客總數 */
const totalNoBackflowCount = computed(() =>
  staffNonReturnData.value.reduce((sum, item) => sum + item.noBackflowCount, 0)
)

/** 整體流失率（平均） */
const overallChurnRate = computed(() => {
  const data = staffNonReturnData.value
  if (data.length === 0) return 0
  const total = data.reduce((sum, item) => sum + item.noBackflowRatio, 0)
  return total / data.length
})

/** ECharts 長條圖選項 */
const barChartOption = computed(() => {
  const data = staffNonReturnData.value

  return {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'shadow' as const },
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: '#f0e6e8',
      borderWidth: 1,
      borderRadius: 8,
      padding: [12, 16],
      textStyle: { fontSize: 13, color: '#23191d' },
      formatter: (params: Array<{ name: string; value: number; seriesName: string }>) => {
        const item = params[0]
        const staff = data.find(s => s.staffName === item.name)
        if (!staff) return ''
        return `
          <div style="font-weight:600;font-size:14px;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid #f0e6e8;">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#c84c8f;color:#fff;font-size:12px;margin-right:6px;">${staff.staffName.charAt(0)}</span>
            ${item.name}
          </div>
          <div style="display:flex;justify-content:space-between;gap:24px;margin-bottom:4px;">
            <span style="color:#8a7a7e;">👤 未回流客數：</span>
            <span style="font-weight:700;color:#ac235a;font-size:15px;">${item.value} 人</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:#8a7a7e;">📊 未回流率：</span>
            <span style="font-weight:700;color:#794c8f;font-size:15px;">${staff.noBackflowRatio.toFixed(1)}%</span>
          </div>
        `
      },
    },
    grid: {
      left: 40,
      right: 15,
      top: 20,
      bottom: 30,
    },
    xAxis: {
      type: 'category' as const,
      data: data.map(item => item.staffName),
      axisLine: { lineStyle: { color: '#f0e6e8' } },
      axisTick: { show: false },
      axisLabel: {
        fontSize: 10,
        color: '#554149',
        fontWeight: 500,
        rotate: data.length > 4 ? 20 : 0,
        interval: 0,
        overflow: 'truncate' as const,
        width: 50,
      },
    },
    yAxis: {
      type: 'value' as const,
      name: '單位：人',
      nameTextStyle: { fontSize: 9, color: '#8a7a7e' },
      splitLine: { lineStyle: { color: '#f0e6e8', type: 'dashed' as const } },
      axisLabel: { fontSize: 9, color: '#8a7a7e' },
    },
    series: [
      {
        type: 'bar' as const,
        data: data.map(item => ({
          value: item.noBackflowCount,
          itemStyle: {
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#ac235a' },
                { offset: 1, color: '#c84c8f' },
              ],
            } as any,
            borderRadius: [4, 4, 0, 0],
          },
        })),
        barWidth: 24,
        barMaxWidth: 40,
        label: {
          show: true,
          position: 'top' as const,
          color: '#ac235a',
          fontWeight: 600,
          fontSize: 10,
          formatter: (params: { value: number }) => `${params.value}人`,
        },
      },
    ],
  }
})

// ==================== 加載數據 ====================
async function loadStaffNonReturnStats() {
  loading.value.staffStat = true
  error.value.staffStat = ''
  try {
    const res = await getStaffNonReturnStatsApi()
    staffNonReturnData.value = res.data || []
  } catch (e: any) {
    error.value.staffStat = e.message || '加載工作人員統計失敗'
    staffNonReturnData.value = []
  } finally {
    loading.value.staffStat = false
  }
}

async function loadReturnList() {
  loading.value.returnList = true
  error.value.returnList = ''
  try {
    const res = await getBackflowListApi(returnPage.value, pageSize.value)
    const data = res.data
    returnMemberList.value = data?.items || []
    returnTotal.value = data?.total || 0
    totalReturnCount.value = data?.total || 0
  } catch (e: any) {
    error.value.returnList = e.message || '加載回流客列表失敗'
    returnMemberList.value = []
    returnTotal.value = 0
  } finally {
    loading.value.returnList = false
  }
}

async function loadNonReturnList() {
  loading.value.nonReturnList = true
  error.value.nonReturnList = ''
  try {
    const res = await getNonReturnListApi(nonReturnPage.value, pageSize.value)
    const data = res.data
    nonReturnMemberList.value = data?.items || []
    nonReturnTotal.value = data?.total || 0
    totalNonReturnCount.value = data?.total || 0
  } catch (e: any) {
    error.value.nonReturnList = e.message || '加載未回流客列表失敗'
    nonReturnMemberList.value = []
    nonReturnTotal.value = 0
  } finally {
    loading.value.nonReturnList = false
  }
}

function onReturnPageChange(page: number) {
  returnPage.value = page
  loadReturnList()
}

function onNonReturnPageChange(page: number) {
  nonReturnPage.value = page
  loadNonReturnList()
}

onMounted(() => {
  loadStaffNonReturnStats()
  loadReturnList()
  loadNonReturnList()
})

// ==================== 工具函數 ====================
function formatCurrency(value: number): string {
  return `$${value.toLocaleString('zh-TW')}`
}

function formatCount(value: number): string {
  return value.toLocaleString('zh-TW')
}

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
</script>

<template>
  <div class="member-backflow-mobile" style="overflow-x: hidden; max-width: 100vw;">
    <!-- ==================== 頁面標題 ==================== -->
    <div class="member-backflow-mobile__header">
      <nav class="member-backflow-mobile__breadcrumb">
        <span class="member-backflow-mobile__breadcrumb-item">會員管理</span>
        <span class="member-backflow-mobile__breadcrumb-separator material-symbols-outlined">chevron_right</span>
        <span class="member-backflow-mobile__breadcrumb-item member-backflow-mobile__breadcrumb-item--current">會員分析</span>
      </nav>
      <h1 class="member-backflow-mobile__title">回流數據中心</h1>
    </div>

    <!-- ==================== 篩選條件列 ==================== -->
    <div class="member-backflow-mobile__filters">
      <div class="member-backflow-mobile__filter-row">
        <div class="member-backflow-mobile__time-switcher">
          <button
            v-for="period in timePeriods"
            :key="period"
            class="member-backflow-mobile__time-btn"
            :class="{ 'member-backflow-mobile__time-btn--active': period === selectedPeriod }"
            @click="selectedPeriod = period"
          >
            {{ period }}
          </button>
        </div>
        <button class="member-backflow-mobile__date-btn">
          <span class="material-symbols-outlined">calendar_today</span>
          <span>2025-01-01 ~ 2025-05-05</span>
        </button>
      </div>
    </div>

    <!-- ==================== 主要內容 ==================== -->
    <div class="member-backflow-mobile__content">

      <!-- 區塊 1：回流客佔比分析 -->
      <section class="member-backflow-mobile__card">
        <div class="member-backflow-mobile__card-header">
          <div class="member-backflow-mobile__card-title-wrapper">
            <span class="member-backflow-mobile__card-accent"></span>
            <h3 class="member-backflow-mobile__card-title">回流客佔比分析</h3>
          </div>
        </div>
        <div class="member-backflow-mobile__donut-section">
          <div class="member-backflow-mobile__donut-wrapper">
            <svg class="member-backflow-mobile__donut" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f0e6e8" stroke-width="16" />
              <circle
                v-for="(item, i) in returnRatioData"
                :key="item.label"
                cx="50" cy="50" r="42" fill="none"
                :stroke="item.color" stroke-width="16" stroke-linecap="butt"
                :stroke-dasharray="donutDashArray(item.value)"
                :stroke-dashoffset="donutDashOffset(i, returnRatioData)"
                transform="rotate(-90 50 50)"
                class="member-backflow-mobile__donut-segment"
              />
            </svg>
            <div class="member-backflow-mobile__donut-center">
              <span class="member-backflow-mobile__donut-value">{{ returnRatioData[0].value }}%</span>
              <span class="member-backflow-mobile__donut-label">回流佔比</span>
            </div>
          </div>
          <div class="member-backflow-mobile__donut-legend">
            <div v-for="item in returnRatioData" :key="item.label" class="member-backflow-mobile__legend-item">
              <span class="member-backflow-mobile__legend-dot" :style="{ backgroundColor: item.color }"></span>
              <span class="member-backflow-mobile__legend-label">{{ item.label }}</span>
              <span class="member-backflow-mobile__legend-value">{{ item.value }}%</span>
            </div>
          </div>
          <div class="member-backflow-mobile__ratio-stats">
            <div class="member-backflow-mobile__ratio-stat">
              <span class="member-backflow-mobile__ratio-stat-label">回流客數</span>
              <span class="member-backflow-mobile__ratio-stat-value member-backflow-mobile__ratio-stat-value--return">{{ formatCount(totalReturnCount) }}</span>
            </div>
            <div class="member-backflow-mobile__ratio-stat">
              <span class="member-backflow-mobile__ratio-stat-label">未回流客數</span>
              <span class="member-backflow-mobile__ratio-stat-value member-backflow-mobile__ratio-stat-value--non-return">{{ formatCount(totalNonReturnCount) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 區塊 2：回流會員明細 -->
      <section class="member-backflow-mobile__section">
        <div class="member-backflow-mobile__section-header">
          <h3 class="member-backflow-mobile__section-title">回流會員明細</h3>
          <button class="member-backflow-mobile__section-more">查看全部</button>
        </div>
        <!-- 加載中 -->
        <div v-if="loading.returnList" class="member-backflow-mobile__loading">
          <span class="member-backflow-mobile__loading-spinner"></span>
          <span>加載中...</span>
        </div>
        <!-- 加載失敗 -->
        <div v-else-if="error.returnList" class="member-backflow-mobile__error">
          <span class="member-backflow-mobile__error-icon material-symbols-outlined">error_outline</span>
          <span>{{ error.returnList }}</span>
          <button class="member-backflow-mobile__retry-btn" @click="loadReturnList">重試</button>
        </div>
        <!-- 空數據 -->
        <div v-else-if="returnMemberList.length === 0" class="member-backflow-mobile__empty">
          <span class="member-backflow-mobile__empty-icon material-symbols-outlined">person_check</span>
          <div class="member-backflow-mobile__empty-text">
            <span class="member-backflow-mobile__empty-title">暫無回流會員數據</span>
            <span class="member-backflow-mobile__empty-desc">當有會員再次到店消費時，將自動記錄於此</span>
          </div>
        </div>
        <!-- 數據列表 -->
        <div v-else class="member-backflow-mobile__member-list">
          <div
            v-for="member in returnMemberList"
            :key="member.memberId"
            class="member-backflow-mobile__member-card member-backflow-mobile__member-card--return"
          >
            <div class="member-backflow-mobile__member-top">
              <div class="member-backflow-mobile__member-info">
                <div class="member-backflow-mobile__member-avatar member-backflow-mobile__member-avatar--return">{{ member.memberName.charAt(0) }}</div>
                <div>
                  <div class="member-backflow-mobile__member-name">{{ member.memberName }}</div>
                  <div class="member-backflow-mobile__member-level">{{ member.memberLevel }}</div>
                </div>
              </div>
              <span class="member-backflow-mobile__member-phone">{{ member.memberPhone }}</span>
            </div>
            <div class="member-backflow-mobile__member-details">
              <div class="member-backflow-mobile__detail-item">
                <span class="member-backflow-mobile__detail-label">會員等級</span>
                <span class="member-backflow-mobile__detail-value">{{ member.memberLevel }}</span>
              </div>
              <div class="member-backflow-mobile__detail-item">
                <span class="member-backflow-mobile__detail-label">最後消費</span>
                <span class="member-backflow-mobile__detail-value">{{ member.lastConsumeTime }}</span>
              </div>
              <div class="member-backflow-mobile__detail-item">
                <span class="member-backflow-mobile__detail-label">回流狀態</span>
                <span class="member-backflow-mobile__detail-value">{{ member.backflowStatus }}</span>
              </div>
            </div>
            <div class="member-backflow-mobile__member-footer">
              <span class="member-backflow-mobile__member-staff">負責人員：{{ member.chargeStaffName }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 區塊 3：待喚回會員 -->
      <section class="member-backflow-mobile__section">
        <div class="member-backflow-mobile__section-header">
          <h3 class="member-backflow-mobile__section-title">待喚回會員</h3>
          <button class="member-backflow-mobile__section-more">查看全部</button>
        </div>
        <!-- 加載中 -->
        <div v-if="loading.nonReturnList" class="member-backflow-mobile__loading">
          <span class="member-backflow-mobile__loading-spinner"></span>
          <span>加載中...</span>
        </div>
        <!-- 加載失敗 -->
        <div v-else-if="error.nonReturnList" class="member-backflow-mobile__error">
          <span class="member-backflow-mobile__error-icon material-symbols-outlined">error_outline</span>
          <span>{{ error.nonReturnList }}</span>
          <button class="member-backflow-mobile__retry-btn" @click="loadNonReturnList">重試</button>
        </div>
        <!-- 空數據 -->
        <div v-else-if="nonReturnMemberList.length === 0" class="member-backflow-mobile__empty">
          <span class="member-backflow-mobile__empty-icon material-symbols-outlined">person_off</span>
          <div class="member-backflow-mobile__empty-text">
            <span class="member-backflow-mobile__empty-title">暫無待喚回會員數據</span>
            <span class="member-backflow-mobile__empty-desc">所有會員均有在近期到店記錄，暫無需喚回之會員</span>
          </div>
        </div>
        <!-- 數據列表 -->
        <div v-else class="member-backflow-mobile__member-list">
          <div
            v-for="member in nonReturnMemberList"
            :key="member.memberId"
            class="member-backflow-mobile__member-card member-backflow-mobile__member-card--non-return"
          >
            <div class="member-backflow-mobile__member-top">
              <div class="member-backflow-mobile__member-info">
                <div class="member-backflow-mobile__member-avatar member-backflow-mobile__member-avatar--non-return">{{ member.memberName.charAt(0) }}</div>
                <div>
                  <div class="member-backflow-mobile__member-name">{{ member.memberName }}</div>
                  <div class="member-backflow-mobile__member-level">{{ member.memberLevel }}</div>
                </div>
              </div>
              <span class="member-backflow-mobile__member-phone">{{ member.memberPhone }}</span>
            </div>
            <div class="member-backflow-mobile__member-details">
              <div class="member-backflow-mobile__detail-item">
                <span class="member-backflow-mobile__detail-label">最後消費</span>
                <span class="member-backflow-mobile__detail-value">{{ member.lastConsumeTime }}</span>
              </div>
              <div class="member-backflow-mobile__detail-item">
                <span class="member-backflow-mobile__detail-label">未回流天數</span>
                <span class="member-backflow-mobile__detail-value member-backflow-mobile__detail-value--days">{{ member.noBackflowDays }} 天</span>
              </div>
              <div class="member-backflow-mobile__detail-item">
                <span class="member-backflow-mobile__detail-label">流失等級</span>
                <span
                  class="member-backflow-mobile__loss-tag"
                  :class="{
                    'member-backflow-mobile__loss-tag--mild': member.lossLevel === '輕度',
                    'member-backflow-mobile__loss-tag--moderate': member.lossLevel === '中度',
                    'member-backflow-mobile__loss-tag--severe': member.lossLevel === '重度',
                  }"
                >
                  {{ member.lossLevel }}
                </span>
              </div>
            </div>
            <div class="member-backflow-mobile__member-footer">
              <span class="member-backflow-mobile__member-staff">負責人員：{{ member.chargeStaffName }}</span>
              <button class="member-backflow-mobile__recall-btn">
                <span class="material-symbols-outlined">notifications_active</span>
                簡訊喚回
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 區塊 4：服務人員回流統計 -->
      <section class="member-backflow-mobile__card">
        <div class="member-backflow-mobile__card-header">
          <div class="member-backflow-mobile__card-title-wrapper">
            <span class="member-backflow-mobile__card-accent member-backflow-mobile__card-accent--secondary"></span>
            <h3 class="member-backflow-mobile__card-title">服務人員回流統計</h3>
          </div>
        </div>
        <!-- 加載中 -->
        <div v-if="loading.staffStat" class="member-backflow-mobile__loading">
          <span class="member-backflow-mobile__loading-spinner"></span>
          <span>加載中...</span>
        </div>
        <!-- 加載失敗 -->
        <div v-else-if="error.staffStat" class="member-backflow-mobile__error">
          <span class="member-backflow-mobile__error-icon material-symbols-outlined">error_outline</span>
          <span>{{ error.staffStat }}</span>
          <button class="member-backflow-mobile__retry-btn" @click="loadStaffNonReturnStats">重試</button>
        </div>
        <!-- 空數據 -->
        <div v-else-if="staffBackflowData.length === 0" class="member-backflow-mobile__empty">
          <span class="member-backflow-mobile__empty-icon material-symbols-outlined">groups</span>
          <div class="member-backflow-mobile__empty-text">
            <span class="member-backflow-mobile__empty-title">暫無工作人員統計數據</span>
            <span class="member-backflow-mobile__empty-desc">目前尚未配置工作人員或無相關統計數據</span>
          </div>
        </div>
        <!-- 數據列表 -->
        <div v-else class="member-backflow-mobile__staff-list">
          <div
            v-for="staff in staffBackflowData"
            :key="staff.name"
            class="member-backflow-mobile__staff-card"
          >
            <div class="member-backflow-mobile__staff-top">
              <div class="member-backflow-mobile__staff-info">
                <div class="member-backflow-mobile__staff-avatar">{{ staff.avatar }}</div>
                <div>
                  <div class="member-backflow-mobile__staff-name">{{ staff.name }}</div>
                  <div class="member-backflow-mobile__staff-title">{{ staff.title }}</div>
                </div>
              </div>
              <div class="member-backflow-mobile__staff-churn">
                <span class="member-backflow-mobile__churn-label">流失率</span>
                <span
                  class="member-backflow-mobile__churn-value"
                  :class="{
                    'member-backflow-mobile__churn-value--high': staff.churnRate >= 35,
                    'member-backflow-mobile__churn-value--mid': staff.churnRate >= 30 && staff.churnRate < 35,
                    'member-backflow-mobile__churn-value--low': staff.churnRate < 30,
                  }"
                >
                  {{ formatPercent(staff.churnRate) }}
                </span>
              </div>
            </div>
            <div class="member-backflow-mobile__staff-stats">
              <div class="member-backflow-mobile__staff-stat">
                <span class="member-backflow-mobile__staff-stat-label">回流客</span>
                <span class="member-backflow-mobile__staff-stat-value member-backflow-mobile__staff-stat-value--return">{{ staff.returnCount }}</span>
              </div>
              <div class="member-backflow-mobile__staff-stat">
                <span class="member-backflow-mobile__staff-stat-label">未回流客</span>
                <span class="member-backflow-mobile__staff-stat-value member-backflow-mobile__staff-stat-value--non-return">{{ staff.nonReturnCount }}</span>
              </div>
              <div class="member-backflow-mobile__staff-progress">
                <div class="member-backflow-mobile__progress-bar">
                  <div
                    class="member-backflow-mobile__progress-fill"
                    :style="{ width: staff.churnRate + '%' }"
                    :class="{
                      'member-backflow-mobile__progress-fill--high': staff.churnRate >= 35,
                      'member-backflow-mobile__progress-fill--mid': staff.churnRate >= 30 && staff.churnRate < 35,
                      'member-backflow-mobile__progress-fill--low': staff.churnRate < 30,
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 區塊 5：工作人員未回流客統計（ECharts 長條圖） -->
      <section class="member-backflow-mobile__card">
        <div class="member-backflow-mobile__card-header">
          <div class="member-backflow-mobile__card-title-wrapper">
            <span class="member-backflow-mobile__card-accent member-backflow-mobile__card-accent--tertiary"></span>
            <h3 class="member-backflow-mobile__card-title">工作人員未回流客統計</h3>
          </div>
        </div>
        <!-- 加載中 -->
        <div v-if="loading.staffStat" class="member-backflow-mobile__loading">
          <span class="member-backflow-mobile__loading-spinner"></span>
          <span>加載中...</span>
        </div>
        <!-- 加載失敗 -->
        <div v-else-if="error.staffStat" class="member-backflow-mobile__error">
          <span class="member-backflow-mobile__error-icon material-symbols-outlined">error_outline</span>
          <span>{{ error.staffStat }}</span>
          <button class="member-backflow-mobile__retry-btn" @click="loadStaffNonReturnStats">重試</button>
        </div>
        <!-- 空數據 -->
        <div v-else-if="staffNonReturnData.length === 0" class="member-backflow-mobile__empty">
          <span class="member-backflow-mobile__empty-icon material-symbols-outlined">bar_chart</span>
          <div class="member-backflow-mobile__empty-text">
            <span class="member-backflow-mobile__empty-title">暫無統計數據</span>
            <span class="member-backflow-mobile__empty-desc">目前尚無工作人員未回流客統計數據</span>
          </div>
        </div>
        <!-- 數據內容 -->
        <div v-else class="member-backflow-mobile__nonreturn-content">
          <!-- 統計卡片 -->
          <div class="member-backflow-mobile__nonreturn-stats">
            <div class="member-backflow-mobile__nonreturn-stat-card">
              <span class="member-backflow-mobile__nonreturn-stat-label">未回流客總數</span>
              <span class="member-backflow-mobile__nonreturn-stat-value member-backflow-mobile__nonreturn-stat-value--primary">{{ formatCount(totalNoBackflowCount) }}</span>
              <span class="member-backflow-mobile__nonreturn-stat-unit">人</span>
            </div>
            <div class="member-backflow-mobile__nonreturn-stat-card">
              <span class="member-backflow-mobile__nonreturn-stat-label">整體流失率</span>
              <span class="member-backflow-mobile__nonreturn-stat-value member-backflow-mobile__nonreturn-stat-value--secondary">{{ formatPercent(overallChurnRate) }}</span>
              <span class="member-backflow-mobile__nonreturn-stat-unit">平均</span>
            </div>
          </div>
          <!-- ECharts 長條圖 -->
          <div class="member-backflow-mobile__chart-wrapper">
            <VChart
              :option="barChartOption"
              autoresize
              class="member-backflow-mobile__bar-chart"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
// ============================================================================
// 系統顏色變數（與 MemberAnalysisMobile 統一）
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
// 容器
// ============================================================================
.member-backflow-mobile {
  min-height: 100vh;
  background: $color-surface;
  padding-bottom: 32px;
  overflow-x: hidden;
  max-width: 100vw;
  -webkit-overflow-scrolling: touch;
}

// ============================================================================
// 頁面標題
// ============================================================================
.member-backflow-mobile__header {
  padding: $spacing-lg $spacing-lg $spacing-md;
}

.member-backflow-mobile__breadcrumb {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  margin-bottom: $spacing-sm;
}

.member-backflow-mobile__breadcrumb-item {
  font-size: 13px;
  color: $color-on-surface-muted;

  &--current {
    color: $color-primary-dark;
    font-weight: 600;
  }
}

.member-backflow-mobile__breadcrumb-separator {
  font-size: 16px;
  color: $color-on-surface-muted;
}

.member-backflow-mobile__title {
  font-size: 22px;
  font-weight: 700;
  color: $color-on-surface;
  margin: 0;
}

// ============================================================================
// 篩選條件列
// ============================================================================
.member-backflow-mobile__filters {
  padding: 0 $spacing-lg $spacing-md;
}

.member-backflow-mobile__filter-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.member-backflow-mobile__time-switcher {
  display: flex;
  background: $color-surface-container-low;
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}

.member-backflow-mobile__time-btn {
  padding: 6px 14px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: $color-on-surface-variant;
  cursor: pointer;
  transition: all 0.2s;

  &--active {
    background: $color-white;
    color: $color-primary-dark;
    box-shadow: 0 1px 4px rgba(#23191d, 0.08);
    font-weight: 600;
  }
}

.member-backflow-mobile__date-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid $color-border;
  background: $color-white;
  border-radius: 8px;
  font-size: 12px;
  color: $color-on-surface-variant;
  cursor: pointer;

  .material-symbols-outlined {
    font-size: 16px;
  }
}

// ============================================================================
// 主要內容
// ============================================================================
.member-backflow-mobile__content {
  padding: 0 $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  overflow-x: hidden;
  max-width: 100%;
}

// ============================================================================
// 通用卡片
// ============================================================================
.member-backflow-mobile__card {
  background: $color-white;
  border-radius: $card-radius;
  box-shadow: $card-shadow;
  overflow: hidden;
}

.member-backflow-mobile__card-header {
  padding: $spacing-lg $spacing-lg 0;
}

.member-backflow-mobile__card-title-wrapper {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.member-backflow-mobile__card-accent {
  width: 4px;
  height: 20px;
  background: $color-primary;
  border-radius: 2px;
  flex-shrink: 0;

  &--secondary {
    background: $color-secondary;
  }

  &--tertiary {
    background: #c84c8f;
  }
}

.member-backflow-mobile__card-title {
  font-size: 16px;
  font-weight: 600;
  color: $color-on-surface;
  margin: 0;
}

// ============================================================================
// 區塊（無卡片包裝）
// ============================================================================
.member-backflow-mobile__section {
  background: $color-white;
  border-radius: $card-radius;
  box-shadow: $card-shadow;
  overflow: hidden;
}

.member-backflow-mobile__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg $spacing-lg $spacing-md;
}

.member-backflow-mobile__section-title {
  font-size: 16px;
  font-weight: 600;
  color: $color-on-surface;
  margin: 0;
}

.member-backflow-mobile__section-more {
  font-size: 13px;
  color: $color-primary-dark;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

// ============================================================================
// 加載 / 錯誤 / 空數據
// ============================================================================
.member-backflow-mobile__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: $spacing-2xl;
  color: $color-on-surface-muted;
  font-size: 14px;
}

.member-backflow-mobile__loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid $color-border;
  border-top-color: $color-primary;
  border-radius: 50%;
  animation: member-backflow-mobile-spin 0.6s linear infinite;
}

@keyframes member-backflow-mobile-spin {
  to { transform: rotate(360deg); }
}

.member-backflow-mobile__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-2xl;
  color: #e74c3c;
  font-size: 14px;
}

.member-backflow-mobile__error-icon {
  font-size: 32px;
}

.member-backflow-mobile__retry-btn {
  padding: 6px 16px;
  border: 1px solid #e74c3c;
  background: $color-white;
  border-radius: 6px;
  color: #e74c3c;
  font-size: 13px;
  cursor: pointer;
}

.member-backflow-mobile__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-2xl $spacing-lg;
  color: $color-on-surface-muted;
  font-size: 14px;
  text-align: center;
}

.member-backflow-mobile__empty-icon {
  font-size: 40px;
  opacity: 0.5;
  margin-bottom: $spacing-xs;
}

.member-backflow-mobile__empty-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-backflow-mobile__empty-title {
  font-size: 15px;
  font-weight: 600;
  color: $color-on-surface-variant;
}

.member-backflow-mobile__empty-desc {
  font-size: 13px;
  color: $color-on-surface-muted;
  max-width: 280px;
  line-height: 1.5;
}

// ============================================================================
// Donut 圖
// ============================================================================
.member-backflow-mobile__donut-section {
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-lg;
}

.member-backflow-mobile__donut-wrapper {
  position: relative;
  width: 140px;
  height: 140px;
}

.member-backflow-mobile__donut {
  width: 100%;
  height: 100%;
}

.member-backflow-mobile__donut-segment {
  transition: stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease;
}

.member-backflow-mobile__donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.member-backflow-mobile__donut-value {
  font-size: 24px;
  font-weight: 700;
  color: $color-primary-dark;
}

.member-backflow-mobile__donut-label {
  font-size: 12px;
  color: $color-on-surface-muted;
}

.member-backflow-mobile__donut-legend {
  display: flex;
  gap: $spacing-xl;
}

.member-backflow-mobile__legend-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.member-backflow-mobile__legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.member-backflow-mobile__legend-label {
  font-size: 13px;
  color: $color-on-surface-variant;
}

.member-backflow-mobile__legend-value {
  font-size: 14px;
  font-weight: 600;
  color: $color-on-surface;
}

.member-backflow-mobile__ratio-stats {
  display: flex;
  gap: $spacing-lg;
  width: 100%;
}

.member-backflow-mobile__ratio-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-md;
  background: $color-surface-container-low;
  border-radius: 8px;
}

.member-backflow-mobile__ratio-stat-label {
  font-size: 12px;
  color: $color-on-surface-muted;
}

.member-backflow-mobile__ratio-stat-value {
  font-size: 20px;
  font-weight: 700;

  &--return {
    color: $color-primary-dark;
  }

  &--non-return {
    color: $color-secondary;
  }
}

// ============================================================================
// 會員卡片列表
// ============================================================================
.member-backflow-mobile__member-list {
  padding: 0 $spacing-lg $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.member-backflow-mobile__member-card {
  background: $color-surface-container-low;
  border-radius: 10px;
  padding: $spacing-md;
  border-left: 4px solid transparent;

  &--return {
    border-left-color: $color-primary-dark;
  }

  &--non-return {
    border-left-color: $color-secondary;
  }
}

.member-backflow-mobile__member-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-sm;
}

.member-backflow-mobile__member-info {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.member-backflow-mobile__member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: $color-white;

  &--return {
    background: linear-gradient(135deg, $color-primary-dark, $color-primary);
  }

  &--non-return {
    background: linear-gradient(135deg, $color-secondary, #9b6db5);
  }
}

.member-backflow-mobile__member-name {
  font-size: 15px;
  font-weight: 600;
  color: $color-on-surface;
}

.member-backflow-mobile__member-level {
  font-size: 12px;
  color: $color-on-surface-muted;
}

.member-backflow-mobile__member-phone {
  font-size: 13px;
  color: $color-on-surface-muted;
}

.member-backflow-mobile__member-details {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm $spacing-lg;
  margin-bottom: $spacing-sm;
}

.member-backflow-mobile__detail-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.member-backflow-mobile__detail-label {
  font-size: 12px;
  color: $color-on-surface-muted;
}

.member-backflow-mobile__detail-value {
  font-size: 13px;
  font-weight: 500;
  color: $color-on-surface;

  &--days {
    color: #e67e22;
    font-weight: 600;
  }
}

.member-backflow-mobile__loss-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;

  &--mild {
    background: #e8f5e9;
    color: #2e7d32;
  }

  &--moderate {
    background: #fff3e0;
    color: #e65100;
  }

  &--severe {
    background: #fce4ec;
    color: #c62828;
  }
}

.member-backflow-mobile__member-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: $spacing-sm;
  border-top: 1px solid $color-border;
}

.member-backflow-mobile__member-staff {
  font-size: 12px;
  color: $color-on-surface-muted;
}

.member-backflow-mobile__recall-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: none;
  background: $color-primary-dark;
  color: $color-white;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  .material-symbols-outlined {
    font-size: 16px;
  }
}

// ============================================================================
// 服務人員回流統計
// ============================================================================
.member-backflow-mobile__staff-list {
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.member-backflow-mobile__staff-card {
  background: $color-surface-container-low;
  border-radius: 10px;
  padding: $spacing-md;
}

.member-backflow-mobile__staff-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-sm;
}

.member-backflow-mobile__staff-info {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.member-backflow-mobile__staff-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, $color-primary-dark, $color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: $color-white;
}

.member-backflow-mobile__staff-name {
  font-size: 15px;
  font-weight: 600;
  color: $color-on-surface;
}

.member-backflow-mobile__staff-title {
  font-size: 12px;
  color: $color-on-surface-muted;
}

.member-backflow-mobile__staff-churn {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.member-backflow-mobile__churn-label {
  font-size: 11px;
  color: $color-on-surface-muted;
}

.member-backflow-mobile__churn-value {
  font-size: 18px;
  font-weight: 700;

  &--high {
    color: #c62828;
  }

  &--mid {
    color: #e65100;
  }

  &--low {
    color: #2e7d32;
  }
}

.member-backflow-mobile__staff-stats {
  display: flex;
  gap: $spacing-lg;
  align-items: center;
}

.member-backflow-mobile__staff-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.member-backflow-mobile__staff-stat-label {
  font-size: 11px;
  color: $color-on-surface-muted;
}

.member-backflow-mobile__staff-stat-value {
  font-size: 16px;
  font-weight: 600;

  &--return {
    color: $color-primary-dark;
  }

  &--non-return {
    color: $color-secondary;
  }
}

.member-backflow-mobile__staff-progress {
  flex: 1;
}

.member-backflow-mobile__progress-bar {
  height: 8px;
  background: $color-border;
  border-radius: 4px;
  overflow: hidden;
}

.member-backflow-mobile__progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;

  &--high {
    background: linear-gradient(90deg, #c62828, #e74c3c);
  }

  &--mid {
    background: linear-gradient(90deg, #e65100, #f39c12);
  }

  &--low {
    background: linear-gradient(90deg, #2e7d32, #4caf50);
  }
}

// ============================================================================
// 工作人員未回流客統計
// ============================================================================
.member-backflow-mobile__nonreturn-content {
  padding: $spacing-lg;
}

.member-backflow-mobile__nonreturn-stats {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.member-backflow-mobile__nonreturn-stat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-md;
  background: $color-surface-container-low;
  border-radius: 8px;
}

.member-backflow-mobile__nonreturn-stat-label {
  font-size: 12px;
  color: $color-on-surface-muted;
}

.member-backflow-mobile__nonreturn-stat-value {
  font-size: 22px;
  font-weight: 700;

  &--primary {
    color: $color-primary-dark;
  }

  &--secondary {
    color: $color-secondary;
  }
}

.member-backflow-mobile__nonreturn-stat-unit {
  font-size: 11px;
  color: $color-on-surface-muted;
}

.member-backflow-mobile__chart-wrapper {
  width: 100%;
  height: 260px;
}

.member-backflow-mobile__bar-chart {
  width: 100%;
  height: 100%;
}

// ============================================================================
// 移動端字體適配（小螢幕 < 375px）
// ============================================================================
@media (max-width: 374px) {
  .member-backflow-mobile__title {
    font-size: 18px;
  }

  .member-backflow-mobile__card-title,
  .member-backflow-mobile__section-title {
    font-size: 14px;
  }

  .member-backflow-mobile__donut-wrapper {
    width: 120px;
    height: 120px;
  }

  .member-backflow-mobile__donut-value {
    font-size: 20px;
  }

  .member-backflow-mobile__member-name {
    font-size: 14px;
  }

  .member-backflow-mobile__staff-name {
    font-size: 14px;
  }

  .member-backflow-mobile__churn-value {
    font-size: 16px;
  }

  .member-backflow-mobile__nonreturn-stat-value {
    font-size: 18px;
  }

  .member-backflow-mobile__ratio-stat-value {
    font-size: 18px;
  }

  .member-backflow-mobile__detail-value {
    font-size: 12px;
  }

  .member-backflow-mobile__member-avatar,
  .member-backflow-mobile__staff-avatar {
    width: 34px;
    height: 34px;
    font-size: 14px;
  }

  .member-backflow-mobile__time-btn {
    padding: 5px 10px;
    font-size: 12px;
  }

  .member-backflow-mobile__date-btn {
    font-size: 11px;
    padding: 5px 10px;
  }

  .member-backflow-mobile__content {
    padding: 0 $spacing-md;
    gap: $spacing-md;
  }

  .member-backflow-mobile__header {
    padding: $spacing-md $spacing-md $spacing-sm;
  }

  .member-backflow-mobile__filters {
    padding: 0 $spacing-md $spacing-md;
  }

  .member-backflow-mobile__donut-section {
    padding: $spacing-md;
  }

  .member-backflow-mobile__member-list {
    padding: 0 $spacing-md $spacing-md;
  }

  .member-backflow-mobile__staff-list {
    padding: $spacing-md;
  }

  .member-backflow-mobile__nonreturn-content {
    padding: $spacing-md;
  }

  .member-backflow-mobile__nonreturn-stats {
    flex-direction: column;
    gap: $spacing-sm;
  }

  .member-backflow-mobile__ratio-stats {
    flex-direction: column;
    gap: $spacing-sm;
  }

  .member-backflow-mobile__ratio-stat {
    padding: $spacing-sm;
  }

  .member-backflow-mobile__member-card {
    padding: $spacing-sm;
  }

  .member-backflow-mobile__staff-card {
    padding: $spacing-sm;
  }

  .member-backflow-mobile__member-details {
    gap: $spacing-xs $spacing-md;
  }

  .member-backflow-mobile__chart-wrapper {
    height: 220px;
  }
}

// ============================================================================
// 確保所有卡片內容不溢出
// ============================================================================
.member-backflow-mobile__card,
.member-backflow-mobile__section {
  overflow: hidden;
}

.member-backflow-mobile__member-card,
.member-backflow-mobile__staff-card {
  word-break: break-all;
}

.member-backflow-mobile__member-phone {
  word-break: keep-all;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  display: inline-block;
  vertical-align: middle;
}
</style>
