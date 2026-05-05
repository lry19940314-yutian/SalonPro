<!--
  MemberBackflow.vue - 會員分析 - 回流分析（PC / 平板端）
  權限：店長 | 設備：PC 端（含平板響應式，≥768px）
  設計稿：docs/UI設計稿/資訊中心/會員分析/回流.html
  技術棧：Vue 3 Composition API + TypeScript + SCSS + Element Plus
  響應式斷點：
    - 桌面端 ≥1200px：上圖下表三欄網格布局
    - 平板端 768px ~ 1199px：卡片自適應堆叠
  說明：Step 6 - PC/平板/移動端終極優化
    - 平板端：調整表格/圖表尺寸、卡片間距
    - 圖表懸浮提示：顯示工作人員+未回流數+占比
    - 列表空數據：展示友好提示文字
    - 樣式統一：所有模塊沿用系統變數、主題色、間距規範
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDevice } from '@/composables/useDevice'

// ==================== Element Plus ====================
import { ElTable, ElTableColumn, ElPagination } from 'element-plus'

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

// ==================== 響應式斷點 ====================
const BREAKPOINT_DESKTOP = 1200
const BREAKPOINT_TABLET = 768

const isTablet = computed(() => {
  const w = windowWidth.value
  return w >= BREAKPOINT_TABLET && w < BREAKPOINT_DESKTOP
})

const isDesktop = computed(() => windowWidth.value >= BREAKPOINT_DESKTOP)

// ==================== 型別定義 ====================
interface PieDataItem {
  label: string
  value: number
  color: string
}

interface StaffBackflowItem {
  rank: number
  name: string
  title: string
  returnCount: number
  nonReturnCount: number
  churnRate: number
  avatar: string | null
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
  const isTabletNow = isTablet.value

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
      left: isTabletNow ? 40 : 50,
      right: isTabletNow ? 20 : 30,
      top: 20,
      bottom: isTabletNow ? 35 : 40,
    },
    xAxis: {
      type: 'category' as const,
      data: data.map(item => item.staffName),
      axisLine: { lineStyle: { color: '#f0e6e8' } },
      axisTick: { show: false },
      axisLabel: {
        fontSize: isTabletNow ? 11 : 12,
        color: '#554149',
        fontWeight: 500,
        rotate: isTabletNow && data.length > 5 ? 15 : 0,
      },
    },
    yAxis: {
      type: 'value' as const,
      name: '單位：人',
      nameTextStyle: { fontSize: isTabletNow ? 10 : 11, color: '#8a7a7e' },
      splitLine: { lineStyle: { color: '#f0e6e8', type: 'dashed' as const } },
      axisLabel: { fontSize: isTabletNow ? 10 : 11, color: '#8a7a7e' },
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
        barWidth: isTabletNow ? 28 : 40,
        barMaxWidth: isTabletNow ? 44 : 60,
        label: {
          show: true,
          position: 'top' as const,
          color: '#ac235a',
          fontWeight: 600,
          fontSize: isTabletNow ? 10 : 12,
          formatter: (params: { value: number }) => `${params.value}人`,
        },
      },
    ],
  }
})

// ==================== 時間選擇 ====================
const timePeriods = ['本季', '本月', '去年同期']
const selectedPeriod = ref('本月')

// ==================== 回流與未回流客占比（從接口匯總計算）====================
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

const totalReturnCount = ref(0)
const totalNonReturnCount = ref(0)

// ==================== 工作人員回流數據統計（從接口數據衍生）====================
const staffBackflowData = computed<StaffBackflowItem[]>(() => {
  return staffNonReturnData.value.map((item, index) => ({
    rank: index + 1,
    name: item.staffName,
    title: '',
    returnCount: 0,
    nonReturnCount: item.noBackflowCount,
    churnRate: item.noBackflowRatio,
    avatar: null,
  }))
})

// ==================== 回流客列表（接口數據）====================
const returnMemberList = ref<BackflowMemberItem[]>([])
const returnPage = ref(1)
const returnTotal = ref(0)
const pageSize = ref(10)

// ==================== 未回流客列表（接口數據）====================
const nonReturnMemberList = ref<NonReturnMemberItem[]>([])
const nonReturnPage = ref(1)
const nonReturnTotal = ref(0)

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
  <div
    class="member-backflow"
    :class="{
      'member-backflow--tablet': isTablet,
      'member-backflow--desktop': isDesktop,
    }"
  >
    <!-- ==================== 頁面標題與操作列 ==================== -->
    <div class="member-backflow__header">
      <div>
        <!-- 麵包屑 -->
        <nav class="member-backflow__breadcrumb">
          <span class="member-backflow__breadcrumb-item">會員管理</span>
          <span class="member-backflow__breadcrumb-separator material-symbols-outlined">chevron_right</span>
          <span class="member-backflow__breadcrumb-item member-backflow__breadcrumb-item--current">會員分析</span>
        </nav>
        <h1 class="member-backflow__title">回流數據中心</h1>
      </div>
      <div class="member-backflow__header-actions">
        <!-- 時間維度切換 -->
        <div class="member-backflow__time-switcher">
          <button
            v-for="period in timePeriods"
            :key="period"
            class="member-backflow__time-btn"
            :class="{ 'member-backflow__time-btn--active': period === selectedPeriod }"
            @click="selectedPeriod = period"
          >
            {{ period }}
          </button>
        </div>
        <!-- 日期範圍選擇 -->
        <div class="member-backflow__date-range">
          <span class="material-symbols-outlined">calendar_today</span>
          <span>最近30天</span>
        </div>
      </div>
    </div>

    <!-- ==================== 上層：圖表區（12 欄網格）==================== -->
    <div class="member-backflow__grid-top">
      <!-- 區塊 1：回流與未回流客占比（Donut Chart）5 欄 -->
      <section class="member-backflow__card member-backflow__card--ratio">
        <div class="member-backflow__card-header">
          <div class="member-backflow__card-title-wrapper">
            <span class="member-backflow__card-accent"></span>
            <h3 class="member-backflow__card-title">回流與未回流客占比</h3>
          </div>
        </div>
        <div class="member-backflow__ratio-content">
          <!-- Donut Chart (SVG) -->
          <div class="member-backflow__donut-wrapper">
            <svg class="member-backflow__donut" viewBox="0 0 100 100">
              <!-- 背景圓環 -->
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f0e6e8" stroke-width="16" />
              <!-- 各區段 -->
              <circle
                v-for="(item, i) in returnRatioData"
                :key="item.label"
                cx="50"
                cy="50"
                r="42"
                fill="none"
                :stroke="item.color"
                stroke-width="16"
                stroke-linecap="butt"
                :stroke-dasharray="donutDashArray(item.value)"
                :stroke-dashoffset="donutDashOffset(i, returnRatioData)"
                transform="rotate(-90 50 50)"
                class="member-backflow__donut-segment"
              />
            </svg>
            <div class="member-backflow__donut-center">
              <span class="member-backflow__donut-value">{{ returnRatioData[0].value }}%</span>
              <span class="member-backflow__donut-label">回流佔比</span>
            </div>
          </div>
          <!-- 圖例與統計 -->
          <div class="member-backflow__ratio-legend">
            <div
              v-for="item in returnRatioData"
              :key="item.label"
              class="member-backflow__ratio-legend-item"
            >
              <div class="member-backflow__ratio-legend-left">
                <span class="member-backflow__ratio-dot" :style="{ backgroundColor: item.color }"></span>
                <span class="member-backflow__ratio-label">{{ item.label }}</span>
              </div>
              <span class="member-backflow__ratio-value">{{ item.value }}%</span>
            </div>
            <!-- 統計數字 -->
            <div class="member-backflow__ratio-stats">
              <div class="member-backflow__ratio-stat">
                <span class="member-backflow__ratio-stat-label">回流客數</span>
                <span class="member-backflow__ratio-stat-value member-backflow__ratio-stat-value--return">{{ formatCount(totalReturnCount) }}</span>
              </div>
              <div class="member-backflow__ratio-stat">
                <span class="member-backflow__ratio-stat-label">未回流客數</span>
                <span class="member-backflow__ratio-stat-value member-backflow__ratio-stat-value--non-return">{{ formatCount(totalNonReturnCount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 區塊 2：工作人員回流數據統計（表格）7 欄 -->
      <section class="member-backflow__card member-backflow__card--staff">
        <div class="member-backflow__card-header">
          <div class="member-backflow__card-title-wrapper">
            <span class="member-backflow__card-accent member-backflow__card-accent--secondary"></span>
            <h3 class="member-backflow__card-title">工作人員回流數據統計</h3>
          </div>
        </div>
        <div class="member-backflow__table-scroll">
          <table class="member-backflow__staff-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>姓名</th>
                <th>未回流客數</th>
                <th>流失率</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="staff in staffBackflowData"
                :key="staff.rank"
                class="member-backflow__staff-row"
              >
                <td class="member-backflow__staff-rank">
                  <span
                    class="member-backflow__rank-badge"
                    :class="{
                      'member-backflow__rank-badge--gold': staff.rank === 1,
                      'member-backflow__rank-badge--silver': staff.rank === 2,
                      'member-backflow__rank-badge--bronze': staff.rank === 3,
                    }"
                  >
                    {{ staff.rank }}
                  </span>
                </td>
                <td>
                  <div class="member-backflow__staff-name">
                    <div class="member-backflow__staff-avatar">{{ staff.name.charAt(0) }}</div>
                    <div>
                      <div class="member-backflow__staff-name-text">{{ staff.name }}</div>
                    </div>
                  </div>
                </td>
                <td class="member-backflow__staff-count member-backflow__staff-count--non-return">{{ staff.nonReturnCount }}</td>
                <td>
                  <div class="member-backflow__churn-cell">
                    <span
                      class="member-backflow__churn-rate"
                      :class="{
                        'member-backflow__churn-rate--high': staff.churnRate >= 35,
                        'member-backflow__churn-rate--mid': staff.churnRate >= 30 && staff.churnRate < 35,
                        'member-backflow__churn-rate--low': staff.churnRate < 30,
                      }"
                    >
                      {{ formatPercent(staff.churnRate) }}
                    </span>
                    <div class="member-backflow__churn-bar">
                      <div
                        class="member-backflow__churn-bar-fill"
                        :style="{ width: staff.churnRate + '%' }"
                        :class="{
                          'member-backflow__churn-bar-fill--high': staff.churnRate >= 35,
                          'member-backflow__churn-bar-fill--mid': staff.churnRate >= 30 && staff.churnRate < 35,
                          'member-backflow__churn-bar-fill--low': staff.churnRate < 30,
                        }"
                      ></div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <!-- 空數據狀態 -->
          <div v-if="!loading.staffStat && staffBackflowData.length === 0 && !error.staffStat" class="member-backflow__empty">
            <span class="material-symbols-outlined member-backflow__empty-icon">groups</span>
            <div class="member-backflow__empty-text">
              <span class="member-backflow__empty-title">暫無工作人員數據</span>
              <span class="member-backflow__empty-desc">目前尚未配置工作人員或無相關統計數據，請先新增工作人員</span>
            </div>
          </div>
          <!-- 錯誤狀態 -->
          <div v-if="error.staffStat" class="member-backflow__error">
            <span class="material-symbols-outlined">error_outline</span>
            <span>{{ error.staffStat }}</span>
            <button class="member-backflow__retry-btn" @click="loadStaffNonReturnStats">重新加載</button>
          </div>
          <!-- 加載狀態 -->
          <div v-if="loading.staffStat" class="member-backflow__loading">
            <span class="material-symbols-outlined member-backflow__loading-icon">sync</span>
            <span>加載中...</span>
          </div>
        </div>
      </section>
    </div>

    <!-- ==================== 中層：工作人員未回流客統計（ECharts 長條圖）==================== -->
    <div class="member-backflow__grid-middle">
      <section class="member-backflow__card member-backflow__card--nonreturn-chart">
        <div class="member-backflow__card-header">
          <div class="member-backflow__card-title-wrapper">
            <span class="member-backflow__card-accent member-backflow__card-accent--tertiary"></span>
            <h3 class="member-backflow__card-title">工作人員未回流客統計</h3>
          </div>
        </div>
        <div class="member-backflow__nonreturn-content">
          <!-- 統計卡片 -->
          <div class="member-backflow__nonreturn-stats">
            <div class="member-backflow__nonreturn-stat-card">
              <span class="member-backflow__nonreturn-stat-label">未回流客總數</span>
              <span class="member-backflow__nonreturn-stat-value member-backflow__nonreturn-stat-value--primary">{{ formatCount(totalNoBackflowCount) }}</span>
              <span class="member-backflow__nonreturn-stat-unit">人</span>
            </div>
            <div class="member-backflow__nonreturn-stat-card">
              <span class="member-backflow__nonreturn-stat-label">整體流失率</span>
              <span class="member-backflow__nonreturn-stat-value member-backflow__nonreturn-stat-value--secondary">{{ formatPercent(overallChurnRate) }}</span>
              <span class="member-backflow__nonreturn-stat-unit">平均</span>
            </div>
          </div>
          <!-- ECharts 長條圖 -->
          <div class="member-backflow__chart-wrapper">
            <VChart
              :option="barChartOption"
              autoresize
              class="member-backflow__bar-chart"
            />
          </div>
        </div>
      </section>
    </div>

    <!-- ==================== 下層：列表區（雙欄網格）==================== -->
    <div class="member-backflow__grid-bottom">
      <!-- 區塊 3：回流客列表 -->
      <section class="member-backflow__card member-backflow__card--list">
        <div class="member-backflow__card-header">
          <div class="member-backflow__card-title-wrapper">
            <span class="member-backflow__card-accent"></span>
            <h3 class="member-backflow__card-title">回流客列表</h3>
          </div>
          <span class="member-backflow__card-count">{{ formatCount(returnTotal) }} 人</span>
        </div>
        <div class="member-backflow__table-scroll">
          <ElTable
            :data="returnMemberList"
            stripe
            style="width: 100%"
            size="small"
            v-loading="loading.returnList"
          >
            <ElTableColumn label="會員姓名" min-width="120">
              <template #default="{ row }: { row: BackflowMemberItem }">
                <div class="member-backflow__member-cell">
                  <div class="member-backflow__member-avatar member-backflow__member-avatar--return">{{ row.memberName.charAt(0) }}</div>
                  <span class="member-backflow__member-name">{{ row.memberName }}</span>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn label="聯絡電話" min-width="130">
              <template #default="{ row }: { row: BackflowMemberItem }">
                <span class="member-backflow__member-phone">{{ row.memberPhone }}</span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="會員等級" min-width="100" align="center">
              <template #default="{ row }: { row: BackflowMemberItem }">
                {{ row.memberLevel }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="最後消費日" min-width="120" align="center">
              <template #default="{ row }: { row: BackflowMemberItem }">
                {{ row.lastConsumeTime }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="負責人員" min-width="100">
              <template #default="{ row }: { row: BackflowMemberItem }">
                {{ row.chargeStaffName }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="回流狀態" min-width="100" align="center">
              <template #default="{ row }: { row: BackflowMemberItem }">
                {{ row.backflowStatus }}
              </template>
            </ElTableColumn>
          </ElTable>
          <!-- 空數據狀態 -->
          <div v-if="!loading.returnList && returnMemberList.length === 0 && !error.returnList" class="member-backflow__empty">
            <span class="material-symbols-outlined member-backflow__empty-icon">person_check</span>
            <div class="member-backflow__empty-text">
              <span class="member-backflow__empty-title">暫無回流客數據</span>
              <span class="member-backflow__empty-desc">目前尚無會員在近期回流，當有會員再次到店消費時將顯示於此</span>
            </div>
          </div>
          <!-- 錯誤狀態 -->
          <div v-if="error.returnList" class="member-backflow__error">
            <span class="material-symbols-outlined">error_outline</span>
            <span>{{ error.returnList }}</span>
            <button class="member-backflow__retry-btn" @click="loadReturnList">重新加載</button>
          </div>
        </div>
        <div class="member-backflow__pagination-wrapper">
          <ElPagination
            v-model:current-page="returnPage"
            v-model:page-size="pageSize"
            :total="returnTotal"
            layout="total, sizes, prev, pager, next, jumper"
            background
            small
            @current-change="onReturnPageChange"
          />
        </div>
      </section>

      <!-- 區塊 4：未回流客列表 -->
      <section class="member-backflow__card member-backflow__card--list">
        <div class="member-backflow__card-header">
          <div class="member-backflow__card-title-wrapper">
            <span class="member-backflow__card-accent member-backflow__card-accent--secondary"></span>
            <h3 class="member-backflow__card-title">未回流客列表</h3>
          </div>
          <span class="member-backflow__card-count">{{ formatCount(nonReturnTotal) }} 人</span>
        </div>
        <div class="member-backflow__table-scroll">
          <ElTable
            :data="nonReturnMemberList"
            stripe
            style="width: 100%"
            size="small"
            v-loading="loading.nonReturnList"
          >
            <ElTableColumn label="會員姓名" min-width="120">
              <template #default="{ row }: { row: NonReturnMemberItem }">
                <div class="member-backflow__member-cell">
                  <div class="member-backflow__member-avatar member-backflow__member-avatar--non-return">{{ row.memberName.charAt(0) }}</div>
                  <span class="member-backflow__member-name">{{ row.memberName }}</span>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn label="聯絡電話" min-width="130">
              <template #default="{ row }: { row: NonReturnMemberItem }">
                <span class="member-backflow__member-phone">{{ row.memberPhone }}</span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="會員等級" min-width="100" align="center">
              <template #default="{ row }: { row: NonReturnMemberItem }">
                {{ row.memberLevel }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="最後消費日" min-width="120" align="center">
              <template #default="{ row }: { row: NonReturnMemberItem }">
                {{ row.lastConsumeTime }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="未回流天數" min-width="110" align="center">
              <template #default="{ row }: { row: NonReturnMemberItem }">
                <span class="member-backflow__no-backflow-days">{{ row.noBackflowDays }} 天</span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="流失等級" min-width="100" align="center">
              <template #default="{ row }: { row: NonReturnMemberItem }">
                <span
                  class="member-backflow__loss-tag"
                  :class="{
                    'member-backflow__loss-tag--mild': row.lossLevel === '輕度',
                    'member-backflow__loss-tag--moderate': row.lossLevel === '中度',
                    'member-backflow__loss-tag--severe': row.lossLevel === '重度',
                  }"
                >
                  {{ row.lossLevel }}
                </span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="負責人員" min-width="100">
              <template #default="{ row }: { row: NonReturnMemberItem }">
                {{ row.chargeStaffName }}
              </template>
            </ElTableColumn>
          </ElTable>
          <!-- 空數據狀態 -->
          <div v-if="!loading.nonReturnList && nonReturnMemberList.length === 0 && !error.nonReturnList" class="member-backflow__empty">
            <span class="material-symbols-outlined member-backflow__empty-icon">person_off</span>
            <div class="member-backflow__empty-text">
              <span class="member-backflow__empty-title">暫無未回流客數據</span>
              <span class="member-backflow__empty-desc">所有會員均有在近期到店記錄，暫無需喚回之會員</span>
            </div>
          </div>
          <!-- 錯誤狀態 -->
          <div v-if="error.nonReturnList" class="member-backflow__error">
            <span class="material-symbols-outlined">error_outline</span>
            <span>{{ error.nonReturnList }}</span>
            <button class="member-backflow__retry-btn" @click="loadNonReturnList">重新加載</button>
          </div>
        </div>
        <div class="member-backflow__pagination-wrapper">
          <ElPagination
            v-model:current-page="nonReturnPage"
            v-model:page-size="pageSize"
            :total="nonReturnTotal"
            layout="total, sizes, prev, pager, next, jumper"
            background
            small
            @current-change="onNonReturnPageChange"
          />
        </div>
      </section>
    </div>
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
.member-backflow {
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
.member-backflow__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-xl;
}

.member-backflow__breadcrumb {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: $spacing-sm;
}

.member-backflow__breadcrumb-item {
  font-size: 13px;
  color: $color-on-surface-muted;

  &--current {
    color: $color-on-surface-variant;
    font-weight: 500;
  }
}

.member-backflow__breadcrumb-separator {
  font-size: 14px;
  color: $color-on-surface-muted;
}

.member-backflow__title {
  font-size: 24px;
  font-weight: 600;
  color: $color-on-surface;
  margin: 0;
}

.member-backflow__header-actions {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.member-backflow__time-switcher {
  display: flex;
  gap: 2px;
  padding: 3px;
  background: $color-surface-container-low;
  border-radius: 8px;
  border: 1px solid $color-border;
}

.member-backflow__time-btn {
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

.member-backflow__date-range {
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
// 上層網格（圖表區）
// ============================================================================
.member-backflow__grid-top {
  display: grid;
  gap: $spacing-xl;
  margin-bottom: $spacing-xl;

  // 桌面端：5 欄 + 7 欄
  @media (min-width: 1200px) {
    grid-template-columns: 5fr 7fr;
  }

  // 平板端：單欄
  @media (min-width: 768px) and (max-width: 1199px) {
    grid-template-columns: 1fr;
  }
}

// ============================================================================
// 下層網格（列表區）
// ============================================================================
.member-backflow__grid-bottom {
  display: grid;
  gap: $spacing-xl;

  // 桌面端：雙欄
  @media (min-width: 1200px) {
    grid-template-columns: 1fr 1fr;
  }

  // 平板端：單欄
  @media (min-width: 768px) and (max-width: 1199px) {
    grid-template-columns: 1fr;
  }
}

// ============================================================================
// 卡片通用
// ============================================================================
.member-backflow__card {
  background: $color-white;
  border-radius: $card-radius;
  box-shadow: $card-shadow;
  overflow: hidden;
}

.member-backflow__card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg $spacing-xl;
  border-bottom: 1px solid $color-border;
}

.member-backflow__card-title-wrapper {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.member-backflow__card-accent {
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: $color-primary;
  flex-shrink: 0;

  &--secondary {
    background: $color-secondary;
  }

  &--tertiary {
    background: #ac235a;
  }
}

.member-backflow__card-title {
  font-size: 16px;
  font-weight: 600;
  color: $color-on-surface;
  margin: 0;
}

.member-backflow__card-count {
  font-size: 13px;
  font-weight: 500;
  color: $color-on-surface-muted;
  padding: 4px 10px;
  background: $color-surface;
  border-radius: 6px;
}

// ============================================================================
// 回流與未回流客占比（Donut Chart）
// ============================================================================
.member-backflow__ratio-content {
  display: flex;
  align-items: center;
  gap: $spacing-xl;
  padding: $spacing-xl;
}

.member-backflow__donut-wrapper {
  position: relative;
  width: 160px;
  height: 160px;
  flex-shrink: 0;
}

.member-backflow__donut {
  width: 100%;
  height: 100%;
}

.member-backflow__donut-segment {
  transition: stroke-dashoffset 0.6s ease;
}

.member-backflow__donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.member-backflow__donut-value {
  display: block;
  font-size: 26px;
  font-weight: 700;
  color: $color-primary-dark;
  line-height: 1.2;
}

.member-backflow__donut-label {
  display: block;
  font-size: 11px;
  color: $color-on-surface-muted;
  margin-top: 2px;
}

.member-backflow__ratio-legend {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  flex: 1;
}

.member-backflow__ratio-legend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.member-backflow__ratio-legend-left {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.member-backflow__ratio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.member-backflow__ratio-label {
  font-size: 14px;
  color: $color-on-surface-variant;
}

.member-backflow__ratio-value {
  font-size: 14px;
  font-weight: 600;
  color: $color-on-surface;
}

.member-backflow__ratio-stats {
  display: flex;
  gap: $spacing-xl;
  margin-top: $spacing-sm;
  padding-top: $spacing-md;
  border-top: 1px solid $color-border;
}

.member-backflow__ratio-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-backflow__ratio-stat-label {
  font-size: 12px;
  color: $color-on-surface-muted;
}

.member-backflow__ratio-stat-value {
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
// 工作人員回流數據統計（表格）
// ============================================================================
.member-backflow__table-scroll {
  overflow-x: auto;
}

.member-backflow__staff-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  thead {
    th {
      padding: 12px $spacing-xl;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: $color-on-surface-muted;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: $color-surface;
      border-bottom: 1px solid $color-border;
      white-space: nowrap;
    }
  }

  tbody {
    tr {
      transition: background 0.15s ease;

      &:hover {
        background: $color-surface-container-low;
      }
    }

    td {
      padding: 14px $spacing-xl;
      border-bottom: 1px solid $color-border;
      color: $color-on-surface-variant;
    }
  }
}

.member-backflow__staff-row {
  cursor: pointer;
}

.member-backflow__staff-rank {
  width: 60px;
}

.member-backflow__rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  color: $color-on-surface-variant;
  background: $color-surface;

  &--gold {
    color: #b8860b;
    background: rgba(#b8860b, 0.12);
  }

  &--silver {
    color: #6b7b8d;
    background: rgba(#6b7b8d, 0.12);
  }

  &--bronze {
    color: #a0522d;
    background: rgba(#a0522d, 0.12);
  }
}

.member-backflow__staff-name {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.member-backflow__staff-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: $color-white;
  background: $color-primary;
  flex-shrink: 0;
}

.member-backflow__staff-name-text {
  font-size: 14px;
  font-weight: 500;
  color: $color-on-surface;
}

.member-backflow__staff-title {
  font-size: 12px;
  color: $color-on-surface-muted;
}

.member-backflow__staff-count {
  font-weight: 600;

  &--return {
    color: $color-primary-dark;
  }

  &--non-return {
    color: $color-secondary;
  }
}

.member-backflow__churn-cell {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  min-width: 140px;
}

.member-backflow__churn-rate {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;

  &--high {
    color: #e74c3c;
  }

  &--mid {
    color: #e8a838;
  }

  &--low {
    color: #328517;
  }
}

.member-backflow__churn-bar {
  flex: 1;
  height: 6px;
  background: $color-border;
  border-radius: 3px;
  overflow: hidden;
  min-width: 60px;
}

.member-backflow__churn-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;

  &--high {
    background: #e74c3c;
  }

  &--mid {
    background: #e8a838;
  }

  &--low {
    background: #328517;
  }
}

// ============================================================================
// 工作人員未回流客統計（ECharts 長條圖 + 統計卡片）
// ============================================================================
.member-backflow__grid-middle {
  margin-bottom: $spacing-xl;
}

.member-backflow__card--nonreturn-chart {
  overflow: visible;
}

.member-backflow__nonreturn-content {
  padding: $spacing-xl;
}

.member-backflow__nonreturn-stats {
  display: flex;
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.member-backflow__nonreturn-stat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-lg $spacing-xl;
  background: $color-surface;
  border-radius: 10px;
  border: 1px solid $color-border;
  min-width: 180px;
}

.member-backflow__nonreturn-stat-label {
  font-size: 13px;
  color: $color-on-surface-muted;
  font-weight: 500;
}

.member-backflow__nonreturn-stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;

  &--primary {
    color: #ac235a;
  }

  &--secondary {
    color: $color-secondary;
  }
}

.member-backflow__nonreturn-stat-unit {
  font-size: 12px;
  color: $color-on-surface-muted;
}

.member-backflow__chart-wrapper {
  width: 100%;
  height: 400px;

  @media (min-width: 768px) and (max-width: 1199px) {
    height: 360px;
  }

  @media (max-width: 767px) {
    height: 300px;
  }
}

.member-backflow__bar-chart {
  width: 100%;
  height: 100%;
}

// ============================================================================
// 回流/未回流客列表（表格）
// ============================================================================
.member-backflow__member-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  thead {
    th {
      padding: 12px $spacing-xl;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: $color-on-surface-muted;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: $color-surface;
      border-bottom: 1px solid $color-border;
      white-space: nowrap;
    }
  }

  tbody {
    tr {
      transition: background 0.15s ease;

      &:hover {
        background: $color-surface-container-low;
      }
    }

    td {
      padding: 14px $spacing-xl;
      border-bottom: 1px solid $color-border;
      color: $color-on-surface-variant;
    }
  }
}

.member-backflow__member-row {
  cursor: pointer;
}

.member-backflow__member-cell {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.member-backflow__member-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: $color-white;
  flex-shrink: 0;

  &--return {
    background: $color-primary-dark;
  }

  &--non-return {
    background: $color-secondary;
  }
}

.member-backflow__member-name {
  font-size: 14px;
  font-weight: 500;
  color: $color-on-surface;
}

.member-backflow__member-phone {
  font-size: 13px;
  color: $color-on-surface-muted;
  font-family: monospace;
}

.member-backflow__member-count {
  font-weight: 600;
  color: $color-on-surface-variant;
}

.member-backflow__member-amount {
  font-weight: 600;
  color: $color-on-surface;
}

// ============================================================================
// 未回流天數 & 流失等級標籤
// ============================================================================
.member-backflow__no-backflow-days {
  font-size: 13px;
  font-weight: 600;
  color: $color-on-surface-variant;
  font-family: monospace;
}

.member-backflow__loss-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;

  &--mild {
    color: #1a73e8;
    background: rgba(#1a73e8, 0.10);
  }

  &--moderate {
    color: #e8a838;
    background: rgba(#e8a838, 0.12);
  }

  &--severe {
    color: #e74c3c;
    background: rgba(#e74c3c, 0.10);
  }
}

// ============================================================================
// 空數據 / 錯誤 / 加載狀態
// ============================================================================
.member-backflow__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
  padding: $spacing-2xl $spacing-xl;
  text-align: center;
}

.member-backflow__empty-icon {
  font-size: 40px !important;
  color: $color-on-surface-muted;
  opacity: 0.5;
  margin-bottom: $spacing-xs;
}

.member-backflow__empty-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-backflow__empty-title {
  font-size: 15px;
  font-weight: 600;
  color: $color-on-surface-variant;
}

.member-backflow__empty-desc {
  font-size: 13px;
  color: $color-on-surface-muted;
  max-width: 320px;
  line-height: 1.5;
}

.member-backflow__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: $spacing-2xl;
  font-size: 14px;
  color: #e74c3c;

  .material-symbols-outlined {
    font-size: 32px;
    color: #e74c3c;
  }
}

.member-backflow__retry-btn {
  margin-top: $spacing-xs;
  padding: 6px 16px;
  border: 1px solid #e74c3c;
  background: $color-white;
  border-radius: 6px;
  color: #e74c3c;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;

  &:hover {
    background: #fef2f2;
  }
}

.member-backflow__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: $spacing-2xl;
  font-size: 14px;
  color: $color-on-surface-muted;

  .material-symbols-outlined {
    font-size: 20px;
  }
}

.member-backflow__loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// ============================================================================
// 分頁
// ============================================================================
.member-backflow__pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: $spacing-md $spacing-xl;
  border-top: 1px solid $color-border;
}

// ============================================================================
// 平板端適配（768px ~ 1199px）
// ============================================================================
@media (min-width: 768px) and (max-width: 1199px) {
  .member-backflow {
    padding: $spacing-lg;
  }

  .member-backflow__header {
    flex-direction: column;
    gap: $spacing-md;
  }

  .member-backflow__header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .member-backflow__title {
    font-size: 20px;
  }

  .member-backflow__ratio-content {
    flex-direction: row;
    padding: $spacing-lg;
    gap: $spacing-lg;
  }

  .member-backflow__donut-wrapper {
    width: 130px;
    height: 130px;
  }

  .member-backflow__donut-value {
    font-size: 22px;
  }

  .member-backflow__ratio-stats {
    flex-direction: row;
    gap: $spacing-lg;
  }

  .member-backflow__ratio-stat-value {
    font-size: 18px;
  }

  .member-backflow__nonreturn-content {
    padding: $spacing-lg;
  }

  .member-backflow__nonreturn-stats {
    gap: $spacing-md;
  }

  .member-backflow__nonreturn-stat-card {
    padding: $spacing-md $spacing-lg;
    min-width: 140px;
  }

  .member-backflow__nonreturn-stat-value {
    font-size: 24px;
  }

  .member-backflow__chart-wrapper {
    height: 360px;
  }

  .member-backflow__staff-table {
    font-size: 13px;

    thead th {
      padding: 10px $spacing-lg;
    }

    tbody td {
      padding: 12px $spacing-lg;
    }
  }

  .member-backflow__card-header {
    padding: $spacing-md $spacing-lg;
  }

  .member-backflow__card-title {
    font-size: 15px;
  }

  .member-backflow__grid-top,
  .member-backflow__grid-bottom {
    gap: $spacing-lg;
  }

  .member-backflow__pagination-wrapper {
    padding: $spacing-sm $spacing-lg;
  }

  .member-backflow__member-avatar {
    width: 26px;
    height: 26px;
    font-size: 11px;
  }

  .member-backflow__member-name {
    font-size: 13px;
  }

  .member-backflow__member-phone {
    font-size: 12px;
  }

  .member-backflow__loss-tag {
    font-size: 11px;
    padding: 2px 8px;
  }

  .member-backflow__no-backflow-days {
    font-size: 12px;
  }

  .member-backflow__churn-cell {
    min-width: 120px;
  }

  .member-backflow__churn-rate {
    font-size: 12px;
  }

  .member-backflow__churn-bar {
    min-width: 50px;
    height: 5px;
  }
}

// ============================================================================
// 桌面端適配（≥1200px）
// ============================================================================
@media (min-width: 1200px) {
  .member-backflow__ratio-content {
    flex-direction: row;
  }
}

// ============================================================================
// 全域 ElTable 樣式覆蓋（確保與系統主題一致）
// ============================================================================
:deep(.el-table) {
  --el-table-border-color: #f0e6e8;
  --el-table-header-bg-color: #fff8f8;
  --el-table-tr-bg-color: #ffffff;
  --el-table-row-hover-bg-color: #fdf2f5;

  font-size: 13px;

  th.el-table__cell {
    font-weight: 600;
    color: #8a7a7e;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 12px;
  }

  .el-table__cell {
    padding: 10px 12px;
  }
}

:deep(.el-pagination) {
  --el-pagination-button-color: #554149;
  --el-pagination-hover-color: #c84c8f;
  --el-pagination-button-bg-color: #ffffff;
  --el-pagination-button-hover-bg-color: #fdf2f5;

  button.is-active {
    --el-pagination-button-bg-color: #c84c8f;
    --el-pagination-button-color: #ffffff;
  }
}
</style>
