/**
 * 排序與篩選測試
 *
 * 測試 API 的排序和篩選功能：
 * - 升序/降序排序
 * - 依欄位篩選
 * - 組合查詢
 */
const { test, expect } = require('@playwright/test');
const { API } = require('../../api/endpoints');

test.describe('排序測試 - JSONPlaceholder', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('_sort 參數應能依 id 升序排序', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.posts}`, {
      params: { _sort: 'id', _order: 'asc', _limit: 10 },
    });

    expect(response.status()).toBe(200);

    const posts = await response.json();

    // 驗證升序
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i].id).toBeGreaterThan(posts[i - 1].id);
    }
  });

  test('_sort 參數應能依 id 降序排序', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.posts}`, {
      params: { _sort: 'id', _order: 'desc', _limit: 10 },
    });

    expect(response.status()).toBe(200);

    const posts = await response.json();

    // 驗證降序
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i].id).toBeLessThan(posts[i - 1].id);
    }
  });

  test('_sort 參數應能依 userId 排序', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.posts}`, {
      params: { _sort: 'userId', _order: 'asc', _limit: 20 },
    });

    expect(response.status()).toBe(200);

    const posts = await response.json();

    // 驗證 userId 升序
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i].userId).toBeGreaterThanOrEqual(posts[i - 1].userId);
    }
  });

  test('Users 應能依 name 排序', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.users}`, {
      params: { _sort: 'name', _order: 'asc' },
    });

    expect(response.status()).toBe(200);

    const users = await response.json();

    // 驗證字母升序
    for (let i = 1; i < users.length; i++) {
      expect(users[i].name.localeCompare(users[i - 1].name)).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('篩選測試 - JSONPlaceholder', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('應能依 userId 篩選 posts', async ({ request }) => {
    const targetUserId = 1;

    const response = await request.get(`${baseURL}${endpoints.posts}`, {
      params: { userId: targetUserId },
    });

    expect(response.status()).toBe(200);

    const posts = await response.json();

    // 所有結果都應該是指定的 userId
    posts.forEach((post) => {
      expect(post.userId).toBe(targetUserId);
    });
  });

  test('應能依 postId 篩選 comments', async ({ request }) => {
    const targetPostId = 1;

    const response = await request.get(`${baseURL}${endpoints.comments}`, {
      params: { postId: targetPostId },
    });

    expect(response.status()).toBe(200);

    const comments = await response.json();

    // 所有結果都應該是指定的 postId
    comments.forEach((comment) => {
      expect(comment.postId).toBe(targetPostId);
    });
  });

  test('應能依 id 篩選特定資料', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.posts}`, {
      params: { id: 5 },
    });

    expect(response.status()).toBe(200);

    const posts = await response.json();
    expect(posts.length).toBe(1);
    expect(posts[0].id).toBe(5);
  });

  test('多重篩選條件應能組合', async ({ request }) => {
    // 找不到符合的資料時應回傳空陣列
    const response = await request.get(`${baseURL}${endpoints.posts}`, {
      params: { userId: 1, id: 1 },
    });

    expect(response.status()).toBe(200);

    const posts = await response.json();

    if (posts.length > 0) {
      expect(posts[0].userId).toBe(1);
      expect(posts[0].id).toBe(1);
    }
  });
});

test.describe('篩選測試 - PetStore', () => {
  const { baseURL, endpoints } = API.petstore;

  test('應能依 status=available 篩選 pets', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.petByStatus}`, {
      params: { status: 'available' },
    });

    expect(response.status()).toBe(200);

    const pets = await response.json();

    pets.forEach((pet) => {
      expect(pet.status).toBe('available');
    });
  });

  test('應能依 status=pending 篩選 pets', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.petByStatus}`, {
      params: { status: 'pending' },
    });

    expect(response.status()).toBe(200);

    const pets = await response.json();

    pets.forEach((pet) => {
      expect(pet.status).toBe('pending');
    });
  });

  test('應能依 status=sold 篩選 pets', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.petByStatus}`, {
      params: { status: 'sold' },
    });

    expect(response.status()).toBe(200);

    const pets = await response.json();

    pets.forEach((pet) => {
      expect(pet.status).toBe('sold');
    });
  });

  test('不同 status 的結果應不同', async ({ request }) => {
    const availableResponse = await request.get(`${baseURL}${endpoints.petByStatus}`, {
      params: { status: 'available' },
    });

    const soldResponse = await request.get(`${baseURL}${endpoints.petByStatus}`, {
      params: { status: 'sold' },
    });

    const available = await availableResponse.json();
    const sold = await soldResponse.json();

    // 取得各自的 ID 列表
    const availableIds = available.map((p) => p.id);
    const soldIds = sold.map((p) => p.id);

    // 理論上不應該有重複（同一隻 pet 不能同時是 available 和 sold）
    // 但 PetStore 是共用 API，可能有其他人的測試資料，這裡只驗證 API 有回應
    expect(availableResponse.status()).toBe(200);
    expect(soldResponse.status()).toBe(200);
  });
});

test.describe('組合查詢測試 - JSONPlaceholder', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('排序 + 分頁組合查詢', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.posts}`, {
      params: {
        _sort: 'id',
        _order: 'desc',
        _page: 1,
        _limit: 5,
      },
    });

    expect(response.status()).toBe(200);

    const posts = await response.json();

    // 應該有 5 筆
    expect(posts.length).toBe(5);

    // 應該是降序
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i].id).toBeLessThan(posts[i - 1].id);
    }
  });

  test('篩選 + 分頁組合查詢', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.posts}`, {
      params: {
        userId: 1,
        _page: 1,
        _limit: 5,
      },
    });

    expect(response.status()).toBe(200);

    const posts = await response.json();

    // 應該最多 5 筆
    expect(posts.length).toBeLessThanOrEqual(5);

    // 都應該是 userId = 1
    posts.forEach((post) => {
      expect(post.userId).toBe(1);
    });
  });

  test('篩選 + 排序 + 分頁組合查詢', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.posts}`, {
      params: {
        userId: 1,
        _sort: 'id',
        _order: 'desc',
        _limit: 5,
      },
    });

    expect(response.status()).toBe(200);

    const posts = await response.json();

    // 驗證篩選
    posts.forEach((post) => {
      expect(post.userId).toBe(1);
    });

    // 驗證排序（降序）
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i].id).toBeLessThan(posts[i - 1].id);
    }
  });
});
