// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * API 測試設定檔
 *
 * 測試對象：
 * - JSONPlaceholder: https://jsonplaceholder.typicode.com
 * - ReqRes: https://reqres.in
 * - PetStore: https://petstore.swagger.io
 */
module.exports = defineConfig({
  // 測試檔案位置
  testDir: './tests',

  // 每個測試的最長執行時間
  timeout: 30 * 1000,

  // 斷言的最長等待時間
  expect: {
    timeout: 5000,
  },

  // 測試失敗時是否重試
  retries: process.env.CI ? 2 : 0,

  // 平行執行的 worker 數量
  workers: process.env.CI ? 1 : undefined,

  // 報告格式
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['allure-playwright'],
  ],

  // API 測試不需要瀏覽器，使用空的 projects
  projects: [
    {
      name: 'api',
      use: {},
    },
  ],
});
