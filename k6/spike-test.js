/**
 * K6 Spike Test - 突波測試
 *
 * 目的：測試系統在突然湧入大量流量時的表現
 * 場景：模擬促銷活動開始、新聞事件等造成的流量突波
 *
 * 執行方式：
 *   k6 run k6/spike-test.js
 *
 * 觀察重點：
 *   - 系統是否會崩潰
 *   - 錯誤率變化
 *   - 回應時間變化
 *   - 流量回歸後是否能恢復正常
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// 自訂指標
const errorRate = new Rate('errors');
const responseTimes = new Trend('response_times');

// 測試配置 - 突波模式
export const options = {
  stages: [
    // 正常狀態
    { duration: '30s', target: 10 },    // 正常流量 10 用戶

    // 第一波突波
    { duration: '10s', target: 200 },   // 10秒內暴增到 200 用戶 (20倍)
    { duration: '30s', target: 200 },   // 維持突波 30 秒
    { duration: '10s', target: 10 },    // 10秒內回落到 10 用戶

    // 恢復觀察
    { duration: '30s', target: 10 },    // 觀察系統是否恢復

    // 第二波更大突波
    { duration: '10s', target: 500 },   // 10秒內暴增到 500 用戶 (50倍)
    { duration: '30s', target: 500 },   // 維持突波 30 秒
    { duration: '10s', target: 10 },    // 回落

    // 最終恢復
    { duration: '1m', target: 10 },     // 觀察長期恢復狀態
    { duration: '10s', target: 0 },     // 結束
  ],

  // 效能門檻 (突波測試放寬標準)
  thresholds: {
    http_req_duration: ['p(90)<2000'],    // 90% 請求 < 2秒
    http_req_failed: ['rate<0.20'],       // 錯誤率 < 20% (突波時容許較高錯誤)
    errors: ['rate<0.20'],
  },
};

// API 端點
const BASE_URL = 'https://jsonplaceholder.typicode.com';

// 請求標頭
const headers = {
  'Content-Type': 'application/json',
};

/**
 * 模擬真實用戶行為
 */
export default function () {
  // 隨機選擇操作
  const actions = [
    // 瀏覽首頁 (取得 posts)
    () => {
      const res = http.get(`${BASE_URL}/posts`, { headers });
      responseTimes.add(res.timings.duration);
      return check(res, {
        '首頁載入成功': (r) => r.status === 200,
      });
    },

    // 查看文章詳情
    () => {
      const postId = Math.floor(Math.random() * 100) + 1;
      const res = http.get(`${BASE_URL}/posts/${postId}`, { headers });
      responseTimes.add(res.timings.duration);
      return check(res, {
        '文章載入成功': (r) => r.status === 200,
      });
    },

    // 查看文章評論
    () => {
      const postId = Math.floor(Math.random() * 100) + 1;
      const res = http.get(`${BASE_URL}/posts/${postId}/comments`, { headers });
      responseTimes.add(res.timings.duration);
      return check(res, {
        '評論載入成功': (r) => r.status === 200,
      });
    },

    // 查看用戶資料
    () => {
      const userId = Math.floor(Math.random() * 10) + 1;
      const res = http.get(`${BASE_URL}/users/${userId}`, { headers });
      responseTimes.add(res.timings.duration);
      return check(res, {
        '用戶資料載入成功': (r) => r.status === 200,
      });
    },

    // 發表評論 (POST)
    () => {
      const payload = JSON.stringify({
        postId: Math.floor(Math.random() * 100) + 1,
        name: 'Spike Test User',
        email: 'spike@test.com',
        body: `Comment during spike test at ${Date.now()}`,
      });
      const res = http.post(`${BASE_URL}/comments`, payload, { headers });
      responseTimes.add(res.timings.duration);
      return check(res, {
        '評論發表成功': (r) => r.status === 201,
      });
    },
  ];

  // 執行隨機操作
  const action = actions[Math.floor(Math.random() * actions.length)];
  const success = action();

  if (!success) {
    errorRate.add(1);
  }

  // 極短等待 (模擬突波時的密集請求)
  sleep(Math.random() * 0.3);
}

/**
 * 測試開始前
 */
export function setup() {
  console.log('=== Spike Test 開始 ===');
  console.log('');
  console.log('測試階段:');
  console.log('  [0:00-0:30]  正常流量: 10 VUs');
  console.log('  [0:30-0:40]  第一波突波: 10 → 200 VUs');
  console.log('  [0:40-1:10]  維持突波: 200 VUs');
  console.log('  [1:10-1:20]  回落: 200 → 10 VUs');
  console.log('  [1:20-1:50]  恢復觀察: 10 VUs');
  console.log('  [1:50-2:00]  第二波突波: 10 → 500 VUs');
  console.log('  [2:00-2:30]  維持突波: 500 VUs');
  console.log('  [2:30-2:40]  回落: 500 → 10 VUs');
  console.log('  [2:40-3:40]  最終恢復: 10 VUs');
  console.log('');

  // 驗證 API 可用
  const res = http.get(`${BASE_URL}/posts`);
  if (res.status !== 200) {
    throw new Error('API 不可用');
  }

  return { startTime: Date.now() };
}

/**
 * 測試結束後
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log('');
  console.log('=== Spike Test 結束 ===');
  console.log(`總執行時間: ${(duration / 60).toFixed(1)} 分鐘`);
  console.log('');
  console.log('分析建議:');
  console.log('  1. 觀察突波期間的錯誤率變化');
  console.log('  2. 檢查回應時間是否在突波後恢復');
  console.log('  3. 系統是否出現連鎖失敗 (cascading failures)');
  console.log('  4. 比較第一波 vs 第二波的系統表現');
}
