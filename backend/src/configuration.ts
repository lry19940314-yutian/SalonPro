// ============================================================================
// 美業 SaaS 智慧管理系統 — Midway.js 應用配置
// ============================================================================
// 功能：註冊所有模塊、組件、中間件、過濾器
// ============================================================================

import { Configuration, App, Middleware } from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as typeorm from '@midwayjs/typeorm';
import * as validate from '@midwayjs/validate';
import * as jwt from '@midwayjs/jwt';
import { join } from 'path';
import { GlobalErrorFilter } from './filter/global-error.filter';
import { ResponseMiddleware } from './middleware/response.middleware';
import { AuthMiddleware } from './middleware/auth.middleware';

@Configuration({
  imports: [
    koa,
    typeorm,       // TypeORM + MySQL
    validate,      // 參數校驗
    jwt,           // JWT 組件
  ],
  importConfigs: [
    join(__dirname, './config'),
  ],
})
export class ContainerConfiguration {
  @App()
  app: koa.Application;

  async onReady(): Promise<void> {
    // ========== 註冊全局中間件 ==========
    // 注意順序：響應格式中間件在最外層，認證中間件在內層
    this.app.useMiddleware([
      ResponseMiddleware,   // 統一響應格式
      AuthMiddleware,       // JWT 認證（會忽略公開路由）
    ]);

    // ========== 註冊全局過濾器 ==========
    this.app.useFilter([
      GlobalErrorFilter,    // 全局異常處理
    ]);

    console.info('[App] 美業 SaaS 智慧管理系統啟動完成');
    console.info('[App] 環境:', process.env.NODE_ENV || 'development');
    console.info('[App] 端口:', process.env.APP_PORT || 7001);
  }

  async onStop(): Promise<void> {
    console.info('[App] 美業 SaaS 智慧管理系統已停止');
  }
}
