// ============================================================================
// 美業 SaaS 智慧管理系統 — 全局異常過濾器
// ============================================================================
// 功能：統一攔截所有異常，返回標準格式的錯誤響應
// ============================================================================

import { Catch, httpError, MidwayHttpError } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { BusinessError } from './exception';

/**
 * 全局異常過濾器
 *
 * 捕獲所有未處理異常，統一返回格式：
 * ```json
 * {
 *   "code": 10002,
 *   "message": "請先登錄",
 *   "data": null,
 *   "timestamp": 1714800000000
 * }
 * ```
 */
@Catch()
export class GlobalErrorFilter {
  async catch(err: Error, ctx: Context): Promise<void> {
    // 記錄錯誤日誌
    ctx.logger.error('[GlobalError]', err);

    // 預設為伺服器內部錯誤
    let statusCode = 500;
    let code = 99999;
    let message = '伺服器內部錯誤，請稍後再試';
    let detail: string | undefined;

    // ========== 處理自定義業務異常 ==========
    if (err instanceof BusinessError) {
      statusCode = err.statusCode;
      code = err.code;
      message = err.message;
    }
    // ========== 處理 Midway 內建異常 ==========
    else if (err instanceof MidwayHttpError) {
      statusCode = err.status ?? 500;
      code = statusCode === 401 ? 10002
        : statusCode === 403 ? 10004
        : statusCode === 404 ? 10005
        : 99999;
      message = err.message;
    }
    // ========== 處理參數校驗異常 ==========
    else if (err.name === 'ValidationError') {
      statusCode = 422;
      code = 10001;
      message = err.message || '請求參數不合法';
    }
    // ========== 處理 JSON 解析異常 ==========
    else if (err instanceof SyntaxError && 'body' in err) {
      statusCode = 400;
      code = 10001;
      message = '請求數據格式錯誤';
    }

    // 開發環境下返回詳細錯誤信息
    if (process.env.NODE_ENV === 'development') {
      detail = err.message + '\n' + (err.stack || '');
    }

    // 設置 HTTP 狀態碼
    ctx.status = statusCode;

    // 返回統一格式
    ctx.body = {
      code,
      message,
      data: null,
      detail,
      timestamp: Date.now(),
    };
  }
}
