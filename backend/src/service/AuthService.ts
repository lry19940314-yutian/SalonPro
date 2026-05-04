// ============================================================================
// 美業 SaaS 智慧管理系統 — 認證服務
// ============================================================================
// 功能：登入驗證、JWT Token 生成/刷新/驗證、密碼加密比對
// ============================================================================

import { Provide, App, Inject } from '@midwayjs/core';
import { Application } from '@midwayjs/koa';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { ShopDAO } from '../dao/ShopDAO';
import { StaffDAO } from '../dao/StaffDAO';
import { RoleDAO } from '../dao/RoleDAO';
import {
  LoginParams,
  LoginResult,
  RefreshTokenResult,
  JwtPayload,
} from '../interface';
import {
  InvalidCredentialsError,
  AccountDisabledError,
  ShopDisabledError,
  UnauthorizedError,
  TokenExpiredError,
} from '../filter/exception';

/** Bcrypt 加密輪數 */
const BCRYPT_SALT_ROUNDS = 10;

@Provide()
export class AuthService {
  @App()
  app: Application;

  @Inject()
  shopDAO: ShopDAO;

  @Inject()
  staffDAO: StaffDAO;

  /**
   * 登入驗證
   *
   * 流程：
   * 1. 根據客戶代碼查詢門店
   * 2. 驗證門店狀態
   * 3. 根據帳號查詢員工
   * 4. 驗證員工狀態
   * 5. 比對密碼
   * 6. 生成 JWT Token
   * 7. 更新最後登錄時間
   *
   * @param params - 登入參數（客戶代碼、帳號、密碼）
   * @returns 登入結果（Token + 使用者資訊）
   */
  async login(params: LoginParams): Promise<LoginResult> {
    const { shopCode, username, password } = params;

    // 1. 查詢門店
    const shop = await this.shopDAO.findByCode(shopCode);
    if (!shop) {
      throw new InvalidCredentialsError();
    }

    // 2. 驗證門店狀態
    if (shop.status !== 1) {
      throw new ShopDisabledError();
    }

    // 3. 查詢員工（含門店和角色關聯）
    const staff = await this.staffDAO.findByUsername(username);
    if (!staff || staff.shopId !== shop.id) {
      throw new InvalidCredentialsError();
    }

    // 4. 驗證員工狀態
    if (staff.status !== 1) {
      throw new AccountDisabledError();
    }

    // 5. 比對密碼
    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // 6. 生成 JWT Token
    const roleCode = staff.role?.code || '';
    const { accessToken, refreshToken, expiresIn } = this.generateTokens({
      staffId: staff.id,
      shopId: shop.id,
      shopCode: shop.code,
      roleCode,
    });

    // 7. 更新最後登錄時間
    await this.staffDAO.updateLastLogin(staff.id);

    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        id: staff.id,
        name: staff.name,
        role: roleCode,
        shopId: shop.id,
        shopCode: shop.code,
        shopName: shop.name,
        avatar: staff.avatar || '',
        phone: staff.phone || undefined,
        title: staff.title || undefined,
      },
    };
  }

  /**
   * 刷新 Token
   *
   * 驗證 Refresh Token 有效性，生成新的 Token 對
   *
   * @param refreshTokenStr - Refresh Token 字串
   * @returns 新的 Token 對
   */
  async refreshToken(refreshTokenStr: string): Promise<RefreshTokenResult> {
    const jwtSecret = process.env.JWT_SECRET || 'salon-pro-jwt-secret-key-2026';

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(refreshTokenStr, jwtSecret) as JwtPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError('Refresh Token 已過期，請重新登錄');
      }
      throw new UnauthorizedError('無效的 Refresh Token');
    }

    // 驗證是否為 Refresh Token
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('無效的 Token 類型');
    }

    // 生成新的 Token 對
    const { accessToken, refreshToken, expiresIn } = this.generateTokens({
      staffId: decoded.staffId,
      shopId: decoded.shopId,
      shopCode: decoded.shopCode,
      roleCode: decoded.roleCode,
    });

    return { accessToken, refreshToken, expiresIn };
  }

  /**
   * 驗證 Access Token
   *
   * @param token - Access Token 字串
   * @returns 解碼後的 JWT Payload
   * @throws UnauthorizedError - Token 無效或過期
   */
  verifyAccessToken(token: string): JwtPayload {
    const jwtSecret = process.env.JWT_SECRET || 'salon-pro-jwt-secret-key-2026';

    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

      if (decoded.type !== 'access') {
        throw new UnauthorizedError('無效的 Token 類型');
      }

      return decoded;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError();
      }
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      throw new UnauthorizedError('無效的 Access Token');
    }
  }

  /**
   * 生成 JWT Token 對（Access Token + Refresh Token）
   *
   * @param payload - Token 承載數據
   * @returns 包含 accessToken、refreshToken、expiresIn 的物件
   */
  private generateTokens(payload: {
    staffId: number;
    shopId: number;
    shopCode: string;
    roleCode: string;
  }): { accessToken: string; refreshToken: string; expiresIn: number } {
    const jwtSecret = process.env.JWT_SECRET || 'salon-pro-jwt-secret-key-2026';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    // 計算過期時間戳（秒）
    const expiresInSeconds = this.parseExpiresIn(expiresIn);
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

    // Access Token（短有效期）
    const accessToken = jwt.sign(
      {
        staffId: payload.staffId,
        shopId: payload.shopId,
        shopCode: payload.shopCode,
        roleCode: payload.roleCode,
        type: 'access',
      } as JwtPayload,
      jwtSecret,
      { expiresIn: expiresInSeconds }
    );

    // Refresh Token（長有效期，為 Access Token 的 2 倍）
    const refreshExpiresIn = expiresInSeconds * 2;
    const refreshToken = jwt.sign(
      {
        staffId: payload.staffId,
        shopId: payload.shopId,
        shopCode: payload.shopCode,
        roleCode: payload.roleCode,
        type: 'refresh',
      } as JwtPayload,
      jwtSecret,
      { expiresIn: refreshExpiresIn }
    );

    return { accessToken, refreshToken, expiresIn: expiresAt };
  }

  /**
   * 解析過期時間字串為秒數
   *
   * 支援格式：'7d'（天）、'12h'（小時）、'30m'（分鐘）、'3600'（秒）
   *
   * @param expiresIn - 過期時間字串
   * @returns 秒數
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([dhms])?$/);
    if (!match) {
      return 7 * 24 * 3600; // 預設 7 天
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'd': return value * 24 * 3600;
      case 'h': return value * 3600;
      case 'm': return value * 60;
      case 's': return value;
      default: return value; // 純數字視為秒
    }
  }

  /**
   * 加密密碼（用於創建員工時）
   *
   * @param password - 明文密碼
   * @returns bcrypt 加密後的密碼
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  /**
   * 比對密碼
   *
   * @param password - 明文密碼
   * @param hash - bcrypt 加密後的密碼
   * @returns 是否匹配
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
