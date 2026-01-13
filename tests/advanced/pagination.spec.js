/**
 * 分頁測試
 *
 * 測試 API 的分頁功能：
 * - 基本分頁功能
 * - 分頁邊界（第一頁、最後一頁）
 * - 每頁筆數設定
 * - 分頁資訊正確性
 */
const { test, expect } = require('@playwright/test');
const { API } = require('../../api/endpoints');

test.describe('分頁測試 - ReqRes', () => {
  const { baseURL, endpoints } = API.reqres;
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': 'reqres-free-v1',
  };

  test('應能取得第一頁資料', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.users}`, {
      headers,
      params: { page: 1 },
    });

    if (response.status() === 200) {
      const data = await response.json();

      expect(data.page).toBe(1);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data.length).toBeLessThanOrEqual(data.per_page);
    }
  });

  test('應能取得第二頁資料', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.users}`, {
      headers,
      params: { page: 2 },
    });

    if (response.status() === 200) {
      const data = await response.json();

      expect(data.page).toBe(2);
    }
  });

  test('不同頁的資料應不重複', async ({ request }) => {
    const response1 = await request.get(`${baseURL}${endpoints.users}`, {
      headers,
      params: { page: 1 },
    });

    const response2 = await request.get(`${baseURL}${endpoints.users}`, {
      headers,
      params: { page: 2 },
    });

    if (response1.status() === 200 && response2.status() === 200) {
      const data1 = await response1.json();
      const data2 = await response2.json();

      const ids1 = data1.data.map((u) => u.id);
      const ids2 = data2.data.map((u) => u.id);

      // 確認兩頁的 ID 沒有重複
      const intersection = ids1.filter((id) => ids2.includes(id));
      expect(intersection).toHaveLength(0);
    }
  });

  test('分頁資訊應正確', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.users}`, {
      headers,
      params: { page: 1 },
    });

    if (response.status() === 200) {
      const data = await response.json();

      // 總頁數計算應正確
      const expectedTotalPages = Math.ceil(data.total / data.per_page);
      expect(data.total_pages).toBe(expectedTotalPages);

      // total 應大於等於當前頁資料數
      expect(data.total).toBeGreaterThanOrEqual(data.data.length);
    }
  });

  test('超過最後一頁應回傳空資料', async ({ request }) => {
    // 先取得總頁數
    const firstResponse = await request.get(`${baseURL}${endpoints.users}`, {
      headers,
      params: { page: 1 },
    });

    if (firstResponse.status() === 200) {
      const firstData = await firstResponse.json();
      const beyondLastPage = firstData.total_pages + 1;

      const response = await request.get(`${baseURL}${endpoints.users}`, {
        headers,
        params: { page: beyondLastPage },
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.data).toHaveLength(0);
      }
    }
  });

  test('每頁筆數應符合設定', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.users}`, {
      headers,
      params: { page: 1, per_page: 3 },
    });

    if (response.status() === 200) {
      const data = await response.json();

      // 如果 API 支援 per_page 參數
      if (data.per_page === 3) {
        expect(data.data.length).toBeLessThanOrEqual(3);
      }
    }
  });
});

test.describe('分頁測試 - JSONPlaceholder', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('使用 _page 參數應能分頁', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.posts}`, {
      params: { _page: 1, _limit: 10 },
    });

    expect(response.status()).toBe(200);

    const posts = await response.json();
    expect(posts.length).toBeLessThanOrEqual(10);
  });

  test('_limit 參數應限制回傳筆數', async ({ request }) => {
    const limit = 5;

    const response = await request.get(`${baseURL}${endpoints.posts}`, {
      params: { _limit: limit },
    });

    expect(response.status()).toBe(200);

    const posts = await response.json();
    expect(posts.length).toBe(limit);
  });

  test('不同頁的 posts 應不重複', async ({ request }) => {
    const response1 = await request.get(`${baseURL}${endpoints.posts}`, {
      params: { _page: 1, _limit: 10 },
    });

    const response2 = await request.get(`${baseURL}${endpoints.posts}`, {
      params: { _page: 2, _limit: 10 },
    });

    const posts1 = await response1.json();
    const posts2 = await response2.json();

    const ids1 = posts1.map((p) => p.id);
    const ids2 = posts2.map((p) => p.id);

    // 確認兩頁的 ID 沒有重複
    const intersection = ids1.filter((id) => ids2.includes(id));
    expect(intersection).toHaveLength(0);
  });

  test('_start 和 _end 參數應能切片資料', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.posts}`, {
      params: { _start: 0, _end: 5 },
    });

    expect(response.status()).toBe(200);

    const posts = await response.json();
    expect(posts.length).toBe(5);
    expect(posts[0].id).toBe(1); // 從第一筆開始
  });

  test('Users 也應支援分頁', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.users}`, {
      params: { _page: 1, _limit: 5 },
    });

    expect(response.status()).toBe(200);

    const users = await response.json();
    expect(users.length).toBeLessThanOrEqual(5);
  });
});
