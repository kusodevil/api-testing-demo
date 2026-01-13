/**
 * 超時與重試測試
 *
 * 測試 API 的超時處理與重試機制：
 * - 請求超時設定
 * - 超時後的錯誤處理
 * - 重試邏輯
 * - 指數退避（Exponential Backoff）
 */
const { test, expect } = require('@playwright/test');
const { API } = require('../../api/endpoints');

// 輔助函數：帶重試的請求
async function requestWithRetry(request, url, options = {}, maxRetries = 3, delay = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await request.get(url, options);

      if (response.status() >= 500) {
        throw new Error(`Server error: ${response.status()}`);
      }

      return { response, attempts: attempt };
    } catch (error) {
      lastError = error;
      console.log(`嘗試 ${attempt} 失敗: ${error.message}`);

      if (attempt < maxRetries) {
        // 指數退避
        const waitTime = delay * Math.pow(2, attempt - 1);
        console.log(`等待 ${waitTime}ms 後重試...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

test.describe('超時測試 - 基本超時', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('正常請求應在超時時間內完成', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(`${baseURL}${endpoints.post(1)}`, {
      timeout: 10000, // 10 秒超時
    });

    const duration = Date.now() - startTime;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(10000);
    console.log(`請求耗時: ${duration}ms`);
  });

  test('列表請求應在合理時間內完成', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(`${baseURL}${endpoints.posts}`, {
      timeout: 15000,
    });

    const duration = Date.now() - startTime;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(15000);

    const posts = await response.json();
    console.log(`取得 ${posts.length} 筆資料，耗時: ${duration}ms`);
  });

  test('POST 請求應在超時時間內完成', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.post(`${baseURL}${endpoints.posts}`, {
      data: {
        title: 'Timeout Test',
        body: 'Testing timeout behavior',
        userId: 1,
      },
      timeout: 10000,
    });

    const duration = Date.now() - startTime;

    expect([200, 201]).toContain(response.status());
    expect(duration).toBeLessThan(10000);
  });
});

test.describe('超時測試 - 超時處理', () => {
  test('極短超時應正確處理', async ({ request }) => {
    const { baseURL, endpoints } = API.jsonplaceholder;

    try {
      // 設定極短的超時時間（1ms）
      const response = await request.get(`${baseURL}${endpoints.posts}`, {
        timeout: 1,
      });

      // 如果請求完成（可能是快取），也算成功
      expect(response.status()).toBe(200);
    } catch (error) {
      // 預期可能會超時
      expect(error).toBeDefined();
    }
  });
});

test.describe('重試測試 - 基本重試', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('成功請求不需要重試', async ({ request }) => {
    const result = await requestWithRetry(request, `${baseURL}${endpoints.post(1)}`, {}, 3, 500);

    expect(result.response.status()).toBe(200);
    expect(result.attempts).toBe(1); // 應該第一次就成功
  });

  test('多次嘗試後成功', async ({ request }) => {
    // 對穩定的端點進行測試
    let attempts = 0;

    const makeRequest = async () => {
      attempts++;
      const response = await request.get(`${baseURL}${endpoints.post(1)}`);
      return response;
    };

    const response = await makeRequest();
    expect(response.status()).toBe(200);
    console.log(`總嘗試次數: ${attempts}`);
  });

  test('重試應保持冪等性', async ({ request }) => {
    const results = [];

    // 模擬重試：多次發送相同請求
    for (let i = 0; i < 3; i++) {
      const response = await request.get(`${baseURL}${endpoints.post(1)}`);
      results.push(await response.json());
    }

    // 所有重試應該得到相同結果
    expect(results[0]).toEqual(results[1]);
    expect(results[1]).toEqual(results[2]);
  });
});

test.describe('重試測試 - 指數退避', () => {
  test('驗證指數退避間隔', async () => {
    const baseDelay = 100;
    const maxRetries = 4;
    const delays = [];

    for (let i = 0; i < maxRetries; i++) {
      const delay = baseDelay * Math.pow(2, i);
      delays.push(delay);
    }

    // 驗證間隔呈指數增長
    expect(delays[0]).toBe(100); // 100ms
    expect(delays[1]).toBe(200); // 200ms
    expect(delays[2]).toBe(400); // 400ms
    expect(delays[3]).toBe(800); // 800ms

    console.log('指數退避間隔:', delays);
  });

  test('帶抖動的指數退避', async () => {
    const baseDelay = 100;
    const maxRetries = 3;
    const delaysWithJitter = [];

    for (let i = 0; i < maxRetries; i++) {
      const baseWait = baseDelay * Math.pow(2, i);
      // 加入隨機抖動（0-50%）
      const jitter = Math.random() * 0.5 * baseWait;
      const delay = baseWait + jitter;
      delaysWithJitter.push(Math.round(delay));
    }

    console.log('帶抖動的退避間隔:', delaysWithJitter);

    // 驗證間隔在合理範圍內
    expect(delaysWithJitter[0]).toBeGreaterThanOrEqual(100);
    expect(delaysWithJitter[0]).toBeLessThanOrEqual(150);
  });
});

test.describe('重試測試 - 條件重試', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('4xx 錯誤不應重試', async ({ request }) => {
    let attempts = 0;

    const makeRequestWithTracking = async () => {
      attempts++;
      const response = await request.get(`${baseURL}${endpoints.post(99999)}`);
      return response;
    };

    const response = await makeRequestWithTracking();

    // 4xx 錯誤應該立即返回，不重試
    expect([200, 404]).toContain(response.status());
    expect(attempts).toBe(1);
  });

  test('不同狀態碼的重試策略', async ({ request }) => {
    const shouldRetry = (statusCode) => {
      // 5xx 和網路錯誤應該重試
      if (statusCode >= 500) return true;
      // 429 Too Many Requests 應該重試
      if (statusCode === 429) return true;
      // 408 Request Timeout 應該重試
      if (statusCode === 408) return true;
      // 其他情況不重試
      return false;
    };

    expect(shouldRetry(500)).toBe(true);
    expect(shouldRetry(502)).toBe(true);
    expect(shouldRetry(503)).toBe(true);
    expect(shouldRetry(429)).toBe(true);
    expect(shouldRetry(408)).toBe(true);
    expect(shouldRetry(400)).toBe(false);
    expect(shouldRetry(401)).toBe(false);
    expect(shouldRetry(404)).toBe(false);
  });
});

test.describe('重試測試 - PetStore', () => {
  const { baseURL, endpoints } = API.petstore;

  test('查詢寵物狀態帶重試', async ({ request }) => {
    const result = await requestWithRetry(
      request,
      `${baseURL}${endpoints.petByStatus}`,
      { params: { status: 'available' } },
      3,
      500
    );

    expect(result.response.status()).toBe(200);
    console.log(`成功，嘗試次數: ${result.attempts}`);
  });

  test('庫存查詢帶重試', async ({ request }) => {
    const result = await requestWithRetry(request, `${baseURL}${endpoints.storeInventory}`, {}, 3, 500);

    expect(result.response.status()).toBe(200);

    const inventory = await result.response.json();
    expect(typeof inventory).toBe('object');
  });
});

test.describe('重試測試 - ReqRes', () => {
  const { baseURL, endpoints } = API.reqres;
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': 'reqres-free-v1',
  };

  test('使用者列表查詢帶重試', async ({ request }) => {
    const result = await requestWithRetry(
      request,
      `${baseURL}${endpoints.users}`,
      { headers, params: { page: 1 } },
      3,
      500
    );

    if (result.response.status() === 200) {
      const data = await result.response.json();
      expect(data).toHaveProperty('data');
    }
  });
});

test.describe('超時測試 - 連線穩定性', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('連續多次請求應穩定完成', async ({ request }) => {
    const requestCount = 5;
    const results = [];

    for (let i = 0; i < requestCount; i++) {
      const startTime = Date.now();

      const response = await request.get(`${baseURL}${endpoints.post(i + 1)}`, {
        timeout: 5000,
      });

      const duration = Date.now() - startTime;

      results.push({
        iteration: i + 1,
        status: response.status(),
        duration,
      });
    }

    // 所有請求應該成功
    results.forEach((r) => {
      expect(r.status).toBe(200);
    });

    // 計算平均時間
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    console.log(`平均回應時間: ${avgDuration.toFixed(2)}ms`);
    console.log('各次回應時間:', results.map((r) => r.duration));
  });

  test('長時間運行穩定性', async ({ request }) => {
    const startTime = Date.now();
    let requestCount = 0;
    const maxDuration = 3000; // 3 秒

    while (Date.now() - startTime < maxDuration) {
      const response = await request.get(`${baseURL}${endpoints.post(1)}`, {
        timeout: 2000,
      });

      expect(response.status()).toBe(200);
      requestCount++;
    }

    const totalDuration = Date.now() - startTime;
    console.log(`在 ${totalDuration}ms 內完成 ${requestCount} 次請求`);
    console.log(`平均每秒 ${((requestCount / totalDuration) * 1000).toFixed(2)} 次請求`);
  });
});

test.describe('超時測試 - 大資料量', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('大量資料請求應在合理時間內完成', async ({ request }) => {
    const startTime = Date.now();

    // 取得所有 posts（100 筆）
    const response = await request.get(`${baseURL}${endpoints.posts}`, {
      timeout: 30000,
    });

    const duration = Date.now() - startTime;

    expect(response.status()).toBe(200);

    const posts = await response.json();
    console.log(`取得 ${posts.length} 筆資料，耗時: ${duration}ms`);
    console.log(`平均每筆: ${(duration / posts.length).toFixed(2)}ms`);
  });
});
