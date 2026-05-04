// ============================================================================
// 美業 SaaS 智慧管理系統 — 統一響應格式中間件
// ============================================================================
// 功能：將 Controller 返回的數據包裝為統一格式
// ============================================================================

import { Middleware, IMiddleware } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';

/**
 * 統一響應格式中間件
 *
 * 包裝所有成功響應為標準格式：
 * ```json
 * {
 *   "code": 200,
 *   "message": "success",
 *   "data": { ... },
 *   "timestamp": 1714800000000
 * }
 * ```
 *
 * 使用方式：Controller 中直接 return 數據即可，
 * 中間件會自動包裝。若需自定義 message，可在 ctx 上設置 ctx.successMessage。
 */
@Middleware()
export class ResponseMiddleware implements IMiddleware<Context, NextFunction> {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const startTime = Date.now();

      try {
        // 執行後續中間件 / Controller
        await next();

        // 僅處理正常響應（尚未被錯誤過濾器處理的）
        if (ctx.body !== undefined && ctx.status < 400) {
          const data = ctx.body;

          // 如果已經是統一格式則不重複包裝
          if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
            return;
          }

          ctx.body = {
            code: 200,
            message: ctx.state.successMessage || 'success',
            data,
            timestamp: Date.now(),
          };
        }
      } catch (err) {
        // 錯誤由 GlobalErrorFilter 處理，此處重新拋出
        throw err;
      } finally {
        // 記錄請求耗時
        const duration = Date.now() - startTime;
        if (duration > 1000) {
          ctx.logger.warn(`[SlowRequest] ${ctx.method} ${ctx.url} - ${duration}ms`);
        }
      }
    };
  }

  /**
   * 中間件優先級：數字越小越先執行
   * 響應格式中間件應在較外層執行
   */
  static match(ctx: Context): boolean {
    // 排除靜態資源路徑
    return !ctx.path.startsWith('/static/') && !ctx.path.startsWith('/public/');
  }
}
