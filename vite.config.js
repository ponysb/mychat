// vite.config.js
import { defineConfig } from 'vite';
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3000', // 将 API 请求代理到 Koa2 后端
    },
  },
});