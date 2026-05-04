// ============================================================================
// 美業 SaaS 智慧管理系統 — JWT 認證中間件
// ============================================================================
// 功能：驗證請求中的 JWT Token，解析使用者資訊並掛載到 ctx.state
// ============================================================================

import { Middleware, IMiddleware } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import { AuthService } from '../service/AuthService';
import { UnauthorizedError } from '../filter/exception';
import { RequestContext } from '../interface';

/**
 * JWT 認證中間件
 *
 * 功能：
 * 1. 從 Authorization Header 提取 Bearer Token
 * 2. 驗證 Token 有效性
 * 3. 將使用者資訊掛載到 ctx.state 供後續使用
 *
 * 使用方式：
 * - 在需要登入驗證的路由或 Controller 上使用 @Middleware(['authMiddleware'])
 * - 或全局註冊後在路由 meta 中排除公開路由
 *
 * ctx.state 中掛載的屬性：
 * - staffId: 員工 ID
 * - shopId: 門店 ID
 * - shopCode: 門店代碼
 * - roleCode: 角色代碼
 * - roleId: 角色 ID
 * - staffName: 員工姓名
 */
@Middleware()
export class AuthMiddleware implements IMiddleware<Context, NextFunction> {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      // 從 Header 中提取 Token
      const authHeader = ctx.headers.authorization;

      if (!authHeader) {
        throw new UnauthorizedError('請提供認證 Token');
      }

      // 驗證格式：Bearer <token>
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new UnauthorizedError('認證 Header 格式錯誤，請使用 Bearer <token>');
      }

      const token = parts[1];

      // 驗證 Token
      const authService = await ctx.requestContext.getAsync(AuthService);
      const payload = authService.verifyAccessToken(token);

      // 將使用者資訊掛載到 ctx.state
      const requestContext: RequestContext = {
        staffId: payload.staffId,
        shopId: payload.shopId,
        shopCode: payload.shopCode,
        roleCode: payload.roleCode,
        roleId: 0, // 由後續中間件或 Service 填充
        staffName: '', // 由後續中間件或 Service 填充
      };

      ctx.state = {
        ...ctx.state,
        ...requestContext,
      };

      await next();
    };
  }

  /**
   * 中間件忽略的路徑（公開路由）
   */
  static ignore(ctx: Context): boolean {
    const publicPaths = [
      '/api/auth/login',
      '/api/auth/refresh',
      '/api/health',
      '/swagger-ui',
    ];

    return publicPaths.some((path) => ctx.path.startsWith(path));
  }
}
