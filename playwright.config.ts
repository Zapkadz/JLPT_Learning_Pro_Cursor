import { defineConfig,devices } from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'*.spec.ts',use:{baseURL:'http://127.0.0.1:5173'},projects:[{name:'desktop',use:{...devices['Desktop Chrome']}}]});
