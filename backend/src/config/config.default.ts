// ============================================================================
// 美業 SaaS 智慧管理系統 — 默認應用配置
// ============================================================================
// 功能：應用層級配置（端口、數據庫、JWT 等）
// ============================================================================

import { MidwayConfig } from '@midwayjs/core';
import { join } from 'path';

export default (): MidwayConfig => {
  return {
    // ========== Koa 應用配置 ==========
    koa: {
      port: parseInt(process.env.APP_PORT || '7001', 10),
      globalPrefix: '/api', // 全局路由前綴
    },

    // ========== TypeORM 配置 ==========
    typeorm: {
      dataSource: {
        default: {
          type: 'mysql',
          host: process.env.MYSQL_HOST || '127.0.0.1',
          port: parseInt(process.env.MYSQL_PORT || '3306', 10),
          username: process.env.MYSQL_USER || 'root',
          password: process.env.MYSQL_PASSWORD || 'root',
          database: process.env.MYSQL_DATABASE || 'salon_pro',
          charset: 'utf8mb4',
          synchronize: false, // 生產環境禁用自動同步
          logging: process.env.NODE_ENV === 'development',
          // Entity 自動加載路徑
          entities: [join(__dirname, '../entity/**/*.{ts,js}')],
          // 連接池配置
          extra: {
            connectionLimit: 10,
            waitForConnections: true,
            queueLimit: 0,
          },
          // 時區配置
          timezone: '+08:00',
          // 支援大字段
          supportBigNumbers: true,
          bigNumberStrings: false,
        },
      },
    },

    // ========== JWT 配置 ==========
    jwt: {
      secret: process.env.JWT_SECRET || 'salon-pro-jwt-secret-key-2026',
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as unknown as number,
    },

    // ========== 日誌配置 ==========
    logger: {
      dir: process.env.LOG_DIR || './logs',
      level: process.env.LOG_LEVEL || 'info',
      consoleLevel: 'info',
      allowDebugAtProd: false,
      disableConsole: false,
      disableFile: false,
    },
  };
};
