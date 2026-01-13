/**
 * K6 Stress Test - 壓力測試
 *
 * 目的：找出系統的極限和瓶頸點
 * 場景：持續增加負載直到系統開始出現錯誤或效能下降
 *
 * 執行方式：
 *   k6 run k6/stress-test.js
 *
 * 注意：此測試會對目標 API 產生較大壓力，請確認有權限執行
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// 自訂指標
const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration');
const requestCount = new Counter('request_count');

// 測試配置 - 壓力測試階段
export const options = {
  stages: [
    // 暖機階段
    { duration: '1m', target: 50 },     // 1分鐘爬升到 50 用戶

    // 正常負載
    { duration: '2m', target: 50 },     // 維持 50 用戶

    // 開始施壓
    { duration: '1m', target: 100 },    // 增加到 100 用戶
    { duration: '2m', target: 100 },    // 維持 100 用戶

    // 高壓階段
    { duration: '1m', target: 200 },    // 增加到 200 用戶
    { duration: '2m', target: 200 },    // 維持 200 用戶

    // 極限測試
    { duration: '1m', target: 300 },    // 增加到 300 用戶
    { duration: '2m', target: 300 },    // 維持 300 用戶

    // 恢復階段
    { duration: '2m', target: 0 },      // 逐步降載
  ],

  // 效能門檻
  thresholds: {
    http_req_duration: ['p(95)<1000'],    // 95% 請求 < 1秒 (壓測時放寬標準)
    http_req_failed: ['rate<0.10'],       // 錯誤率 < 10%
    errors: ['rate<0.10'],
  },
};

// API 端點
const BASE_URL = 'https://jsonplaceholder.typicode.com';

// 請求標頭
const headers = {
  'Content-Type': 'application/json',
};

/**
 * 測試場景
 */
export default function () {
  // 混合不同類型的請求來模擬真實流量

  // 60% GET 請求 (讀取)
  if (Math.random() < 0.6) {
    const endpoints = [
      '/posts',
      '/users',
      '/comments',
      `/posts/${Math.floor(Math.random() * 100) + 1}`,
      `/users/${Math.floor(Math.random() * 10) + 1}`,
    ];
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

    const res = http.get(`${BASE_URL}${endpoint}`, { headers });
    requestDuration.add(res.timings.duration);
    requestCount.add(1);

    const success = check(res, {
      'GET 狀態碼 200': (r) => r.status === 200,
      'GET 回應時間 < 1s': (r) => r.timings.duration < 1000,
    });

    if (!success) errorRate.add(1);
  }
  // 30% POST 請求 (建立)
  else if (Math.random() < 0.9) {
    const payload = JSON.stringify({
      title: `Stress Test ${Date.now()}`,
      body: 'Stress testing the API',
      userId: Math.floor(Math.random() * 10) + 1,
    });

    const res = http.post(`${BASE_URL}/posts`, payload, { headers });
    requestDuration.add(res.timings.duration);
    requestCount.add(1);

    const success = check(res, {
      'POST 狀態碼 201': (r) => r.status === 201,
      'POST 回應時間 < 1s': (r) => r.timings.duration < 1000,
    });

    if (!success) errorRate.add(1);
  }
  // 10% PUT 請求 (更新)
  else {
    const postId = Math.floor(Math.random() * 100) + 1;
    const payload = JSON.stringify({
      id: postId,
      title: `Updated ${Date.now()}`,
      body: 'Updated during stress test',
      userId: 1,
    });

    const res = http.put(`${BASE_URL}/posts/${postId}`, payload, { headers });
    requestDuration.add(res.timings.duration);
    requestCount.add(1);

    const success = check(res, {
      'PUT 狀態碼 200': (r) => r.status === 200,
      'PUT 回應時間 < 1s': (r) => r.timings.duration < 1000,
    });

    if (!success) errorRate.add(1);
  }

  // 短暫等待
  sleep(Math.random() * 0.5);
}

/**
 * 測試開始前
 */
export function setup() {
  console.log('=== Stress Test 開始 ===');
  console.log('階段說明:');
  console.log('  1. 暖機: 0 → 50 VUs');
  console.log('  2. 正常: 維持 50 VUs');
  console.log('  3. 施壓: 50 → 100 → 200 → 300 VUs');
  console.log('  4. 恢復: 300 → 0 VUs');
  console.log('');

  return { startTime: Date.now() };
}

/**
 * 測試結束後
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log('');
  console.log('=== Stress Test 結束 ===');
  console.log(`總執行時間: ${(duration / 60).toFixed(1)} 分鐘`);
  console.log('');
  console.log('分析建議:');
  console.log('  - 檢查錯誤率開始上升的 VU 數量');
  console.log('  - 觀察回應時間在哪個階段開始惡化');
  console.log('  - 該點即為系統瓶頸');
}
