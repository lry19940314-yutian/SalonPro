/**
 * auth.ts - 認證相關 API 接口
 *
 * 功能：
 * 1. 登錄接口（客戶代碼 + 帳號密碼）
 * 2. Token 刷新接口
 * 3. 登出接口
 * 4. 獲取當前使用者資訊接口
 *
 * 技術棧：Axios + TypeScript
 */

import { post, get } from '@/utils/request'
import type {
  ApiResponse,
  LoginParams,
  LoginResult,
  RefreshTokenParams,
  RefreshTokenResult,
} from '@/types/api'

/**
 * 登錄
 *
 * @description 使用客戶代碼 + 員工帳號 + 密碼進行登錄
 * @param params - 登錄參數
 * @returns 登錄結果（Token + 使用者資訊）
 *
 * @example
 * ```ts
 * const res = await loginApi({
 *   customerCode: 'SH001',
 *   account: 'staff01',
 *   password: 'password123',
 * })
 * ```
 */
export function loginApi(params: LoginParams): Promise<ApiResponse<LoginResult>> {
  return post<LoginResult>('/auth/login', params)
}

/**
 * 刷新 Token
 *
 * @description 使用 Refresh Token 獲取新的 Access Token
 * @param params - Refresh Token 參數
 * @returns 新的 Token 資訊
 */
export function refreshTokenApi(params: RefreshTokenParams): Promise<ApiResponse<RefreshTokenResult>> {
  return post<RefreshTokenResult>('/auth/refresh', params)
}

/**
 * 登出
 *
 * @description 清除伺服器端的 Token 狀態
 * @returns 操作結果
 */
export function logoutApi(): Promise<ApiResponse<null>> {
  return post<null>('/auth/logout')
}

/**
 * 獲取當前使用者資訊
 *
 * @description 從 Token 解析並返回當前登入使用者詳細資訊
 * @returns 使用者資訊
 */
export function getCurrentUserApi(): Promise<ApiResponse<LoginResult['user']>> {
  return get<LoginResult['user']>('/auth/current-user')
}
