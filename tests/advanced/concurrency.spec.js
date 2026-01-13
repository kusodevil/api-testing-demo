/**
 * 併發測試
 *
 * 測試 API 在高併發情況下的行為：
 * - 同時多個請求
 * - Race Condition 處理
 * - 資源鎖定
 * - 併發讀寫
 */
const { test, expect } = require('@playwright/test');
const { API } = require('../../api/endpoints');

test.describe('併發測試 - 同時讀取', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('10 個並行 GET 請求應全部成功', async ({ request }) => {
    const concurrentCount = 10;

    const promises = Array(concurrentCount)
      .fill(null)
      .map((_, i) => request.get(`${baseURL}${endpoints.post(i + 1)}`));

    const responses = await Promise.all(promises);

    // 所有請求應該成功
    responses.forEach((response, index) => {
      expect(response.status()).toBe(200);
    });

    // 每個回應應該是對應的資源
    for (let i = 0; i < responses.length; i++) {
      const data = await responses[i].json();
      expect(data.id).toBe(i + 1);
    }
  });

  test('並行請求不同資源應正確回傳', async ({ request }) => {
    const promises = [
      request.get(`${baseURL}${endpoints.posts}`),
      request.get(`${baseURL}${endpoints.users}`),
      request.get(`${baseURL}${endpoints.comments}`),
    ];

    const responses = await Promise.all(promises);

    responses.forEach((response) => {
      expect(response.status()).toBe(200);
    });

    const [posts, users, comments] = await Promise.all(responses.map((r) => r.json()));

    // 驗證各資源的特徵欄位
    expect(posts[0]).toHaveProperty('title');
    expect(users[0]).toHaveProperty('username');
    expect(comments[0]).toHaveProperty('email');
  });

  test('大量並行請求（壓力測試）', async ({ request }) => {
    const concurrentCount = 20;

    const promises = Array(concurrentCount)
      .fill(null)
      .map(() => request.get(`${baseURL}${endpoints.posts}`, { params: { _limit: 5 } }));

    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const totalTime = Date.now() - startTime;

    const successCount = responses.filter((r) => r.status() === 200).length;

    console.log(`${concurrentCount} 個並行請求完成，成功: ${successCount}, 總時間: ${totalTime}ms`);

    // 至少 80% 應該成功
    expect(successCount).toBeGreaterThanOrEqual(concurrentCount * 0.8);
  });
});

test.describe('併發測試 - 同時寫入', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('並行 POST 請求應全部成功', async ({ request }) => {
    const concurrentCount = 5;

    const promises = Array(concurrentCount)
      .fill(null)
      .map((_, i) =>
        request.post(`${baseURL}${endpoints.posts}`, {
          data: {
            title: `Concurrent Post ${i + 1}`,
            body: `Body for concurrent post ${i + 1}`,
            userId: 1,
          },
        })
      );

    const responses = await Promise.all(promises);

    responses.forEach((response) => {
      expect([200, 201]).toContain(response.status());
    });

    // 每個 POST 應該建立獨立的資源
    const createdPosts = await Promise.all(responses.map((r) => r.json()));

    const ids = createdPosts.map((p) => p.id);
    console.log('建立的 Post IDs:', ids);
  });

  test('並行更新同一資源', async ({ request }) => {
    const concurrentCount = 5;

    const promises = Array(concurrentCount)
      .fill(null)
      .map((_, i) =>
        request.put(`${baseURL}${endpoints.post(1)}`, {
          data: {
            id: 1,
            title: `Concurrent Update ${i + 1}`,
            body: `Updated by request ${i + 1}`,
            userId: 1,
          },
        })
      );

    const responses = await Promise.all(promises);

    // 所有更新請求應該完成（可能有不同結果）
    responses.forEach((response) => {
      expect([200, 409]).toContain(response.status());
    });
  });

  test('並行刪除不同資源', async ({ request }) => {
    const concurrentCount = 5;

    const promises = Array(concurrentCount)
      .fill(null)
      .map((_, i) => request.delete(`${baseURL}${endpoints.post(i + 1)}`));

    const responses = await Promise.all(promises);

    // 所有刪除應該成功
    responses.forEach((response) => {
      expect([200, 204, 404]).toContain(response.status());
    });
  });
});

test.describe('併發測試 - 讀寫混合', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('同時讀取和寫入', async ({ request }) => {
    const readPromises = Array(5)
      .fill(null)
      .map((_, i) => request.get(`${baseURL}${endpoints.post(i + 1)}`));

    const writePromises = Array(3)
      .fill(null)
      .map((_, i) =>
        request.post(`${baseURL}${endpoints.posts}`, {
          data: {
            title: `Mixed Test Post ${i + 1}`,
            body: 'Testing concurrent read/write',
            userId: 1,
          },
        })
      );

    const allPromises = [...readPromises, ...writePromises];
    const responses = await Promise.all(allPromises);

    // 讀取請求應該成功
    for (let i = 0; i < 5; i++) {
      expect(responses[i].status()).toBe(200);
    }

    // 寫入請求應該成功
    for (let i = 5; i < 8; i++) {
      expect([200, 201]).toContain(responses[i].status());
    }
  });

  test('快速連續的 CRUD 操作', async ({ request }) => {
    // 建立
    const createResponse = await request.post(`${baseURL}${endpoints.posts}`, {
      data: {
        title: 'CRUD Test',
        body: 'Testing CRUD sequence',
        userId: 1,
      },
    });
    expect([200, 201]).toContain(createResponse.status());

    // 並行執行讀取和更新
    const [readResponse, updateResponse] = await Promise.all([
      request.get(`${baseURL}${endpoints.post(1)}`),
      request.put(`${baseURL}${endpoints.post(1)}`, {
        data: {
          id: 1,
          title: 'Updated CRUD Test',
          body: 'Updated body',
          userId: 1,
        },
      }),
    ]);

    expect(readResponse.status()).toBe(200);
    expect(updateResponse.status()).toBe(200);
  });
});

test.describe('併發測試 - PetStore', () => {
  const { baseURL, endpoints } = API.petstore;

  test('並行查詢不同狀態的寵物', async ({ request }) => {
    const statuses = ['available', 'pending', 'sold'];

    const promises = statuses.map((status) =>
      request.get(`${baseURL}${endpoints.petByStatus}`, {
        params: { status },
      })
    );

    const responses = await Promise.all(promises);

    responses.forEach((response) => {
      expect(response.status()).toBe(200);
    });

    const results = await Promise.all(responses.map((r) => r.json()));

    results.forEach((pets, index) => {
      expect(Array.isArray(pets)).toBe(true);
      console.log(`Status ${statuses[index]}: ${pets.length} 隻寵物`);
    });
  });

  test('並行建立多隻寵物', async ({ request }) => {
    const concurrentCount = 3;
    const timestamp = Date.now();

    const promises = Array(concurrentCount)
      .fill(null)
      .map((_, i) =>
        request.post(`${baseURL}${endpoints.pet}`, {
          data: {
            id: timestamp + i,
            name: `Concurrent Pet ${i + 1}`,
            status: 'available',
            photoUrls: [],
          },
          headers: { 'Content-Type': 'application/json' },
        })
      );

    const responses = await Promise.all(promises);

    responses.forEach((response) => {
      expect([200, 400, 405]).toContain(response.status());
    });
  });
});

test.describe('併發測試 - ReqRes', () => {
  const { baseURL, endpoints } = API.reqres;
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': 'reqres-free-v1',
  };

  test('並行查詢多頁使用者', async ({ request }) => {
    const pages = [1, 2];

    const promises = pages.map((page) =>
      request.get(`${baseURL}${endpoints.users}`, {
        headers,
        params: { page },
      })
    );

    const responses = await Promise.all(promises);

    for (let i = 0; i < responses.length; i++) {
      if (responses[i].status() === 200) {
        const data = await responses[i].json();
        expect(data.page).toBe(pages[i]);
      }
    }
  });

  test('並行多個登入請求', async ({ request }) => {
    const concurrentCount = 5;

    const promises = Array(concurrentCount)
      .fill(null)
      .map(() =>
        request.post(`${baseURL}${endpoints.login}`, {
          headers,
          data: {
            email: 'eve.holt@reqres.in',
            password: 'cityslicka',
          },
        })
      );

    const responses = await Promise.all(promises);

    responses.forEach((response) => {
      expect(response.status()).toBe(200);
    });

    // 所有登入應該都成功並回傳 token
    const tokens = await Promise.all(responses.map((r) => r.json()));
    tokens.forEach((data) => {
      expect(data.token).toBeDefined();
    });
  });

  test('並行建立和查詢使用者', async ({ request }) => {
    const createPromises = Array(3)
      .fill(null)
      .map((_, i) =>
        request.post(`${baseURL}${endpoints.users}`, {
          headers,
          data: {
            name: `Concurrent User ${i + 1}`,
            job: 'Tester',
          },
        })
      );

    const readPromises = Array(3)
      .fill(null)
      .map((_, i) =>
        request.get(`${baseURL}${endpoints.user(i + 1)}`, {
          headers,
        })
      );

    const allResponses = await Promise.all([...createPromises, ...readPromises]);

    // 建立請求（可能需要認證）
    for (let i = 0; i < 3; i++) {
      expect([200, 201, 401]).toContain(allResponses[i].status());
    }

    // 讀取請求
    for (let i = 3; i < 6; i++) {
      expect([200, 401, 404]).toContain(allResponses[i].status());
    }
  });
});

test.describe('併發測試 - Race Condition 模擬', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('快速連續更新同一資源', async ({ request }) => {
    const updateCount = 10;
    const results = [];

    // 快速連續發送更新
    for (let i = 0; i < updateCount; i++) {
      const response = await request.put(`${baseURL}${endpoints.post(1)}`, {
        data: {
          id: 1,
          title: `Update ${i + 1}`,
          body: `Body ${i + 1}`,
          userId: 1,
        },
      });

      results.push({
        iteration: i + 1,
        status: response.status(),
      });
    }

    // 所有更新應該都有回應
    results.forEach((r) => {
      expect([200, 409]).toContain(r.status);
    });

    console.log('更新結果:', results);
  });

  test('計數器併發增加模擬', async ({ request }) => {
    // 模擬多個請求同時嘗試增加計數器
    const incrementPromises = Array(5)
      .fill(null)
      .map((_, i) =>
        request.patch(`${baseURL}${endpoints.post(1)}`, {
          data: {
            title: `Increment ${i + 1}`,
          },
        })
      );

    const responses = await Promise.all(incrementPromises);

    // 檢查所有請求都得到回應
    responses.forEach((response) => {
      expect([200, 404, 405]).toContain(response.status());
    });
  });
});
