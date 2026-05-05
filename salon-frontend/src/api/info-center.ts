/**
 * info-center.ts - 資訊中心 API 接口
 *
 * 功能：
 * 1. 門店年度營業額統計
 * 2. 分類營業額統計
 * 3. 工作人員業績排行
 *
 * 技術棧：Axios + TypeScript
 *
 * 對接後端控制器：PerformanceController（/api/performances）
 * - GET /performances/stats/yearly         門店年度營業額
 * - GET /performances/stats/category-revenue 分類營業額
 * - GET /performances/staff-ranking          工作人員業績排行
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

// ==================== API 接口 ====================

/**
 * 獲取門店年度營業額統計
 *
 * GET /api/performances/stats/yearly?year=2026
 *
 * @param year - 年份（預設當前年份）
 * @returns 年度營業額數據
 */
export function getYearlyRevenueApi(year?: number): Promise<ApiResponse<YearlyRevenueData>> {
  const targetYear = year || new Date().getFullYear()
  return get<YearlyRevenueData>('/performances/stats/yearly', { year: targetYear })
}

/**
 * 獲取分類營業額統計
 *
 * GET /api/performances/stats/category-revenue?startDate=2026-01-01&endDate=2026-12-31
 *
 * @param startDate - 開始日期（YYYY-MM-DD）
 * @param endDate - 結束日期（YYYY-MM-DD）
 * @returns 分類營業額列表
 */
export function getCategoryRevenueApi(
  startDate: string,
  endDate: string
): Promise<ApiResponse<CategoryRevenueItem[]>> {
  return get<CategoryRevenueItem[]>('/performances/stats/category-revenue', {
    startDate,
    endDate,
  })
}

/**
 * 獲取工作人員業績排行
 *
 * GET /api/performances/staff-ranking?startDate=2026-01-01&endDate=2026-12-31&limit=10
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
  return get<StaffRankingItem[]>('/performances/staff-ranking', {
    startDate,
    endDate,
    limit,
  })
}
