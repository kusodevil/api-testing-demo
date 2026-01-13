/**
 * 邊界測試
 *
 * 測試各種邊界情況：
 * - 空值處理
 * - 超長字串
 * - 特殊字元
 * - 數字邊界（0、負數、極大值）
 * - 無效格式
 */
const { test, expect } = require('@playwright/test');
const { API } = require('../../api/endpoints');

test.describe('邊界測試 - JSONPlaceholder', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test.describe('ID 邊界測試', () => {
    test('ID 為 0 應處理得當', async ({ request }) => {
      const response = await request.get(`${baseURL}${endpoints.post(0)}`);
      // 預期回傳 404 或空物件
      expect([200, 404]).toContain(response.status());
    });

    test('ID 為負數應處理得當', async ({ request }) => {
      const response = await request.get(`${baseURL}${endpoints.post(-1)}`);
      expect([200, 404]).toContain(response.status());
    });

    test('ID 為極大數值應處理得當', async ({ request }) => {
      const response = await request.get(`${baseURL}${endpoints.post(999999999)}`);
      expect([200, 404]).toContain(response.status());
    });

    test('ID 為非數字應處理得當', async ({ request }) => {
      const response = await request.get(`${baseURL}/posts/abc`);
      expect([200, 400, 404]).toContain(response.status());
    });
  });

  test.describe('POST 資料邊界測試', () => {
    test('空字串 title 應能處理', async ({ request }) => {
      const response = await request.post(`${baseURL}${endpoints.posts}`, {
        data: {
          title: '',
          body: 'Test body',
          userId: 1,
        },
      });

      // JSONPlaceholder 會接受任何資料（模擬 API）
      expect([200, 201, 400]).toContain(response.status());
    });

    test('超長字串 title 應能處理', async ({ request }) => {
      const longTitle = 'A'.repeat(10000);

      const response = await request.post(`${baseURL}${endpoints.posts}`, {
        data: {
          title: longTitle,
          body: 'Test body',
          userId: 1,
        },
      });

      expect([200, 201, 400, 413]).toContain(response.status());
    });

    test('特殊字元應能處理', async ({ request }) => {
      const response = await request.post(`${baseURL}${endpoints.posts}`, {
        data: {
          title: '<script>alert("XSS")</script>',
          body: '特殊字元測試：!@#$%^&*()_+-=[]{}|;:,.<>?',
          userId: 1,
        },
      });

      expect([200, 201]).toContain(response.status());
    });

    test('Unicode 字元應能處理', async ({ request }) => {
      const response = await request.post(`${baseURL}${endpoints.posts}`, {
        data: {
          title: '中文標題 日本語 한국어 🎉🚀',
          body: 'Emoji test: 😀🎈🌟',
          userId: 1,
        },
      });

      expect([200, 201]).toContain(response.status());
    });

    test('缺少必要欄位應處理得當', async ({ request }) => {
      const response = await request.post(`${baseURL}${endpoints.posts}`, {
        data: {
          // 缺少 title, body, userId
        },
      });

      // JSONPlaceholder 是模擬 API，會接受
      expect([200, 201, 400]).toContain(response.status());
    });

    test('userId 為 0 應處理得當', async ({ request }) => {
      const response = await request.post(`${baseURL}${endpoints.posts}`, {
        data: {
          title: 'Test',
          body: 'Test',
          userId: 0,
        },
      });

      expect([200, 201, 400]).toContain(response.status());
    });

    test('userId 為負數應處理得當', async ({ request }) => {
      const response = await request.post(`${baseURL}${endpoints.posts}`, {
        data: {
          title: 'Test',
          body: 'Test',
          userId: -1,
        },
      });

      expect([200, 201, 400]).toContain(response.status());
    });
  });
});

test.describe('邊界測試 - ReqRes', () => {
  const { baseURL, endpoints } = API.reqres;
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': 'reqres-free-v1',
  };

  test.describe('Email 格式邊界測試', () => {
    test('空 email 應被拒絕', async ({ request }) => {
      const response = await request.post(`${baseURL}${endpoints.register}`, {
        headers,
        data: {
          email: '',
          password: 'password123',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('無效 email 格式應被拒絕', async ({ request }) => {
      const response = await request.post(`${baseURL}${endpoints.register}`, {
        headers,
        data: {
          email: 'invalid-email',
          password: 'password123',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('只有 @ 的 email 應被拒絕', async ({ request }) => {
      const response = await request.post(`${baseURL}${endpoints.register}`, {
        headers,
        data: {
          email: '@',
          password: 'password123',
        },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Password 邊界測試', () => {
    test('空密碼應被拒絕', async ({ request }) => {
      const response = await request.post(`${baseURL}${endpoints.login}`, {
        headers,
        data: {
          email: 'eve.holt@reqres.in',
          password: '',
        },
      });

      // 空密碼可能被視為缺少密碼
      expect([400]).toContain(response.status());
    });
  });

  test.describe('分頁邊界測試', () => {
    test('page 為 0 應處理得當', async ({ request }) => {
      const response = await request.get(`${baseURL}${endpoints.users}`, {
        headers,
        params: { page: 0 },
      });

      // 200: 正常處理, 400: 參數錯誤, 401: 需要認證
      expect([200, 400, 401]).toContain(response.status());
    });

    test('page 為負數應處理得當', async ({ request }) => {
      const response = await request.get(`${baseURL}${endpoints.users}`, {
        headers,
        params: { page: -1 },
      });

      // 200: 正常處理, 400: 參數錯誤, 401: 需要認證
      expect([200, 400, 401]).toContain(response.status());
    });

    test('page 為極大數應回傳空資料', async ({ request }) => {
      const response = await request.get(`${baseURL}${endpoints.users}`, {
        headers,
        params: { page: 99999 },
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.data).toHaveLength(0);
      }
    });
  });
});

test.describe('邊界測試 - PetStore', () => {
  const { baseURL, endpoints } = API.petstore;

  test.describe('Pet ID 邊界測試', () => {
    test('ID 為 0 應處理得當', async ({ request }) => {
      const response = await request.get(`${baseURL}${endpoints.petById(0)}`);
      expect([200, 404]).toContain(response.status());
    });

    test('ID 為負數應處理得當', async ({ request }) => {
      const response = await request.get(`${baseURL}${endpoints.petById(-1)}`);
      expect([200, 400, 404]).toContain(response.status());
    });

    test('不存在的 ID 應回傳 404', async ({ request }) => {
      const response = await request.get(`${baseURL}${endpoints.petById(999999999999)}`);
      expect([404]).toContain(response.status());
    });
  });

  test.describe('Pet Status 邊界測試', () => {
    test('無效的 status 應處理得當', async ({ request }) => {
      const response = await request.get(`${baseURL}${endpoints.petByStatus}`, {
        params: { status: 'invalid_status' },
      });

      // 可能回傳空陣列或錯誤
      expect([200, 400]).toContain(response.status());

      if (response.status() === 200) {
        const pets = await response.json();
        expect(Array.isArray(pets)).toBe(true);
      }
    });

    test('空的 status 應處理得當', async ({ request }) => {
      const response = await request.get(`${baseURL}${endpoints.petByStatus}`, {
        params: { status: '' },
      });

      expect([200, 400]).toContain(response.status());
    });
  });

  test.describe('Pet 資料邊界測試', () => {
    test('空名稱的 Pet 應處理得當', async ({ request }) => {
      const response = await request.post(`${baseURL}${endpoints.pet}`, {
        data: {
          id: Date.now(),
          name: '',
          status: 'available',
        },
        headers: { 'Content-Type': 'application/json' },
      });

      expect([200, 400, 405]).toContain(response.status());
    });

    test('超長名稱的 Pet 應處理得當', async ({ request }) => {
      const response = await request.post(`${baseURL}${endpoints.pet}`, {
        data: {
          id: Date.now(),
          name: 'A'.repeat(1000),
          status: 'available',
        },
        headers: { 'Content-Type': 'application/json' },
      });

      expect([200, 400, 413]).toContain(response.status());
    });
  });

  test.describe('Order 邊界測試', () => {
    test('quantity 為 0 應處理得當', async ({ request }) => {
      const response = await request.post(`${baseURL}${endpoints.storeOrder}`, {
        data: {
          id: Date.now(),
          petId: 1,
          quantity: 0,
          status: 'placed',
          complete: false,
        },
        headers: { 'Content-Type': 'application/json' },
      });

      expect([200, 400]).toContain(response.status());
    });

    test('quantity 為負數應處理得當', async ({ request }) => {
      const response = await request.post(`${baseURL}${endpoints.storeOrder}`, {
        data: {
          id: Date.now(),
          petId: 1,
          quantity: -1,
          status: 'placed',
          complete: false,
        },
        headers: { 'Content-Type': 'application/json' },
      });

      expect([200, 400]).toContain(response.status());
    });
  });
});
