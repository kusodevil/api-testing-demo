/**
 * 欄位與資料型別驗證測試
 *
 * 驗證 API 回傳的資料：
 * - 必要欄位是否存在
 * - 欄位資料型別是否正確
 * - 欄位格式是否符合預期（如 Email 格式）
 */
const { test, expect } = require('@playwright/test');
const { API } = require('../../api/endpoints');

test.describe('欄位驗證 - JSONPlaceholder Posts', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('Post 應包含所有必要欄位', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`);
    const post = await response.json();

    // 驗證必要欄位存在
    expect(post).toHaveProperty('id');
    expect(post).toHaveProperty('userId');
    expect(post).toHaveProperty('title');
    expect(post).toHaveProperty('body');
  });

  test('Post 欄位型別應正確', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`);
    const post = await response.json();

    // 驗證欄位型別
    expect(typeof post.id).toBe('number');
    expect(typeof post.userId).toBe('number');
    expect(typeof post.title).toBe('string');
    expect(typeof post.body).toBe('string');
  });

  test('Post id 應為正整數', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`);
    const post = await response.json();

    expect(post.id).toBeGreaterThan(0);
    expect(Number.isInteger(post.id)).toBe(true);
  });

  test('Post title 不應為空字串', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.post(1)}`);
    const post = await response.json();

    expect(post.title.length).toBeGreaterThan(0);
    expect(post.title.trim()).not.toBe('');
  });
});

test.describe('欄位驗證 - JSONPlaceholder Users', () => {
  const { baseURL, endpoints } = API.jsonplaceholder;

  test('User 應包含所有必要欄位', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.user(1)}`);
    const user = await response.json();

    // 基本欄位
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('username');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('phone');
    expect(user).toHaveProperty('website');

    // 巢狀物件
    expect(user).toHaveProperty('address');
    expect(user).toHaveProperty('company');
  });

  test('User 巢狀物件 address 應包含完整欄位', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.user(1)}`);
    const user = await response.json();

    expect(user.address).toHaveProperty('street');
    expect(user.address).toHaveProperty('suite');
    expect(user.address).toHaveProperty('city');
    expect(user.address).toHaveProperty('zipcode');
    expect(user.address).toHaveProperty('geo');
    expect(user.address.geo).toHaveProperty('lat');
    expect(user.address.geo).toHaveProperty('lng');
  });

  test('User 巢狀物件 company 應包含完整欄位', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.user(1)}`);
    const user = await response.json();

    expect(user.company).toHaveProperty('name');
    expect(user.company).toHaveProperty('catchPhrase');
    expect(user.company).toHaveProperty('bs');
  });

  test('User email 格式應正確', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.user(1)}`);
    const user = await response.json();

    // Email 格式驗證（基本正則）
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(user.email).toMatch(emailRegex);
  });

  test('User 地理座標應為有效數值', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.user(1)}`);
    const user = await response.json();

    const lat = parseFloat(user.address.geo.lat);
    const lng = parseFloat(user.address.geo.lng);

    // 緯度範圍 -90 到 90
    expect(lat).toBeGreaterThanOrEqual(-90);
    expect(lat).toBeLessThanOrEqual(90);

    // 經度範圍 -180 到 180
    expect(lng).toBeGreaterThanOrEqual(-180);
    expect(lng).toBeLessThanOrEqual(180);
  });
});

test.describe('欄位驗證 - PetStore Pet', () => {
  const { baseURL, endpoints } = API.petstore;

  test('Pet 狀態查詢結果欄位應完整', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.petByStatus}`, {
      params: { status: 'available' },
    });
    const pets = await response.json();

    // 至少要有一筆資料才能驗證
    if (pets.length > 0) {
      const pet = pets[0];

      expect(pet).toHaveProperty('id');
      expect(pet).toHaveProperty('name');
      expect(pet).toHaveProperty('status');
    }
  });

  test('Pet 狀態值應為有效值', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.petByStatus}`, {
      params: { status: 'available' },
    });
    const pets = await response.json();

    const validStatuses = ['available', 'pending', 'sold'];

    pets.forEach((pet) => {
      expect(validStatuses).toContain(pet.status);
    });
  });

  test('Pet id 應為正數', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.petByStatus}`, {
      params: { status: 'available' },
    });
    const pets = await response.json();

    pets.slice(0, 10).forEach((pet) => {
      expect(pet.id).toBeGreaterThan(0);
    });
  });
});

test.describe('欄位驗證 - ReqRes Users', () => {
  const { baseURL, endpoints } = API.reqres;
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': 'reqres-free-v1',
  };

  test('User 列表應包含分頁資訊', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.users}`, {
      headers,
      params: { page: 1 },
    });

    if (response.status() === 200) {
      const data = await response.json();

      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('per_page');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('total_pages');
      expect(data).toHaveProperty('data');
    }
  });

  test('User 資料欄位應完整', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.users}`, {
      headers,
      params: { page: 1 },
    });

    if (response.status() === 200) {
      const result = await response.json();

      if (result.data && result.data.length > 0) {
        const user = result.data[0];

        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('first_name');
        expect(user).toHaveProperty('last_name');
        expect(user).toHaveProperty('avatar');
      }
    }
  });

  test('User avatar 應為有效 URL', async ({ request }) => {
    const response = await request.get(`${baseURL}${endpoints.users}`, {
      headers,
      params: { page: 1 },
    });

    if (response.status() === 200) {
      const result = await response.json();

      if (result.data && result.data.length > 0) {
        const user = result.data[0];
        const urlRegex = /^https?:\/\/.+/;
        expect(user.avatar).toMatch(urlRegex);
      }
    }
  });
});
