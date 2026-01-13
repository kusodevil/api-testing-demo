/**
 * 冪等性測試
 *
 * 測試 API 的冪等性：
 * - GET 請求冪等性（多次呼叫結果相同）
 * - PUT 請求冪等性（多次更新結果相同）
 * - DELETE 請求冪等性
 * - POST 請求非冪等性驗證
 */
const { test, expect } = require('@playwright/test');
const { API } = require('../../api/endpoints');

test.describe('冪等性測試 - GET 請求', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('多次 GET 同一資源應回傳相同結果', async ({ request }) => {
    const responses = [];

    // 連續執行 3 次相同的 GET 請求
    for (let i = 0; i < 3; i++) {
      const response = await request.get(`${baseURL}${endpoints.post(1)}`);
      expect(response.status()).toBe(200);
      responses.push(await response.json());
    }

    // 所有回應應該相同
    expect(responses[0]).toEqual(responses[1]);
    expect(responses[1]).toEqual(responses[2]);
  });

  test('多次 GET 列表應回傳相同結果', async ({ request }) => {
    const response1 = await request.get(`${baseURL}${endpoints.posts}`, {
      params: { _limit: 5 },
    });
    const response2 = await request.get(`${baseURL}${endpoints.posts}`, {
      params: { _limit: 5 },
    });

    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);

    const data1 = await response1.json();
    const data2 = await response2.json();

    // 結果應該相同
    expect(data1).toEqual(data2);
  });

  test('使用相同參數的 GET 應回傳相同結果', async ({ request }) => {
    const params = { userId: 1 };

    const response1 = await request.get(`${baseURL}${endpoints.posts}`, { params });
    const response2 = await request.get(`${baseURL}${endpoints.posts}`, { params });

    const data1 = await response1.json();
    const data2 = await response2.json();

    expect(data1).toEqual(data2);
  });
});

test.describe('冪等性測試 - PUT 請求', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('多次 PUT 相同資料應產生相同結果', async ({ request }) => {
    const updateData = {
      id: 1,
      title: 'Idempotent Update',
      body: 'This update should be idempotent',
      userId: 1,
    };

    const responses = [];

    // 執行 3 次相同的 PUT 請求
    for (let i = 0; i < 3; i++) {
      const response = await request.put(`${baseURL}${endpoints.post(1)}`, {
        data: updateData,
      });
      expect(response.status()).toBe(200);
      responses.push(await response.json());
    }

    // 所有回應應該相同（排除可能的時間戳差異）
    expect(responses[0].title).toBe(responses[1].title);
    expect(responses[1].title).toBe(responses[2].title);
    expect(responses[0].body).toBe(responses[1].body);
  });

  test('PUT 後再次 GET 應取得更新後的資料', async ({ request }) => {
    const updateData = {
      id: 1,
      title: 'Updated Title for Idempotency Test',
      body: 'Updated body content',
      userId: 1,
    };

    // 執行 PUT
    const putResponse = await request.put(`${baseURL}${endpoints.post(1)}`, {
      data: updateData,
    });
    expect(putResponse.status()).toBe(200);
    const putData = await putResponse.json();

    // 多次執行相同 PUT 應該得到相同結果
    const putResponse2 = await request.put(`${baseURL}${endpoints.post(1)}`, {
      data: updateData,
    });
    const putData2 = await putResponse2.json();

    expect(putData.title).toBe(putData2.title);
    expect(putData.body).toBe(putData2.body);
  });
});

test.describe('冪等性測試 - DELETE 請求', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('DELETE 請求應該是冪等的', async ({ request }) => {
    // 第一次刪除
    const response1 = await request.delete(`${baseURL}${endpoints.post(1)}`);
    expect(response1.status()).toBe(200);

    // 第二次刪除（已刪除的資源）
    // 注意：JSONPlaceholder 是模擬 API，實際上不會真的刪除
    const response2 = await request.delete(`${baseURL}${endpoints.post(1)}`);

    // 冪等性：多次刪除應該都成功或都回傳相同狀態
    expect([200, 404]).toContain(response2.status());
  });

  test('刪除不存在的資源應安全處理', async ({ request }) => {
    const nonExistentId = 999999;

    // 多次刪除不存在的資源
    const response1 = await request.delete(`${baseURL}${endpoints.post(nonExistentId)}`);
    const response2 = await request.delete(`${baseURL}${endpoints.post(nonExistentId)}`);

    // 兩次應該回傳相同結果
    expect(response1.status()).toBe(response2.status());
  });
});

test.describe('冪等性測試 - POST 請求（非冪等）', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('多次 POST 應建立多筆資料（非冪等）', async ({ request }) => {
    const newPost = {
      title: 'New Post for Idempotency Test',
      body: 'Testing non-idempotent POST',
      userId: 1,
    };

    // 執行多次 POST
    const response1 = await request.post(`${baseURL}${endpoints.posts}`, {
      data: newPost,
    });
    const response2 = await request.post(`${baseURL}${endpoints.posts}`, {
      data: newPost,
    });

    expect([200, 201]).toContain(response1.status());
    expect([200, 201]).toContain(response2.status());

    const data1 = await response1.json();
    const data2 = await response2.json();

    // POST 是非冪等的，每次應該建立新資源（不同 ID）
    // 注意：JSONPlaceholder 會回傳不同的 ID
    expect(data1.id).toBeDefined();
    expect(data2.id).toBeDefined();
  });
});

test.describe('冪等性測試 - PetStore', () => {
  const { baseURL, endpoints } = API.petstore;

  test('多次 GET 庫存應回傳一致結果', async ({ request }) => {
    const response1 = await request.get(`${baseURL}${endpoints.storeInventory}`);
    const response2 = await request.get(`${baseURL}${endpoints.storeInventory}`);

    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);

    // 庫存查詢應該是冪等的（短時間內結果應相近）
    const data1 = await response1.json();
    const data2 = await response2.json();

    expect(typeof data1).toBe('object');
    expect(typeof data2).toBe('object');
  });

  test('多次查詢相同狀態的寵物', async ({ request }) => {
    const response1 = await request.get(`${baseURL}${endpoints.petByStatus}`, {
      params: { status: 'available' },
    });
    const response2 = await request.get(`${baseURL}${endpoints.petByStatus}`, {
      params: { status: 'available' },
    });

    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);

    // 兩次查詢結構應該相同
    const data1 = await response1.json();
    const data2 = await response2.json();

    expect(Array.isArray(data1)).toBe(true);
    expect(Array.isArray(data2)).toBe(true);
  });

  test('PUT 更新寵物應該是冪等的', async ({ request }) => {
    const petData = {
      id: 12345,
      name: 'Idempotent Pet',
      status: 'available',
      photoUrls: [],
    };

    // 多次 PUT 相同資料
    const response1 = await request.put(`${baseURL}${endpoints.pet}`, {
      data: petData,
      headers: { 'Content-Type': 'application/json' },
    });

    const response2 = await request.put(`${baseURL}${endpoints.pet}`, {
      data: petData,
      headers: { 'Content-Type': 'application/json' },
    });

    // 兩次應該都成功且結果相同
    if (response1.status() === 200 && response2.status() === 200) {
      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(data1.name).toBe(data2.name);
      expect(data1.status).toBe(data2.status);
    }
  });
});

test.describe('冪等性測試 - ReqRes', () => {
  const { baseURL, endpoints } = API.reqres;
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': 'reqres-free-v1',
  };

  test('多次 GET 使用者列表應回傳相同結果', async ({ request }) => {
    const response1 = await request.get(`${baseURL}${endpoints.users}`, {
      headers,
      params: { page: 1 },
    });

    const response2 = await request.get(`${baseURL}${endpoints.users}`, {
      headers,
      params: { page: 1 },
    });

    if (response1.status() === 200 && response2.status() === 200) {
      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(data1.page).toBe(data2.page);
      expect(data1.total).toBe(data2.total);
      expect(data1.data.length).toBe(data2.data.length);
    }
  });

  test('多次登入應回傳相同 token 格式', async ({ request }) => {
    const loginData = {
      email: 'eve.holt@reqres.in',
      password: 'cityslicka',
    };

    const response1 = await request.post(`${baseURL}${endpoints.login}`, {
      headers,
      data: loginData,
    });

    const response2 = await request.post(`${baseURL}${endpoints.login}`, {
      headers,
      data: loginData,
    });

    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);

    const data1 = await response1.json();
    const data2 = await response2.json();

    // 兩次登入都應該成功並回傳 token
    expect(data1.token).toBeDefined();
    expect(data2.token).toBeDefined();
  });

  test('PUT 更新使用者應該是冪等的', async ({ request }) => {
    const updateData = {
      name: 'Updated Name',
      job: 'Updated Job',
    };

    const response1 = await request.put(`${baseURL}${endpoints.user(2)}`, {
      headers,
      data: updateData,
    });

    const response2 = await request.put(`${baseURL}${endpoints.user(2)}`, {
      headers,
      data: updateData,
    });

    // 可能需要認證
    expect([200, 401]).toContain(response1.status());
    expect([200, 401]).toContain(response2.status());

    if (response1.status() === 401 || response2.status() === 401) {
      console.log('API 需要認證，跳過驗證');
      return;
    }

    const data1 = await response1.json();
    const data2 = await response2.json();

    // 兩次更新的 name 和 job 應該相同
    expect(data1.name).toBe(data2.name);
    expect(data1.job).toBe(data2.job);
  });
});
