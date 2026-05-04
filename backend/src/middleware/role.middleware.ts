// ============================================================================
// 美業 SaaS 智慧管理系統 — 角色權限中間件
// ============================================================================
// 功能：基於角色的訪問控制，限制特定路由僅允許特定角色訪問
// ============================================================================

import { Middleware, IMiddleware } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import { ForbiddenError } from '../filter/exception';

/**
 * 角色權限中間件工廠
 *
 * 根據傳入的角色列表，限制僅允許指定角色的使用者訪問
 *
 * @example
 * ```typescript
 * // 在 Controller 中使用
 * @Middleware(['authMiddleware', roleMiddleware(['manager'])])
 * async adminOnly() { ... }
 *
 * // 或
 * @Middleware(['authMiddleware', roleMiddleware(['manager', 'beautician'])])
 * async allStaff() { ... }
 * ```
 *
 * @param allowedRoles - 允許訪問的角色代碼陣列
 * @returns 中間件實例
 */
export function roleMiddleware(allowedRoles: string[]): Function {
  @Middleware()
  class RoleCheckMiddleware implements IMiddleware<Context, NextFunction> {
    resolve() {
      return async (ctx: Context, next: NextFunction) => {
        const roleCode: string = ctx.state.roleCode;

        if (!roleCode) {
          throw new ForbiddenError('無法識別使用者角色');
        }

        if (!allowedRoles.includes(roleCode)) {
          throw new ForbiddenError('權限不足，無法執行此操作');
        }

        await next();
      };
    }
  }

  return RoleCheckMiddleware;
}

/**
 * 店長權限中間件（僅 manager 角色可訪問）
 */
export const managerOnly = (): Function => roleMiddleware(['manager']);

/**
 * 美容師權限中間件（僅 beautician 角色可訪問）
 */
export const beauticianOnly = (): Function => roleMiddleware(['beautician']);

/**
 * 所有員工權限中間件（manager 和 beautician 均可訪問）
 */
export const allStaff = (): Function => roleMiddleware(['manager', 'beautician']);
