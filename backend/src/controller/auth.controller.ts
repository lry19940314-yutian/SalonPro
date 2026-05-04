// ============================================================================
// 美業 SaaS 智慧管理系統 — 認證控制器
// ============================================================================
// 功能：登入、Token 刷新、登出、獲取當前使用者資訊
// ============================================================================

import {
  Controller,
  Post,
  Get,
  Body,
  Inject,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { AuthService } from '../service/AuthService';
import { LoginDTO, RefreshTokenDTO } from '../dto/auth.dto';
import { StaffDAO } from '../dao/StaffDAO';
import { LoginResult, RefreshTokenResult } from '../interface';

@Controller('/api/auth')
export class AuthController {
  @Inject()
  authService: AuthService;

  @Inject()
  staffDAO: StaffDAO;

  @Inject()
  ctx: Context;

  /**
   * 登入接口
   *
   * POST /api/auth/login
   *
   * 使用客戶代碼 + 帳號密碼登入
   *
   * @param loginDTO - 登入參數（shopCode, username, password）
   * @returns 登入結果（Token + 使用者資訊）
   *
   * @example
   * ```json
   * {
   *   "shopCode": "SALON001",
   *   "username": "manager01",
   *   "password": "123456"
   * }
   * ```
   */
  @Post('/login', { summary: '登入' })
  async login(@Body() loginDTO: LoginDTO): Promise<LoginResult> {
    return this.authService.login({
      shopCode: loginDTO.shopCode,
      username: loginDTO.username,
      password: loginDTO.password,
    });
  }

  /**
   * 刷新 Token 接口
   *
   * POST /api/auth/refresh
   *
   * 使用 Refresh Token 獲取新的 Access Token
   *
   * @param refreshTokenDTO - Refresh Token
   * @returns 新的 Token 對
   *
   * @example
   * ```json
   * {
   *   "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
   * }
   * ```
   */
  @Post('/refresh', { summary: '刷新 Token' })
  async refresh(
    @Body() refreshTokenDTO: RefreshTokenDTO
  ): Promise<RefreshTokenResult> {
    return this.authService.refreshToken(refreshTokenDTO.refreshToken);
  }

  /**
   * 獲取當前使用者資訊
   *
   * GET /api/auth/me
   *
   * 需要登入認證（Bearer Token）
   * 認證由全局 AuthMiddleware 處理，公開路由已排除
   *
   * @returns 當前登入使用者詳細資訊
   */
  @Get('/me', { summary: '獲取當前使用者資訊', middleware: ['authMiddleware'] })
  async getCurrentUser(): Promise<LoginResult['user']> {
    const staffId: number = this.ctx.state.staffId;

    const staff = await this.staffDAO.findById(staffId);
    if (!staff) {
      throw new Error('使用者不存在');
    }

    return {
      id: staff.id,
      name: staff.name,
      role: this.ctx.state.roleCode,
      shopId: staff.shopId,
      shopCode: this.ctx.state.shopCode,
      shopName: staff.shop?.name || '',
      avatar: staff.avatar || '',
      phone: staff.phone || undefined,
      title: staff.title || undefined,
    };
  }

  /**
   * 登出接口
   *
   * POST /api/auth/logout
   *
   * 客戶端清除 Token 即可，服務端無需額外操作
   * （若需 Token 黑名單機制，可在此處將 Token 加入 Redis 黑名單）
   *
   * @returns 登出成功訊息
   */
  @Post('/logout', { summary: '登出', middleware: ['authMiddleware'] })
  async logout(): Promise<{ message: string }> {
    // 目前為無狀態登出，客戶端清除 Token 即可
    // 未來可擴展：將 Token 加入 Redis 黑名單
    return { message: '登出成功' };
  }

  /**
   * 健康檢查接口
   *
   * GET /api/health
   *
   * @returns 服務狀態
   */
  @Get('/health', { summary: '健康檢查' })
  async health(): Promise<{ status: string; timestamp: number }> {
    return {
      status: 'ok',
      timestamp: Date.now(),
    };
  }
}
