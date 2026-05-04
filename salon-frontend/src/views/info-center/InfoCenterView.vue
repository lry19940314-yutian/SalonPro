<!--
  InfoCenterView.vue - 資訊中心總覽（首頁）

  權限：美容師 / 店長
  設備：全部（PC / 平板 / 手機）

  設計稿參考：
  - PC 端：docs/UI設計稿/資訊中心/總覽/資訊中心-總覽.html
  - 移動端：docs/UI設計稿/資訊中心/總覽/資訊中心-總覽-移動端.html

  功能：
  1. 本月總營業額卡片
  2. 今日預約數卡片
  3. 年度營業額趨勢圖（長條圖）
  4. 服務類別佔比圓餅圖

  技術棧：Vue 3 Composition API + TypeScript + SCSS
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDevice } from '@/composables/useDevice'

const { isMobile } = useDevice()

// ==================== 模擬數據（後續接入 API）====================

/** 本月總營業額 */
const monthlyRevenue = ref(158000)

/** 本月營業額增長率 */
const revenueGrowth = ref(12)

/** 今日預約數 */
const todayAppointments = ref(24)

/** 年度營業額趨勢數據 */
const yearlyTrend = ref([
  { month: '1月', value: 40 },
  { month: '2月', value: 55 },
  { month: '3月', value: 45 },
  { month: '4月', value: 70 },
  { month: '5月', value: 60 },
  { month: '6月', value: 90 },
  { month: '7月', value: 75 },
  { month: '8月', value: 85 },
  { month: '9月', value: 65 },
  { month: '10月', value: 80 },
  { month: '11月', value: 95 },
  { month: '12月', value: 88 },
])

/** 服務類別佔比數據 */
const serviceDistribution = ref([
  { name: '剪髮', percentage: 65, color: '#a22c70' },
  { name: '染髮', percentage: 20, color: '#794c8f' },
  { name: '護理', percentage: 15, color: '#328517' },
])

/** 圓餅圖漸變背景 */
const donutGradient = computed(() => {
  const segments = serviceDistribution.value
  let gradient = 'conic-gradient('
  let currentAngle = 0

  segments.forEach((seg, index) => {
    const startAngle = currentAngle
    const endAngle = currentAngle + (seg.percentage / 100) * 360
    gradient += `${seg.color} ${startAngle}deg ${endAngle}deg`
    if (index < segments.length - 1) gradient += ', '
    currentAngle = endAngle
  })

  gradient += ')'
  return gradient
})

/** 格式化金額 */
function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`
}
</script>

<template>
  <div class="info-center" :class="{ 'info-center--mobile': isMobile }">
    <!-- ===== 頁面標題 ===== -->
    <div class="info-center__header">
      <div>
        <h1 class="info-center__title">資訊中心總覽</h1>
        <p class="info-center__subtitle">即時掌握門市營運狀況與業績趨勢</p>
      </div>
    </div>

    <!-- ===== 統計卡片區 ===== -->
    <section class="info-center__stats">
      <!-- 本月總營業額 -->
      <div class="info-center__card">
        <div class="info-center__card-header">
          <div class="info-center__card-icon info-center__card-icon--revenue">
            <span class="material-symbols-outlined">payments</span>
          </div>
          <span class="info-center__card-badge info-center__card-badge--up">
            <span class="material-symbols-outlined">trending_up</span>
            +{{ revenueGrowth }}%
          </span>
        </div>
        <p class="info-center__card-label">本月總營業額</p>
        <h2 class="info-center__card-value">{{ formatCurrency(monthlyRevenue) }}</h2>
      </div>

      <!-- 今日預約數 -->
      <div class="info-center__card">
        <div class="info-center__card-header">
          <div class="info-center__card-icon info-center__card-icon--appointment">
            <span class="material-symbols-outlined">calendar_month</span>
          </div>
          <button class="info-center__card-action">查看詳情</button>
        </div>
        <p class="info-center__card-label">今日預約數</p>
        <h2 class="info-center__card-value">
          {{ todayAppointments }}
          <span class="info-center__card-unit">組客戶</span>
        </h2>
      </div>
    </section>

    <!-- ===== 年度營業額趨勢圖 ===== -->
    <section class="info-center__chart-section">
      <div class="info-center__chart-header">
        <h3 class="info-center__chart-title">年度營業額趨勢</h3>
        <span class="material-symbols-outlined info-center__chart-more">more_vert</span>
      </div>
      <div class="info-center__bar-chart">
        <div
          v-for="(item, index) in yearlyTrend"
          :key="index"
          class="info-center__bar-wrapper"
        >
          <div
            class="info-center__bar"
            :style="{ height: item.value + '%' }"
            :class="{
              'info-center__bar--highlight': item.value >= 80,
              'info-center__bar--medium': item.value >= 50 && item.value < 80,
              'info-center__bar--low': item.value < 50,
            }"
          ></div>
        </div>
      </div>
      <div class="info-center__bar-labels">
        <span v-for="(item, index) in yearlyTrend" :key="index">{{ item.month }}</span>
      </div>
    </section>

    <!-- ===== 服務類別佔比（圓餅圖）===== -->
    <section class="info-center__chart-section">
      <div class="info-center__chart-header">
        <h3 class="info-center__chart-title">服務類別佔比</h3>
      </div>
      <div class="info-center__donut-wrapper">
        <div
          class="info-center__donut"
          :style="{ background: donutGradient }"
        >
          <div class="info-center__donut-center">
            <span class="info-center__donut-label">總計</span>
            <span class="info-center__donut-value">100%</span>
          </div>
        </div>
        <div class="info-center__donut-legend">
          <div
            v-for="(item, index) in serviceDistribution"
            :key="index"
            class="info-center__legend-item"
          >
            <span
              class="info-center__legend-dot"
              :style="{ backgroundColor: item.color }"
            ></span>
            <span class="info-center__legend-name">{{ item.name }}</span>
            <span class="info-center__legend-value">{{ item.percentage }}%</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
// ==================== 變量 ====================
$primary: #a22c70;
$primary-light: #c84c8f;
$secondary: #794c8f;
$tertiary: #328517;
$surface: #fff8f8;
$on-surface: #23191d;
$on-surface-variant: #554149;
$border: #e2e8f0;
$card-shadow: 0 12px 20px rgba(0, 0, 0, 0.04);

// ==================== 佈局 ====================
.info-center {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;

  &--mobile {
    padding: 16px;
    gap: 24px;
  }
}

// ==================== 頁面標題 ====================
.info-center__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.info-center__title {
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
  color: $on-surface;
  margin: 0;
}

.info-center__subtitle {
  font-size: 14px;
  line-height: 20px;
  color: $on-surface-variant;
  margin: 0;
  margin-top: 4px;
}

// ==================== 統計卡片 ====================
.info-center__stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  .info-center--mobile & {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.info-center__card {
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid $border;
  box-shadow: $card-shadow;

  .info-center--mobile & {
    padding: 20px;
  }
}

.info-center__card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.info-center__card-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    font-size: 24px;
  }

  &--revenue {
    background: rgba($primary, 0.1);
    color: $primary;
  }

  &--appointment {
    background: rgba($secondary, 0.1);
    color: $secondary;
  }
}

.info-center__card-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  padding: 4px 8px;
  border-radius: 9999px;

  span {
    font-size: 14px;
  }

  &--up {
    color: $tertiary;
    background: rgba($tertiary, 0.15);
  }
}

.info-center__card-action {
  font-size: 12px;
  font-weight: 600;
  color: $primary;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
}

.info-center__card-label {
  font-size: 14px;
  line-height: 20px;
  color: $on-surface-variant;
  margin: 0;
  margin-bottom: 4px;
}

.info-center__card-value {
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
  color: $on-surface;
  margin: 0;
}

.info-center__card-unit {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: $on-surface-variant;
}

// ==================== 圖表區塊 ====================
.info-center__chart-section {
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid $border;
  box-shadow: $card-shadow;

  .info-center--mobile & {
    padding: 20px;
  }
}

.info-center__chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.info-center__chart-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  color: $on-surface;
  margin: 0;
}

.info-center__chart-more {
  color: #94a3b8;
  cursor: pointer;
}

// ==================== 長條圖 ====================
.info-center__bar-chart {
  height: 192px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 0 8px;
}

.info-center__bar-wrapper {
  flex: 1;
  display: flex;
  align-items: flex-end;
  height: 100%;
}

.info-center__bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
  min-height: 4px;

  &--highlight {
    background: $primary;
  }

  &--medium {
    background: rgba($primary, 0.6);
  }

  &--low {
    background: rgba($primary, 0.2);
  }

  &:hover {
    opacity: 0.8;
  }
}

.info-center__bar-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  font-size: 12px;
  line-height: 16px;
  color: $on-surface-variant;
}

// ==================== 圓餅圖 ====================
.info-center__donut-wrapper {
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 8px 0;

  .info-center--mobile & {
    flex-direction: column;
    gap: 24px;
  }
}

.info-center__donut {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;

  .info-center--mobile & {
    width: 140px;
    height: 140px;
  }
}

.info-center__donut-center {
  position: absolute;
  inset: 20%;
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.info-center__donut-label {
  font-size: 12px;
  line-height: 16px;
  color: $on-surface-variant;
}

.info-center__donut-value {
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  color: $on-surface;
}

.info-center__donut-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-center__legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-center__legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.info-center__legend-name {
  font-size: 14px;
  line-height: 20px;
  color: $on-surface;
  flex: 1;
}

.info-center__legend-value {
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: $on-surface;
}
</style>
