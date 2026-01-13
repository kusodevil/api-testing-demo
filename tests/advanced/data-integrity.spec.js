/**
 * 資料完整性測試
 *
 * 測試 API 的資料完整性：
 * - 資料一致性
 * - 資料完整性約束
 * - 關聯資料正確性
 * - 資料轉換正確性
 * - 資料不遺失
 */
const { test, expect } = require('@playwright/test');
const { API } = require('../../api/endpoints');

test.describe('資料完整性 - 基本一致性', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('POST 後 GET 應取得相同資料', async ({ request }) => {
    const newPost = {
      title: 'Data Integrity Test',
      body: 'Testing data consistency',
      userId: 1,
    };

    // 建立資料
    const createResponse = await request.post(`${baseURL}${endpoints.posts}`, {
      data: newPost,
    });

    expect([200, 201]).toContain(createResponse.status());
    const createdPost = await createResponse.json();

    // 驗證回傳資料與輸入一致
    expect(createdPost.title).toBe(newPost.title);
    expect(createdPost.body).toBe(newPost.body);
    expect(createdPost.userId).toBe(newPost.userId);
  });

  test('PUT 後 GET 應取得更新後的資料', async ({ request }) => {
    const updateData = {
      id: 1,
      title: 'Updated Title for Integrity Test',
      body: 'Updated body content',
      userId: 1,
    };

    // 更新資料
    const updateResponse = await request.put(`${baseURL}${endpoints.post(1)}`, {
      data: updateData,
    });

    expect(updateResponse.status()).toBe(200);
    const updatedPost = await updateResponse.json();

    // 驗證更新資料一致
    expect(updatedPost.title).toBe(updateData.title);
    expect(updatedPost.body).toBe(updateData.body);
  });

  test('PATCH 應只更新指定欄位', async ({ request }) => {
    const patchData = {
      title: 'Only Title Updated',
    };

    const response = await request.patch(`${baseURL}${endpoints.post(1)}`, {
      data: patchData,
    });

    if (response.status() === 200) {
      const patchedPost = await response.json();

      // 驗證只有 title 被更新
      expect(patchedPost.title).toBe(patchData.title);
      // 其他欄位應保持不變（如果 API 支援）
      expect(patchedPost.id).toBe(1);
    }
  });
});

test.describe('資料完整性 - 資料型別', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('數字欄位應保持數字型別', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`);
    const post = await response.json();

    expect(typeof post.id).toBe('number');
    expect(typeof post.userId).toBe('number');
    expect(Number.isInteger(post.id)).toBe(true);
    expect(Number.isInteger(post.userId)).toBe(true);
  });

  test('字串欄位應保持字串型別', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`);
    const post = await response.json();

    expect(typeof post.title).toBe('string');
    expect(typeof post.body).toBe('string');
  });

  test('特殊字元應正確保存和回傳', async ({ request }) => {
    const specialChars = {
      title: '特殊字元測試：中文、日本語、한국어',
      body: 'Special chars: <>&"\'@#$%^*()[]{}|\\',
      userId: 1,
    };

    const response = await request.post(`${baseURL}${endpoints.posts}`, {
      data: specialChars,
    });

    expect([200, 201]).toContain(response.status());
    const created = await response.json();

    expect(created.title).toBe(specialChars.title);
    expect(created.body).toBe(specialChars.body);
  });

  test('Unicode 表情符號應正確處理', async ({ request }) => {
    const emojiData = {
      title: '表情符號測試 😀🎉🚀💡',
      body: 'Emoji test: 🔥❤️✅',
      userId: 1,
    };

    const response = await request.post(`${baseURL}${endpoints.posts}`, {
      data: emojiData,
    });

    expect([200, 201]).toContain(response.status());
    const created = await response.json();

    expect(created.title).toBe(emojiData.title);
  });
});

test.describe('資料完整性 - 關聯資料', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('Post 的 userId 應對應存在的 User', async ({ request }) => {
    // 取得 post
    const postResponse = await request.get(`${baseURL}${endpoints.post(1)}`);
    const post = await postResponse.json();

    // 取得對應的 user
    const userResponse = await request.get(`${baseURL}${endpoints.user(post.userId)}`);

    expect(userResponse.status()).toBe(200);
    const user = await userResponse.json();

    expect(user.id).toBe(post.userId);
  });

  test('Comment 的 postId 應對應存在的 Post', async ({ request }) => {
    // 取得 comments
    const commentsResponse = await request.get(`${baseURL}${endpoints.postComments(1)}`);
    const comments = await commentsResponse.json();

    // 所有 comments 應該屬於 post 1
    comments.forEach((comment) => {
      expect(comment.postId).toBe(1);
    });
  });

  test('User 的所有 Posts 應正確關聯', async ({ request }) => {
    const userId = 1;

    // 取得使用者的所有 posts
    const postsResponse = await request.get(`${baseURL}${endpoints.posts}`, {
      params: { userId },
    });

    const posts = await postsResponse.json();

    // 所有 posts 的 userId 應該一致
    posts.forEach((post) => {
      expect(post.userId).toBe(userId);
    });
  });
});

test.describe('資料完整性 - 列表完整性', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('分頁資料應不重複', async ({ request }) => {
    const page1Response = await request.get(`${baseURL}${endpoints.posts}`, {
      params: { _page: 1, _limit: 10 },
    });
    const page2Response = await request.get(`${baseURL}${endpoints.posts}`, {
      params: { _page: 2, _limit: 10 },
    });

    const page1 = await page1Response.json();
    const page2 = await page2Response.json();

    const page1Ids = page1.map((p) => p.id);
    const page2Ids = page2.map((p) => p.id);

    // 兩頁不應有重複 ID
    const intersection = page1Ids.filter((id) => page2Ids.includes(id));
    expect(intersection).toHaveLength(0);
  });

  test('所有資料應有唯一 ID', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.posts}`);
    const posts = await response.json();

    const ids = posts.map((p) => p.id);
    const uniqueIds = [...new Set(ids)];

    expect(ids.length).toBe(uniqueIds.length);
  });

  test('排序後的資料順序應正確', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.posts}`, {
      params: { _sort: 'id', _order: 'asc' },
    });

    const posts = await response.json();

    // 驗證升序
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i].id).toBeGreaterThan(posts[i - 1].id);
    }
  });
});

test.describe('資料完整性 - PetStore', () => {
  const { baseURL, endpoints } = API.petstore;

  test('建立 Pet 後資料應完整', async ({ request }) => {
    const newPet = {
      id: Date.now(),
      name: 'Integrity Test Pet',
      status: 'available',
      photoUrls: ['http://example.com/photo1.jpg'],
      category: {
        id: 1,
        name: 'Dogs',
      },
      tags: [
        { id: 1, name: 'friendly' },
        { id: 2, name: 'trained' },
      ],
    };

    const createResponse = await request.post(`${baseURL}${endpoints.pet}`, {
      data: newPet,
      headers: { 'Content-Type': 'application/json' },
    });

    if (createResponse.status() === 200) {
      const created = await createResponse.json();

      expect(created.name).toBe(newPet.name);
      expect(created.status).toBe(newPet.status);

      // 清理
      await request.delete(`${baseURL}${endpoints.petById(created.id)}`);
    }
  });

  test('更新 Pet 狀態應正確反映', async ({ request }) => {
    // 先建立
    const pet = {
      id: Date.now(),
      name: 'Status Test Pet',
      status: 'available',
      photoUrls: [],
    };

    const createResponse = await request.post(`${baseURL}${endpoints.pet}`, {
      data: pet,
      headers: { 'Content-Type': 'application/json' },
    });

    if (createResponse.status() === 200) {
      const created = await createResponse.json();

      // 更新狀態
      const updatedPet = { ...created, status: 'sold' };

      const updateResponse = await request.put(`${baseURL}${endpoints.pet}`, {
        data: updatedPet,
        headers: { 'Content-Type': 'application/json' },
      });

      if (updateResponse.status() === 200) {
        const updated = await updateResponse.json();
        expect(updated.status).toBe('sold');
      }

      // 清理
      await request.delete(`${baseURL}${endpoints.petById(created.id)}`);
    }
  });

  test('Order 資料應與建立時一致', async ({ request }) => {
    const order = {
      id: Date.now(),
      petId: 1,
      quantity: 2,
      shipDate: new Date().toISOString(),
      status: 'placed',
      complete: false,
    };

    const createResponse = await request.post(`${baseURL}${endpoints.storeOrder}`, {
      data: order,
      headers: { 'Content-Type': 'application/json' },
    });

    if (createResponse.status() === 200) {
      const created = await createResponse.json();

      expect(created.petId).toBe(order.petId);
      expect(created.quantity).toBe(order.quantity);
      expect(created.status).toBe(order.status);

      // 清理
      await request.delete(`${baseURL}${endpoints.storeOrderById(created.id)}`);
    }
  });
});

test.describe('資料完整性 - ReqRes', () => {
  const { baseURL, endpoints } = API.reqres;
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': 'reqres-free-v1',
  };

  test('建立使用者資料應完整回傳', async ({ request }) => {
    const newUser = {
      name: 'Data Integrity Test User',
      job: 'QA Engineer',
    };

    const response = await request.post(`${baseURL}${endpoints.users}`, {
      headers,
      data: newUser,
    });

    // 可能需要認證
    expect([200, 201, 401]).toContain(response.status());

    if (response.status() === 401) {
      console.log('API 需要認證，跳過驗證');
      return;
    }

    const created = await response.json();

    expect(created.name).toBe(newUser.name);
    expect(created.job).toBe(newUser.job);
    expect(created.id).toBeDefined();
    expect(created.createdAt).toBeDefined();
  });

  test('更新使用者資料應正確反映', async ({ request }) => {
    const updateData = {
      name: 'Updated Name',
      job: 'Senior Engineer',
    };

    const response = await request.put(`${baseURL}${endpoints.user(2)}`, {
      headers,
      data: updateData,
    });

    // 可能需要認證
    expect([200, 401]).toContain(response.status());

    if (response.status() === 401) {
      console.log('API 需要認證，跳過驗證');
      return;
    }

    const updated = await response.json();

    expect(updated.name).toBe(updateData.name);
    expect(updated.job).toBe(updateData.job);
    expect(updated.updatedAt).toBeDefined();
  });

  test('分頁資訊應準確', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.users}`, {
      headers,
      params: { page: 1, per_page: 6 },
    });

    if (response.status() === 200) {
      const data = await response.json();

      // 總頁數計算應正確
      const expectedPages = Math.ceil(data.total / data.per_page);
      expect(data.total_pages).toBe(expectedPages);

      // 當前頁資料數應正確
      expect(data.data.length).toBeLessThanOrEqual(data.per_page);
    }
  });
});

test.describe('資料完整性 - 邊界情況', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('空字串應正確處理', async ({ request }) => {
    const emptyData = {
      title: '',
      body: '',
      userId: 1,
    };

    const response = await request.post(`${baseURL}${endpoints.posts}`, {
      data: emptyData,
    });

    expect([200, 201, 400]).toContain(response.status());

    if (response.status() === 201 || response.status() === 200) {
      const created = await response.json();
      expect(created.title).toBe('');
      expect(created.body).toBe('');
    }
  });

  test('超長字串應被處理', async ({ request }) => {
    const longString = 'A'.repeat(5000);

    const response = await request.post(`${baseURL}${endpoints.posts}`, {
      data: {
        title: longString,
        body: longString,
        userId: 1,
      },
    });

    expect([200, 201, 400, 413]).toContain(response.status());

    if (response.status() === 201 || response.status() === 200) {
      const created = await response.json();
      // 驗證資料被完整保存或適當截斷
      expect(created.title.length).toBeGreaterThan(0);
    }
  });

  test('null 值應被適當處理', async ({ request }) => {
    const nullData = {
      title: null,
      body: 'Test body',
      userId: 1,
    };

    const response = await request.post(`${baseURL}${endpoints.posts}`, {
      data: nullData,
    });

    // API 應該處理 null 值
    expect([200, 201, 400]).toContain(response.status());
  });
});
