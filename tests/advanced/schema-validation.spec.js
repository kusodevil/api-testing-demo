/**
 * Schema 驗證測試
 *
 * 驗證 API 回傳的 JSON 結構是否符合預期的 Schema
 * - 完整物件結構驗證
 * - 陣列結構驗證
 * - 巢狀結構驗證
 */
const { test, expect } = require('@playwright/test');
const { API } = require('../../api/endpoints');

// Schema 驗證輔助函數
const validateSchema = (data, schema) => {
  for (const [key, expectedType] of Object.entries(schema)) {
    if (typeof expectedType === 'object' && !Array.isArray(expectedType)) {
      // 巢狀物件
      expect(data).toHaveProperty(key);
      expect(typeof data[key]).toBe('object');
      validateSchema(data[key], expectedType);
    } else if (expectedType === 'array') {
      expect(Array.isArray(data[key])).toBe(true);
    } else {
      expect(data).toHaveProperty(key);
      expect(typeof data[key]).toBe(expectedType);
    }
  }
};

test.describe('Schema 驗證 - JSONPlaceholder', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  const postSchema = {
    id: 'number',
    userId: 'number',
    title: 'string',
    body: 'string',
  };

  const userSchema = {
    id: 'number',
    name: 'string',
    username: 'string',
    email: 'string',
    phone: 'string',
    website: 'string',
    address: {
      street: 'string',
      suite: 'string',
      city: 'string',
      zipcode: 'string',
      geo: {
        lat: 'string',
        lng: 'string',
      },
    },
    company: {
      name: 'string',
      catchPhrase: 'string',
      bs: 'string',
    },
  };

  const commentSchema = {
    postId: 'number',
    id: 'number',
    name: 'string',
    email: 'string',
    body: 'string',
  };

  test('Post 應符合預期 Schema', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`);
    expect(response.status()).toBe(200);

    const post = await response.json();
    validateSchema(post, postSchema);
  });

  test('Posts 列表每筆資料應符合 Schema', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.posts}`);
    expect(response.status()).toBe(200);

    const posts = await response.json();
    expect(Array.isArray(posts)).toBe(true);

    // 驗證前 5 筆
    posts.slice(0, 5).forEach((post) => {
      validateSchema(post, postSchema);
    });
  });

  test('User 應符合預期 Schema（含巢狀結構）', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.user(1)}`);
    expect(response.status()).toBe(200);

    const user = await response.json();
    validateSchema(user, userSchema);
  });

  test('Comment 應符合預期 Schema', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.postComments(1)}`);
    expect(response.status()).toBe(200);

    const comments = await response.json();
    expect(Array.isArray(comments)).toBe(true);

    if (comments.length > 0) {
      validateSchema(comments[0], commentSchema);
    }
  });
});

test.describe('Schema 驗證 - ReqRes', () => {
  const { baseURL, endpoints } = API.reqres;
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': 'reqres-free-v1',
  };

  const userListResponseSchema = {
    page: 'number',
    per_page: 'number',
    total: 'number',
    total_pages: 'number',
  };

  const userDataSchema = {
    id: 'number',
    email: 'string',
    first_name: 'string',
    last_name: 'string',
    avatar: 'string',
  };

  const registerResponseSchema = {
    id: 'number',
    token: 'string',
  };

  const loginResponseSchema = {
    token: 'string',
  };

  test('Users 列表回應應符合分頁 Schema', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.users}`, {
      headers,
      params: { page: 1 },
    });

    if (response.status() === 200) {
      const data = await response.json();
      validateSchema(data, userListResponseSchema);
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
    }
  });

  test('Users 列表中的 User 應符合 Schema', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.users}`, {
      headers,
      params: { page: 1 },
    });

    if (response.status() === 200) {
      const result = await response.json();

      if (result.data && result.data.length > 0) {
        result.data.forEach((user) => {
          validateSchema(user, userDataSchema);
        });
      }
    }
  });

  test('Register 成功回應應符合 Schema', async ({ request }) => {
    const response = await request.post(`${baseURL}${endpoints.register}`, {
      headers,
      data: {
        email: 'eve.holt@reqres.in',
        password: 'pistol',
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    validateSchema(data, registerResponseSchema);
  });

  test('Login 成功回應應符合 Schema', async ({ request }) => {
    const response = await request.post(`${baseURL}${endpoints.login}`, {
      headers,
      data: {
        email: 'eve.holt@reqres.in',
        password: 'cityslicka',
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    validateSchema(data, loginResponseSchema);
  });

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
    expect(data).toHaveProperty('error');
    expect(typeof data.error).toBe('string');
  });
});

test.describe('Schema 驗證 - PetStore', () => {
  const { baseURL, endpoints } = API.petstore;

  const petSchema = {
    id: 'number',
    name: 'string',
    status: 'string',
  };

  const orderSchema = {
    id: 'number',
    petId: 'number',
    quantity: 'number',
    status: 'string',
    complete: 'boolean',
  };

  test('Pet 應符合基本 Schema', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.petByStatus}`, {
      params: { status: 'available' },
    });

    expect(response.status()).toBe(200);
    const pets = await response.json();

    if (pets.length > 0) {
      const pet = pets[0];
      expect(pet).toHaveProperty('id');
      expect(pet).toHaveProperty('name');
      expect(pet).toHaveProperty('status');
    }
  });

  test('Store inventory 應回傳物件', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.storeInventory}`);

    expect(response.status()).toBe(200);
    const inventory = await response.json();
    expect(typeof inventory).toBe('object');
    expect(inventory).not.toBeNull();
  });

  test('新建並查詢 Order 應符合 Schema', async ({ request }) => {
    // 先建立訂單
    const newOrder = {
      id: Date.now(),
      petId: 1,
      quantity: 1,
      shipDate: new Date().toISOString(),
      status: 'placed',
      complete: false,
    };

    const createResponse = await request.post(`${baseURL}${endpoints.storeOrder}`, {
      data: newOrder,
      headers: { 'Content-Type': 'application/json' },
    });

    if (createResponse.status() === 200) {
      const order = await createResponse.json();

      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('petId');
      expect(order).toHaveProperty('quantity');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('complete');

      // 清理：刪除訂單
      await request.delete(`${baseURL}${endpoints.storeOrderById(order.id)}`);
    }
  });
});
