/**
 * JSONPlaceholder - Users API 測試
 *
 * 測試用戶相關 API
 *
 * API 文件: https://jsonplaceholder.typicode.com/
 */
const { test, expect } = require('@playwright/test');
const { API } = require('../../api/endpoints');

const { baseURL, endpoints } = API.jsonplaceholder;

test.describe('Users API', () => {
  test('GET /users - 應取得所有用戶列表', async ({ request }) => {
    // Act
    const response = await request.get(`${baseURL}${endpoints.users}`);

    // Assert
    expect(response.status()).toBe(200);

    const users = await response.json();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBe(10); // JSONPlaceholder 固定有 10 個用戶
  });

  test('GET /users/:id - 應取得單一用戶詳細資料', async ({ request }) => {
    // Arrange
    const userId = 1;

    // Act
    const response = await request.get(`${baseURL}${endpoints.user(userId)}`);

    // Assert
    expect(response.status()).toBe(200);

    const user = await response.json();
    expect(user.id).toBe(userId);
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('username');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('address');
    expect(user).toHaveProperty('phone');
    expect(user).toHaveProperty('website');
    expect(user).toHaveProperty('company');
  });

  test('GET /users/:id - 用戶資料結構應正確', async ({ request }) => {
    // Arrange
    const userId = 1;

    // Act
    const response = await request.get(`${baseURL}${endpoints.user(userId)}`);
    const user = await response.json();

    // Assert - 驗證 address 結構
    expect(user.address).toHaveProperty('street');
    expect(user.address).toHaveProperty('suite');
    expect(user.address).toHaveProperty('city');
    expect(user.address).toHaveProperty('zipcode');
    expect(user.address).toHaveProperty('geo');
    expect(user.address.geo).toHaveProperty('lat');
    expect(user.address.geo).toHaveProperty('lng');

    // Assert - 驗證 company 結構
    expect(user.company).toHaveProperty('name');
    expect(user.company).toHaveProperty('catchPhrase');
    expect(user.company).toHaveProperty('bs');
  });

  test('GET /users/:id - 不存在的用戶應回傳 404', async ({ request }) => {
    // Arrange
    const invalidUserId = 99999;

    // Act
    const response = await request.get(`${baseURL}${endpoints.user(invalidUserId)}`);

    // Assert
    expect(response.status()).toBe(404);
  });
});
