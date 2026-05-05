/**
 * info-center.ts - 資訊中心 API 接口
 *
 * 功能：
 * 1. 門店年度營業額統計
 * 2. 分類營業額統計
 * 3. 工作人員業績排行
 * 4. 新客分析 - 新客總覽數據
 *
 * 技術棧：Axios + TypeScript
 *
 * 對接後端控制器：PerformanceController
 * - GET /admin/information/yearly    門店年度營業額
 * - GET /admin/information/category  分類營業額
 * - GET /admin/information/staff     員工業績排行
 * - GET /admin/member/analysis/new-customer  新客總覽分析
 *
 * 數據庫表結構參考 README：
 * - performance 表：業績記錄，按 shop_id + performance_date 聚合
 * - service_category 表：服務分類，關聯 appointment_item
 * - staff 表：員工資料，關聯 performance
 * - member 表：會員資料，新客分析關聯 member.created_at、member.source
 */

import { get } from '@/utils/request'
import type { ApiResponse } from '@/types/api'

// ==================== 類型定義 ====================

/** 分類營業額數據結構 */
export interface CategoryRevenueItem {
  /** 分類 ID */
  categoryId: number
  /** 分類名稱 */
  categoryName: string
  /** 營業額金額 */
  amount: number
  /** 佔比（%） */
  ratio: number
}

/** 門店年度營業額數據結構 */
export interface YearlyRevenueData {
  /** 年份 */
  year: number
  /** 年度總營業額 */
  totalAmount: number
  /** 月度營業額陣列（1-12月） */
  monthlyData: number[]
  /** 同比增幅（%） */
  growthRate: number
}

/** 工作人員業績排行數據結構 */
export interface StaffRankingItem {
  /** 排名（由前端計算） */
  rank: number
  /** 員工 ID */
  staffId: number
  /** 姓名 */
  name: string
  /** 業績金額 */
  amount: number
  /** 完成百分比（相對於第一名） */
  percentage: number
}

// ==================== 新客分析類型定義 ====================

/** 新客核心指標 */
export interface NewCustomerMetrics {
  /** 累計總新客數 */
  totalNewCustomer: number
  /** 本月新增新客數 */
  monthNewCustomer: number
  /** 本周新增新客數 */
  weekNewCustomer: number
  /** 今日新增新客數 */
  dayNewCustomer: number
  /** 本月新客數環比增長率（%） */
  monthGrowthRate: number
}

/** 新客增長趨勢數據項 */
export interface NewCustomerTrendItem {
  /** 日期（YYYY-MM-DD） */
  date: string
  /** 該日新客數量 */
  newCustomerCount: number
}

/** 新客來源統計數據項 */
export interface SourceStatItem {
  /** 來源渠道名稱 */
  sourceName: string
  /** 該渠道新客數量 */
  sourceCount: number
  /** 該渠道新客數占比（%） */
  sourceRatio: number
}

/** 新客分析 - 新客總覽 API 響應數據結構 */
export interface NewCustomerAnalysisData {
  /** 新客核心指標 */
  metrics: NewCustomerMetrics
  /** 新客增長趨勢（最近30天） */
  trend: NewCustomerTrendItem[]
  /** 新客來源統計 */
  sources: SourceStatItem[]
}

// ==================== API 接口 ====================

/**
 * 獲取門店年度營業額統計
 *
 * GET /admin/information/yearly?year=2026
 *
 * 數據庫來源：
 * - performance 表：按 shop_id + YEAR(performance_date) 分組聚合
 * - 計算 monthlyData：按 MONTH(performance_date) 分組
 * - 計算 growthRate：與去年同比
 *
 * @param year - 年份（預設當前年份）
 * @returns 年度營業額數據
 */
export function getYearlyRevenueApi(year?: number): Promise<ApiResponse<YearlyRevenueData>> {
  const targetYear = year || new Date().getFullYear()
  return get<YearlyRevenueData>('/admin/information/yearly', { year: targetYear })
}

/**
 * 獲取分類營業額統計
 *
 * GET /admin/information/category?startDate=2026-01-01&endDate=2026-12-31
 *
 * 數據庫來源：
 * - appointment_item 表：關聯 service_item.service_category_id
 * - service_category 表：分類名稱
 * - 按 service_category_id 分組聚合 amount
 *
 * @param startDate - 開始日期（YYYY-MM-DD）
 * @param endDate - 結束日期（YYYY-MM-DD）
 * @returns 分類營業額列表
 */
export function getCategoryRevenueApi(
  startDate: string,
  endDate: string
): Promise<ApiResponse<CategoryRevenueItem[]>> {
  return get<CategoryRevenueItem[]>('/admin/information/category', {
    startDate,
    endDate,
  })
}

/**
 * 獲取工作人員業績排行
 *
 * GET /admin/information/staff?startDate=2026-01-01&endDate=2026-12-31&limit=10
 *
 * 數據庫來源：
 * - performance 表：按 staff_id 分組聚合 amount
 * - staff 表：員工姓名 name
 * - percentage = 該員工金額 / 第一名金額 * 100
 *
 * @param startDate - 開始日期（YYYY-MM-DD）
 * @param endDate - 結束日期（YYYY-MM-DD）
 * @param limit - 排行數量（預設 10）
 * @returns 工作人員業績排行列表
 */
export function getStaffRankingApi(
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<ApiResponse<StaffRankingItem[]>> {
  return get<StaffRankingItem[]>('/admin/information/staff', {
    startDate,
    endDate,
    limit,
  })
}

/**
 * 獲取新客分析 - 新客總覽數據
 *
 * GET /admin/member/analysis/new-customer
 *
 * 數據庫來源：
 * - member 表：關聯 member.created_at（新客時間）、member.source（來源渠道）
 * - 核心指標：按 shop_id 聚合，統計總數、本月、本周、今日新增
 * - 增長趨勢：按日期聚合最近30天新增會員數
 * - 來源統計：按 source 字段分組統計
 *
 * @returns 新客總覽分析數據（核心指標 + 趨勢 + 來源）
 */
export function getNewCustomerAnalysisApi(): Promise<ApiResponse<NewCustomerAnalysisData>> {
  return get<NewCustomerAnalysisData>('/admin/member/analysis/new-customer')
}

// ==================== 回流分析類型定義 ====================

/** 工作人員未回流客統計項 */
export interface StaffNonReturnStatItem {
  /** 員工 ID */
  staffId: number
  /** 員工姓名 */
  staffName: string
  /** 未回流客數 */
  noBackflowCount: number
  /** 未回流率（%） */
  noBackflowRatio: number
}

/** 回流客列表項 */
export interface BackflowMemberItem {
  /** 會員 ID */
  memberId: string
  /** 會員姓名 */
  memberName: string
  /** 會員電話 */
  memberPhone: string
  /** 會員等級 */
  memberLevel: string
  /** 最後消費日 */
  lastConsumeTime: string
  /** 負責人員 */
  chargeStaffName: string
  /** 回流狀態 */
  backflowStatus: string
}

/** 未回流客列表項 */
export interface NonReturnMemberItem {
  /** 會員 ID */
  memberId: string
  /** 會員姓名 */
  memberName: string
  /** 會員電話 */
  memberPhone: string
  /** 會員等級 */
  memberLevel: string
  /** 最後消費日 */
  lastConsumeTime: string
  /** 負責人員 */
  chargeStaffName: string
  /** 未回流天數 */
  noBackflowDays: number
  /** 流失等級（輕度/中度/重度） */
  lossLevel: string
}

/** 回流客分頁列表響應 */
export interface BackflowListResponse {
  /** 列表數據 */
  items: BackflowMemberItem[]
  /** 總筆數 */
  total: number
  /** 當前頁碼 */
  page: number
  /** 每頁筆數 */
  pageSize: number
}

/** 未回流客分頁列表響應 */
export interface NonReturnListResponse {
  /** 列表數據 */
  items: NonReturnMemberItem[]
  /** 總筆數 */
  total: number
  /** 當前頁碼 */
  page: number
  /** 每頁筆數 */
  pageSize: number
}

// ==================== 回流分析 API 接口 ====================

/**
 * 獲取工作人員未回流客統計
 *
 * GET /admin/member/backflow/staff-stat
 *
 * 統計每位工作人員負責的會員中，超過 30 天未到店的會員數與佔比
 *
 * 數據庫來源：
 * - member 表：關聯 member.staff_id（負責人員）、member.last_visit（最後到店時間）
 * - staff 表：員工姓名 name
 *
 * @returns 工作人員未回流客統計列表
 */
export function getStaffNonReturnStatsApi(): Promise<ApiResponse<StaffNonReturnStatItem[]>> {
  return get<StaffNonReturnStatItem[]>('/admin/member/backflow/staff-stat')
}

/**
 * 獲取回流客列表
 *
 * GET /admin/member/backflow/list?page=1&pageSize=10
 *
 * 查詢最近 30 天內有到店記錄的會員列表
 *
 * 數據庫來源：
 * - member 表：關聯 member.last_visit（最後到店時間）
 * - member_level 表：會員等級名稱
 * - staff 表：負責人員姓名
 *
 * @param page - 當前頁碼（預設 1）
 * @param pageSize - 每頁筆數（預設 10）
 * @returns 回流客分頁列表
 */
export function getBackflowListApi(
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<BackflowListResponse>> {
  return get<BackflowListResponse>('/admin/member/backflow/list', { page, pageSize })
}

/**
 * 獲取未回流客列表
 *
 * GET /admin/member/backflow/no-list?page=1&pageSize=10
 *
 * 查詢超過 30 天未到店的會員列表
 *
 * 數據庫來源：
 * - member 表：關聯 member.last_visit（最後到店時間）
 * - member_level 表：會員等級名稱
 * - staff 表：負責人員姓名
 *
 * @param page - 當前頁碼（預設 1）
 * @param pageSize - 每頁筆數（預設 10）
 * @returns 未回流客分頁列表
 */
export function getNonReturnListApi(
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<NonReturnListResponse>> {
  return get<NonReturnListResponse>('/admin/member/backflow/no-list', { page, pageSize })
}
