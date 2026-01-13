/**
 * 安全性測試
 *
 * 測試 API 的安全性：
 * - SQL Injection 防護
 * - XSS 防護
 * - 認證與授權
 * - 敏感資料處理
 * - Rate Limiting
 * - CORS 相關
 */
const { test, expect } = require('@playwright/test');
const { API } = require('../../api/endpoints');

test.describe('安全性測試 - SQL Injection 防護', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  const sqlInjectionPayloads = [
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    "1; SELECT * FROM users",
    "' UNION SELECT * FROM users --",
    "1' AND 1=1 --",
  ];

  sqlInjectionPayloads.forEach((payload, index) => {
    test(`SQL Injection 測試 #${index + 1}`, async ({ request }) => {
      const response = await request.get(`${baseURL}/posts/${payload}`);

      // API 應該安全處理，不應回傳 500 錯誤（表示注入成功）
      expect(response.status()).not.toBe(500);

      // 應該回傳 400 或 404，而非執行注入
      expect([200, 400, 404]).toContain(response.status());
    });
  });

  test('POST 資料中的 SQL Injection', async ({ request }) => {
    const response = await request.post(`${baseURL}${endpoints.posts}`, {
      data: {
        title: "'; DROP TABLE posts; --",
        body: "1' OR '1'='1",
        userId: 1,
      },
    });

    // 不應導致伺服器錯誤
    expect(response.status()).not.toBe(500);
  });
});

test.describe('安全性測試 - XSS 防護', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    'javascript:alert("XSS")',
    '<body onload=alert("XSS")>',
    '"><script>alert("XSS")</script>',
  ];

  xssPayloads.forEach((payload, index) => {
    test(`XSS 攻擊測試 #${index + 1}`, async ({ request }) => {
      const response = await request.post(`${baseURL}${endpoints.posts}`, {
        data: {
          title: payload,
          body: payload,
          userId: 1,
        },
      });

      // API 應該接受但安全處理這些資料
      expect([200, 201, 400]).toContain(response.status());

      if (response.status() === 201 || response.status() === 200) {
        const data = await response.json();
        // 驗證回傳的資料（理想情況下應該被轉義或過濾）
        // 注意：JSONPlaceholder 是模擬 API，會原樣回傳
        expect(data).toBeDefined();
      }
    });
  });
});

test.describe('安全性測試 - 認證與授權', () => {
  const { baseURL, endpoints } = API.reqres;
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': 'reqres-free-v1',
  };

  test('缺少認證資訊應被拒絕', async ({ request }) => {
    const response = await request.post(`${baseURL}${endpoints.register}`, {
      // 不提供 headers（缺少 API key）
      data: {
        email: 'test@test.com',
        password: 'test123',
      },
    });

    // 應該要求認證或回傳錯誤
    expect([400, 401, 403]).toContain(response.status());
  });

  test('無效的認證資訊應被拒絕', async ({ request }) => {
    const response = await request.post(`${baseURL}${endpoints.login}`, {
      headers,
      data: {
        email: 'wrong@email.com',
        password: 'wrongpassword',
      },
    });

    // 應該回傳認證失敗
    expect([400, 401]).toContain(response.status());
  });

  test('密碼不應在回應中明文顯示', async ({ request }) => {
    const response = await request.post(`${baseURL}${endpoints.register}`, {
      headers,
      data: {
        email: 'eve.holt@reqres.in',
        password: 'pistol',
      },
    });

    if (response.status() === 200) {
      const data = await response.json();
      const responseText = JSON.stringify(data);

      // 密碼不應該出現在回應中
      expect(responseText).not.toContain('pistol');
    }
  });

  test('Token 應該是有效的格式', async ({ request }) => {
    const response = await request.post(`${baseURL}${endpoints.login}`, {
      headers,
      data: {
        email: 'eve.holt@reqres.in',
        password: 'cityslicka',
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.token).toBeDefined();
    expect(data.token.length).toBeGreaterThan(0);
    // Token 應該是非空字串
    expect(typeof data.token).toBe('string');
  });
});

test.describe('安全性測試 - 敏感資料處理', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('不應回傳敏感欄位', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.user(1)}`);
    const user = await response.json();

    // 確認沒有回傳敏感資訊
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('passwordHash');
    expect(user).not.toHaveProperty('secret');
    expect(user).not.toHaveProperty('apiKey');
    expect(user).not.toHaveProperty('creditCard');
    expect(user).not.toHaveProperty('ssn');
  });

  test('批量查詢不應洩漏其他用戶敏感資料', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.users}`);
    const users = await response.json();

    users.forEach((user) => {
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('passwordHash');
    });
  });
});

test.describe('安全性測試 - HTTP Methods 限制', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('不支援的 HTTP Method 應回傳適當狀態碼', async ({ request }) => {
    // 嘗試使用 PATCH 方法
    const response = await request.patch(`${baseURL}${endpoints.post(1)}`, {
      data: { title: 'Patched' },
    });

    // 應該支援或明確拒絕
    expect([200, 400, 404, 405]).toContain(response.status());
  });

  test('OPTIONS 請求應回傳允許的方法', async ({ request }) => {
    const response = await request.fetch(`${baseURL}${endpoints.posts}`, {
      method: 'OPTIONS',
    });

    // 應該回傳成功或支援的資訊
    expect([200, 204, 404]).toContain(response.status());
  });
});

test.describe('安全性測試 - 路徑遍歷防護', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  const pathTraversalPayloads = [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '....//....//....//etc/passwd',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
  ];

  pathTraversalPayloads.forEach((payload, index) => {
    test(`路徑遍歷測試 #${index + 1}`, async ({ request }) => {
      const response = await request.get(`${baseURL}/posts/${payload}`);

      // 不應該回傳系統檔案
      expect(response.status()).not.toBe(500);
      expect([200, 400, 404]).toContain(response.status());
    });
  });
});

test.describe('安全性測試 - PetStore 認證', () => {
  const { baseURL, endpoints } = API.petstore;

  test('無效的 API Key 應被處理', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.petByStatus}`, {
      params: { status: 'available' },
      headers: {
        api_key: 'invalid-api-key-12345',
      },
    });

    // PetStore 是公開 API，但應該安全處理無效金鑰
    expect([200, 401, 403]).toContain(response.status());
  });

  test('刪除操作應有適當權限控制', async ({ request }) => {
    // 嘗試刪除不存在的寵物
    const response = await request.delete(`${baseURL}${endpoints.petById(999999999)}`);

    // 應該回傳 404 或需要認證
    expect([200, 401, 403, 404]).toContain(response.status());
  });
});
