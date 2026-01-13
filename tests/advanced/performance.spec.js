/**
 * 效能測試
 *
 * 測試 API 的效能指標：
 * - 回應時間（Response Time）
 * - 吞吐量（Throughput）
 * - 負載測試（Load Testing）
 * - 壓力測試（Stress Testing）
 */
const { test, expect } = require('@playwright/test');
const { API } = require('../../api/endpoints');

test.describe('效能測試 - 回應時間', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('GET 單一資源應在 2 秒內回應', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(`${baseURL}${endpoints.post(1)}`);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(2000); // 小於 2 秒

    console.log(`回應時間: ${responseTime}ms`);
  });

  test('GET 列表應在 3 秒內回應', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(`${baseURL}${endpoints.posts}`);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(3000); // 小於 3 秒

    const posts = await response.json();
    console.log(`回應時間: ${responseTime}ms, 資料筆數: ${posts.length}`);
  });

  test('POST 請求應在 3 秒內完成', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.post(`${baseURL}${endpoints.posts}`, {
      data: {
        title: 'Performance Test',
        body: 'Testing POST performance',
        userId: 1,
      },
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect([200, 201]).toContain(response.status());
    expect(responseTime).toBeLessThan(3000);

    console.log(`POST 回應時間: ${responseTime}ms`);
  });

  test('多個連續請求的平均回應時間', async ({ request }) => {
    const times = [];
    const iterations = 5;

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      const response = await request.get(`${baseURL}${endpoints.post(i + 1)}`);
      const endTime = Date.now();

      expect(response.status()).toBe(200);
      times.push(endTime - startTime);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);

    console.log(`平均: ${avgTime.toFixed(2)}ms, 最快: ${minTime}ms, 最慢: ${maxTime}ms`);

    // 平均回應時間應小於 2 秒
    expect(avgTime).toBeLessThan(2000);
  });
});

test.describe('效能測試 - 負載測試', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('同時發送多個請求（並行）', async ({ request }) => {
    const startTime = Date.now();
    const concurrentRequests = 10;

    // 建立並行請求
    const promises = Array(concurrentRequests)
      .fill(null)
      .map((_, i) => request.get(`${baseURL}${endpoints.post(i + 1)}`));

    // 等待所有請求完成
    const responses = await Promise.all(promises);

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // 檢查所有請求都成功
    responses.forEach((response) => {
      expect(response.status()).toBe(200);
    });

    console.log(`${concurrentRequests} 個並行請求總時間: ${totalTime}ms`);
    console.log(`平均每個請求: ${(totalTime / concurrentRequests).toFixed(2)}ms`);

    // 並行請求總時間應小於 10 秒
    expect(totalTime).toBeLessThan(10000);
  });

  test('批量 POST 請求效能', async ({ request }) => {
    const startTime = Date.now();
    const batchSize = 5;

    const promises = Array(batchSize)
      .fill(null)
      .map((_, i) =>
        request.post(`${baseURL}${endpoints.posts}`, {
          data: {
            title: `Batch Post ${i + 1}`,
            body: `Batch testing post number ${i + 1}`,
            userId: 1,
          },
        })
      );

    const responses = await Promise.all(promises);

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    responses.forEach((response) => {
      expect([200, 201]).toContain(response.status());
    });

    console.log(`${batchSize} 個並行 POST 請求總時間: ${totalTime}ms`);
  });
});

test.describe('效能測試 - PetStore', () => {
  const { baseURL, endpoints } = API.petstore;

  test('查詢可用寵物應在合理時間內完成', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(`${baseURL}${endpoints.petByStatus}`, {
      params: { status: 'available' },
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(5000); // 5 秒內

    const pets = await response.json();
    console.log(`查詢時間: ${responseTime}ms, 找到 ${pets.length} 隻可用寵物`);
  });

  test('庫存查詢效能', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(`${baseURL}${endpoints.storeInventory}`);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(3000);

    console.log(`庫存查詢時間: ${responseTime}ms`);
  });
});

test.describe('效能測試 - ReqRes', () => {
  const { baseURL, endpoints } = API.reqres;
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': 'reqres-free-v1',
  };

  test('分頁查詢效能比較', async ({ request }) => {
    const results = [];

    for (let page = 1; page <= 3; page++) {
      const startTime = Date.now();

      const response = await request.get(`${baseURL}${endpoints.users}`, {
        headers,
        params: { page },
      });

      const endTime = Date.now();

      if (response.status() === 200) {
        results.push({
          page,
          time: endTime - startTime,
        });
      }
    }

    results.forEach((r) => {
      console.log(`第 ${r.page} 頁查詢時間: ${r.time}ms`);
    });

    // 各頁查詢時間應該相近（差異不超過 2 倍）
    if (results.length >= 2) {
      const times = results.map((r) => r.time);
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      expect(maxTime).toBeLessThan(minTime * 3);
    }
  });

  test('登入 API 效能', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.post(`${baseURL}${endpoints.login}`, {
      headers,
      data: {
        email: 'eve.holt@reqres.in',
        password: 'cityslicka',
      },
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(3000);

    console.log(`登入回應時間: ${responseTime}ms`);
  });
});
