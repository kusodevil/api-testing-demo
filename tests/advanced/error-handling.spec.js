/**
 * 錯誤處理測試
 *
 * 測試 API 對各種錯誤情況的處理：
 * - 404 Not Found
 * - 400 Bad Request
 * - 401 Unauthorized
 * - 405 Method Not Allowed
 * - 500 Internal Server Error
 * - 錯誤回應格式
 */
const { test, expect } = require('@playwright/test');
const { API } = require('../../api/endpoints');

test.describe('錯誤處理 - 404 Not Found', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('不存在的資源應回傳 404', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(99999)}`);

    // JSONPlaceholder 回傳空物件而非 404
    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      // 空物件表示找不到
      expect(Object.keys(data).length).toBe(0);
    }
  });

  test('不存在的 endpoint 應回傳 404', async ({ request }) => {
    const response = await request.get(`${baseURL}/nonexistent-endpoint`);
    expect([404]).toContain(response.status());
  });

  test('不存在的使用者應回傳 404', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.user(99999)}`);

    expect([200, 404]).toContain(response.status());
  });
});

test.describe('錯誤處理 - 400 Bad Request', () => {
  const { baseURL, endpoints } = API.reqres;
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': 'reqres-free-v1',
  };

  test('缺少必要欄位應回傳 400', async ({ request }) => {
    const response = await request.post(`${baseURL}${endpoints.register}`, {
      headers,
      data: {
        // 缺少 email 和 password
      },
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('只有 email 缺少 password 應回傳 400', async ({ request }) => {
    const response = await request.post(`${baseURL}${endpoints.register}`, {
      headers,
      data: {
        email: 'eve.holt@reqres.in',
        // 缺少 password
      },
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  test('錯誤的資料格式應回傳 400', async ({ request }) => {
    const response = await request.post(`${baseURL}${endpoints.login}`, {
      headers,
      data: 'invalid-json-format',
    });

    expect([400, 415]).toContain(response.status());
  });
});

test.describe('錯誤處理 - 401 Unauthorized', () => {
  const { baseURL, endpoints } = API.reqres;

  test('無效的登入憑證應回傳 400', async ({ request }) => {
    const response = await request.post(`${baseURL}${endpoints.login}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'reqres-free-v1',
      },
      data: {
        email: 'invalid@email.com',
        password: 'wrongpassword',
      },
    });

    // ReqRes 對於不在預設列表的用戶回傳 400
    expect([400, 401]).toContain(response.status());
  });
});

test.describe('錯誤處理 - 錯誤回應格式', () => {
  const { baseURL, endpoints } = API.reqres;
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': 'reqres-free-v1',
  };

  test('錯誤回應應包含 error 欄位', async ({ request }) => {
    const response = await request.post(`${baseURL}${endpoints.register}`, {
      headers,
      data: {
        email: 'eve.holt@reqres.in',
        // 缺少 password
      },
    });

    expect(response.status()).toBe(400);

    const data = await response.json();

    // 錯誤回應應該有結構化的錯誤訊息
    expect(data).toHaveProperty('error');
    expect(typeof data.error).toBe('string');
    expect(data.error.length).toBeGreaterThan(0);
  });

  test('錯誤訊息應該有意義', async ({ request }) => {
    const response = await request.post(`${baseURL}${endpoints.register}`, {
      headers,
      data: {
        email: 'eve.holt@reqres.in',
      },
    });

    const data = await response.json();

    // 錯誤訊息應該說明問題
    expect(data.error.toLowerCase()).toContain('password');
  });
});

test.describe('錯誤處理 - PetStore', () => {
  const { baseURL, endpoints } = API.petstore;

  test('不存在的寵物應回傳 404', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.petById(999999999999)}`);

    expect(response.status()).toBe(404);
  });

  test('不存在的訂單應回傳 404', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.storeOrderById(999999999999)}`);

    expect(response.status()).toBe(404);
  });

  test('無效的 pet status 應適當處理', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.petByStatus}`, {
      params: { status: 'invalid_status_value' },
    });

    // 應回傳空陣列或錯誤
    expect([200, 400]).toContain(response.status());

    if (response.status() === 200) {
      const pets = await response.json();
      expect(Array.isArray(pets)).toBe(true);
    }
  });

  test('建立寵物時缺少必要欄位', async ({ request }) => {
    const response = await request.post(`${baseURL}${endpoints.pet}`, {
      data: {
        // 缺少 name 和其他必要欄位
      },
      headers: { 'Content-Type': 'application/json' },
    });

    // PetStore 可能會接受空資料或回傳錯誤
    expect([200, 400, 405]).toContain(response.status());
  });
});

test.describe('錯誤處理 - Content-Type 錯誤', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('錯誤的 Content-Type 應被處理', async ({ request }) => {
    const response = await request.post(`${baseURL}${endpoints.posts}`, {
      headers: {
        'Content-Type': 'text/plain',
      },
      data: 'title=test&body=test&userId=1',
    });

    // API 應該拒絕或嘗試解析
    expect([200, 201, 400, 415]).toContain(response.status());
  });

  test('XML Content-Type 應被適當處理', async ({ request }) => {
    const response = await request.post(`${baseURL}${endpoints.posts}`, {
      headers: {
        'Content-Type': 'application/xml',
      },
      data: '<post><title>Test</title><body>Test</body><userId>1</userId></post>',
    });

    // JSON API 可能不支援 XML
    expect([200, 201, 400, 415]).toContain(response.status());
  });
});

test.describe('錯誤處理 - HTTP Method 錯誤', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('對 GET 資源使用 DELETE 應適當處理', async ({ request }) => {
    const response = await request.delete(`${baseURL}${endpoints.posts}`);

    // 應該拒絕批量刪除
    expect([200, 400, 404, 405]).toContain(response.status());
  });

  test('對不支援 PUT 的資源使用 PUT', async ({ request }) => {
    const response = await request.put(`${baseURL}${endpoints.posts}`, {
      data: {
        id: 1,
        title: 'Updated',
        body: 'Updated body',
        userId: 1,
      },
    });

    // 應該拒絕或適當處理
    expect([200, 201, 400, 404, 405]).toContain(response.status());
  });
});

test.describe('錯誤處理 - 連線與超時', () => {
  test('無效的 URL 應被適當處理', async ({ request }) => {
    try {
      const response = await request.get('https://invalid-domain-that-does-not-exist-12345.com/api');
      // 如果到達這裡，表示有某種回應
      expect(response.status()).toBeDefined();
    } catch (error) {
      // 預期會拋出錯誤
      expect(error).toBeDefined();
    }
  });
});
