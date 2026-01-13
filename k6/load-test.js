/**
 * K6 Load Test - 負載測試
 *
 * 目的：測試系統在正常預期負載下的表現
 * 場景：模擬正常流量，逐步增加用戶數，維持一段時間後降載
 *
 * 執行方式：
 *   k6 run k6/load-test.js
 *   k6 run --vus 50 --duration 1m k6/load-test.js  # 自訂參數
 *
 * 報告輸出：
 *   k6 run --out json=results.json k6/load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// 自訂指標
const errorRate = new Rate('errors');
const postsDuration = new Trend('posts_duration');
const usersDuration = new Trend('users_duration');

// 測試配置
export const options = {
  // 負載階段設定
  stages: [
    { duration: '30s', target: 10 },   // 30秒內爬升到 10 虛擬用戶
    { duration: '1m', target: 10 },    // 維持 10 用戶 1 分鐘
    { duration: '30s', target: 50 },   // 30秒內爬升到 50 用戶
    { duration: '2m', target: 50 },    // 維持 50 用戶 2 分鐘
    { duration: '30s', target: 0 },    // 30秒內降載到 0
  ],

  // 效能門檻 - 不通過則測試失敗
  thresholds: {
    http_req_duration: ['p(95)<500'],     // 95% 請求 < 500ms
    http_req_failed: ['rate<0.05'],       // 錯誤率 < 5%
    errors: ['rate<0.05'],                // 自訂錯誤率 < 5%
    posts_duration: ['p(95)<400'],        // Posts API 95% < 400ms
    users_duration: ['p(95)<400'],        // Users API 95% < 400ms
  },
};

// API 端點
const BASE_URL = 'https://jsonplaceholder.typicode.com';
const endpoints = {
  posts: `${BASE_URL}/posts`,
  users: `${BASE_URL}/users`,
  comments: `${BASE_URL}/comments`,
};

// 請求標頭
const headers = {
  'Content-Type': 'application/json',
};

/**
 * 主測試函數 - 每個虛擬用戶會重複執行
 */
export default function () {
  // 場景 1: 取得 Posts 列表
  const postsRes = http.get(endpoints.posts, { headers });
  postsDuration.add(postsRes.timings.duration);

  check(postsRes, {
    'Posts: 狀態碼 200': (r) => r.status === 200,
    'Posts: 回應時間 < 500ms': (r) => r.timings.duration < 500,
    'Posts: 回傳陣列': (r) => JSON.parse(r.body).length > 0,
  }) || errorRate.add(1);

  sleep(1); // 模擬用戶思考時間

  // 場景 2: 取得 Users 列表
  const usersRes = http.get(endpoints.users, { headers });
  usersDuration.add(usersRes.timings.duration);

  check(usersRes, {
    'Users: 狀態碼 200': (r) => r.status === 200,
    'Users: 回應時間 < 500ms': (r) => r.timings.duration < 500,
    'Users: 回傳 10 個用戶': (r) => JSON.parse(r.body).length === 10,
  }) || errorRate.add(1);

  sleep(1);

  // 場景 3: 取得單一 Post
  const postId = Math.floor(Math.random() * 100) + 1;
  const postRes = http.get(`${endpoints.posts}/${postId}`, { headers });

  check(postRes, {
    'Post: 狀態碼 200': (r) => r.status === 200,
    'Post: 有 title 欄位': (r) => JSON.parse(r.body).title !== undefined,
  }) || errorRate.add(1);

  sleep(1);

  // 場景 4: 建立 Post (POST 請求)
  const newPost = JSON.stringify({
    title: `Load Test Post ${Date.now()}`,
    body: 'This is a load test post',
    userId: 1,
  });

  const createRes = http.post(endpoints.posts, newPost, { headers });

  check(createRes, {
    'Create: 狀態碼 201': (r) => r.status === 201,
    'Create: 回傳新 Post': (r) => JSON.parse(r.body).id !== undefined,
  }) || errorRate.add(1);

  sleep(1);

  // 場景 5: 取得 Comments
  const commentsRes = http.get(`${endpoints.comments}?postId=${postId}`, { headers });

  check(commentsRes, {
    'Comments: 狀態碼 200': (r) => r.status === 200,
    'Comments: 回傳陣列': (r) => Array.isArray(JSON.parse(r.body)),
  }) || errorRate.add(1);

  sleep(Math.random() * 2); // 隨機等待 0-2 秒
}

/**
 * 測試開始前執行
 */
export function setup() {
  console.log('=== Load Test 開始 ===');
  console.log(`目標 API: ${BASE_URL}`);

  // 驗證 API 可用
  const res = http.get(endpoints.posts);
  if (res.status !== 200) {
    throw new Error(`API 不可用: ${res.status}`);
  }

  return { startTime: Date.now() };
}

/**
 * 測試結束後執行
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`=== Load Test 結束 ===`);
  console.log(`總執行時間: ${duration.toFixed(1)} 秒`);
}
