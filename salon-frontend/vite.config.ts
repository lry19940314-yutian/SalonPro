/**
 * vite.config.ts - Vite 構建配置
 *
 * 技術棧：Vite 5 + Vue 3 + TypeScript
 * 功能：
 * 1. Vue 插件支援
 * 2. 路徑別名 @/ → src/
 * 3. 開發伺服器配置
 * 4. 建構優化配置
 */

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // Vue 插件
  plugins: [vue()],

  // 路徑解析別名
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  // 開發伺服器配置
  server: {
    port: 3000,
    host: true, // 允許區域網路訪問
    open: true, // 自動開啟瀏覽器

    // API 代理（開發環境）
    proxy: {
      '/api': {
        target: 'http://localhost:7001', // Midway.js 預設埠
        changeOrigin: true,
      },
    },
  },

  // 建構配置
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',

    // 使用 esbuild 壓縮（Vite 內建，無需額外安裝）
    minify: 'esbuild',

    // 程式碼分割
    rollupOptions: {
      output: {
        // 手動分割第三方套件
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-ui': ['element-plus', 'vant'],
          'vendor-echarts': ['echarts', 'vue-echarts'],
        },
      },
    },
  },
})
