/**
 * HTTP Headers 測試
 *
 * 測試 API 的 HTTP Headers 處理：
 * - Content-Type 驗證
 * - Accept Headers
 * - Cache-Control
 * - CORS Headers
 * - 自訂 Headers
 * - 回應 Headers 驗證
 */
const { test, expect } = require('@playwright/test');
const { API } = require('../../api/endpoints');

test.describe('HTTP Headers - Content-Type', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('回應應包含 Content-Type header', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`);

    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toBeDefined();
    expect(contentType).toContain('application/json');
  });

  test('POST 請求應正確處理 JSON Content-Type', async ({ request }) => {
    const response = await request.post(`${baseURL}${endpoints.posts}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        title: 'Content-Type Test',
        body: 'Testing JSON content type',
        userId: 1,
      },
    });

    expect([200, 201]).toContain(response.status());

    const responseContentType = response.headers()['content-type'];
    expect(responseContentType).toContain('application/json');
  });

  test('charset 應為 utf-8', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`);

    const contentType = response.headers()['content-type'];
    // 有些 API 會在 content-type 中包含 charset
    if (contentType.includes('charset')) {
      expect(contentType.toLowerCase()).toContain('utf-8');
    }
  });
});

test.describe('HTTP Headers - Accept', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('Accept: application/json 應回傳 JSON', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('json');
  });

  test('Accept: */* 應能處理', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`, {
      headers: {
        Accept: '*/*',
      },
    });

    expect(response.status()).toBe(200);
  });

  test('Accept: text/html 的處理', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`, {
      headers: {
        Accept: 'text/html',
      },
    });

    // API 可能仍回傳 JSON 或回傳 406 Not Acceptable
    expect([200, 406]).toContain(response.status());
  });
});

test.describe('HTTP Headers - Cache-Control', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('檢查回應的 Cache-Control header', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`);

    expect(response.status()).toBe(200);

    const cacheControl = response.headers()['cache-control'];
    console.log('Cache-Control:', cacheControl || '未設定');

    // 記錄是否有快取設定
    if (cacheControl) {
      expect(typeof cacheControl).toBe('string');
    }
  });

  test('帶 no-cache header 的請求', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    expect(response.status()).toBe(200);
  });

  test('ETag header 檢查', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`);

    const etag = response.headers()['etag'];
    console.log('ETag:', etag || '未設定');

    // ETag 可選，但如果存在應該是字串
    if (etag) {
      expect(typeof etag).toBe('string');
    }
  });
});

test.describe('HTTP Headers - CORS', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('檢查 Access-Control-Allow-Origin', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`);

    const corsHeader = response.headers()['access-control-allow-origin'];
    console.log('Access-Control-Allow-Origin:', corsHeader || '未設定');

    // 公開 API 通常會設定 CORS
    if (corsHeader) {
      expect(['*', 'https://jsonplaceholder.typicode.com']).toContain(corsHeader);
    }
  });

  test('OPTIONS 預檢請求', async ({ request }) => {
    const response = await request.fetch(`${baseURL}${endpoints.posts}`, {
      method: 'OPTIONS',
    });

    // OPTIONS 通常回傳 200 或 204
    expect([200, 204, 404]).toContain(response.status());

    if (response.status() !== 404) {
      const allowMethods = response.headers()['access-control-allow-methods'];
      console.log('Allowed Methods:', allowMethods || '未設定');
    }
  });

  test('檢查 Access-Control-Allow-Headers', async ({ request }) => {
    const response = await request.fetch(`${baseURL}${endpoints.posts}`, {
      method: 'OPTIONS',
    });

    if (response.status() !== 404) {
      const allowHeaders = response.headers()['access-control-allow-headers'];
      console.log('Allowed Headers:', allowHeaders || '未設定');
    }
  });
});

test.describe('HTTP Headers - 自訂 Headers', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('自訂 X-Request-ID header', async ({ request }) => {
    const requestId = `req-${Date.now()}`;

    const response = await request.get(`${baseURL}${endpoints.post(1)}`, {
      headers: {
        'X-Request-ID': requestId,
      },
    });

    expect(response.status()).toBe(200);
  });

  test('自訂 User-Agent header', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`, {
      headers: {
        'User-Agent': 'API-Testing-Demo/1.0',
      },
    });

    expect(response.status()).toBe(200);
  });

  test('多個自訂 headers', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`, {
      headers: {
        'X-Custom-Header-1': 'value1',
        'X-Custom-Header-2': 'value2',
        'X-Trace-ID': `trace-${Date.now()}`,
      },
    });

    expect(response.status()).toBe(200);
  });
});

test.describe('HTTP Headers - 回應 Headers 驗證', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('驗證必要的回應 headers', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`);

    const headers = response.headers();

    // Content-Type 是必要的
    expect(headers['content-type']).toBeDefined();

    // 記錄所有回應 headers
    console.log('回應 Headers:', Object.keys(headers));
  });

  test('驗證 Date header', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`);

    const dateHeader = response.headers()['date'];

    if (dateHeader) {
      // 驗證日期格式
      const date = new Date(dateHeader);
      expect(date.toString()).not.toBe('Invalid Date');
    }
  });

  test('驗證 Content-Length header', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`);

    const contentLength = response.headers()['content-length'];

    if (contentLength) {
      const length = parseInt(contentLength, 10);
      expect(length).toBeGreaterThan(0);
    }
  });
});

test.describe('HTTP Headers - PetStore', () => {
  const { baseURL, endpoints } = API.petstore;

  test('API Key header 認證', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.petByStatus}`, {
      params: { status: 'available' },
      headers: {
        api_key: 'special-key',
      },
    });

    expect([200, 401]).toContain(response.status());
  });

  test('驗證 PetStore 回應 headers', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.storeInventory}`);

    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });
});

test.describe('HTTP Headers - ReqRes', () => {
  const { baseURL, endpoints } = API.reqres;

  test('x-api-key header 認證', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.users}`, {
      headers: {
        'x-api-key': 'reqres-free-v1',
      },
      params: { page: 1 },
    });

    expect([200, 401]).toContain(response.status());
  });

  test('缺少 API key 的處理', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.users}`, {
      params: { page: 1 },
    });

    // 可能需要 API key 或公開存取
    expect([200, 401, 403]).toContain(response.status());
  });

  test('Authorization Bearer Token 格式', async ({ request }) => {
    // 先登入取得 token
    const loginResponse = await request.post(`${baseURL}${endpoints.login}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'reqres-free-v1',
      },
      data: {
        email: 'eve.holt@reqres.in',
        password: 'cityslicka',
      },
    });

    if (loginResponse.status() === 200) {
      const { token } = await loginResponse.json();

      // 使用 Bearer Token 存取資源
      const response = await request.get(`${baseURL}${endpoints.users}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': 'reqres-free-v1',
        },
        params: { page: 1 },
      });

      expect([200, 401]).toContain(response.status());
    }
  });
});

test.describe('HTTP Headers - 壓縮', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('Accept-Encoding: gzip', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.posts}`, {
      headers: {
        'Accept-Encoding': 'gzip, deflate',
      },
    });

    expect(response.status()).toBe(200);

    const contentEncoding = response.headers()['content-encoding'];
    console.log('Content-Encoding:', contentEncoding || '未壓縮');
  });

  test('不帶 Accept-Encoding 的請求', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.posts}`);

    expect(response.status()).toBe(200);
  });
});

test.describe('HTTP Headers - Content Negotiation', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('Accept-Language header', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`, {
      headers: {
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      },
    });

    expect(response.status()).toBe(200);
  });

  test('多種 Accept types 的優先順序', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`, {
      headers: {
        Accept: 'application/json;q=1.0, text/html;q=0.9, */*;q=0.8',
      },
    });

    expect(response.status()).toBe(200);

    // 應該優先回傳 JSON
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('json');
  });
});
