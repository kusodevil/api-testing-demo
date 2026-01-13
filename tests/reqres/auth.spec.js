/**
 * ReqRes - 認證 API 測試
 *
 * 測試登入和註冊功能
 *
 * API 文件: https://reqres.in/
 */
const { test, expect } = require('@playwright/test');
const { API } = require('../../api/endpoints');

const { baseURL, endpoints } = API.reqres;

// ReqRes 需要的 headers
const headers = {
  'Content-Type': 'application/json',
  'x-api-key': 'reqres-free-v1',
};

test.describe('認證 API - 註冊', () => {
  test('POST /register - 有效資料應成功註冊', async ({ request }) => {
    // Arrange - ReqRes 只接受特定的 email
    const validUser = {
      email: 'eve.holt@reqres.in',
      password: 'pistol',
    };

    // Act
    const response = await request.post(`${baseURL}${endpoints.register}`, {
      data: validUser,
      headers,
    });

    // Assert
    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('token');
  });

  test('POST /register - 缺少密碼應回傳錯誤', async ({ request }) => {
    // Arrange
    const invalidUser = {
      email: 'eve.holt@reqres.in',
      // 缺少 password
    };

    // Act
    const response = await request.post(`${baseURL}${endpoints.register}`, {
      data: invalidUser,
      headers,
    });

    // Assert
    expect(response.status()).toBe(400);

    const result = await response.json();
    expect(result.error).toBe('Missing password');
  });

  test('POST /register - 缺少 email 應回傳錯誤', async ({ request }) => {
    // Arrange
    const invalidUser = {
      password: 'pistol',
      // 缺少 email
    };

    // Act
    const response = await request.post(`${baseURL}${endpoints.register}`, {
      data: invalidUser,
      headers,
    });

    // Assert
    expect(response.status()).toBe(400);

    const result = await response.json();
    expect(result.error).toBe('Missing email or username');
  });
});

test.describe('認證 API - 登入', () => {
  test('POST /login - 有效帳密應成功登入', async ({ request }) => {
    // Arrange
    const validCredentials = {
      email: 'eve.holt@reqres.in',
      password: 'cityslicka',
    };

    // Act
    const response = await request.post(`${baseURL}${endpoints.login}`, {
      data: validCredentials,
      headers,
    });

    // Assert
    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result).toHaveProperty('token');
    expect(typeof result.token).toBe('string');
  });

  test('POST /login - 缺少密碼應回傳錯誤', async ({ request }) => {
    // Arrange
    const invalidCredentials = {
      email: 'eve.holt@reqres.in',
      // 缺少 password
    };

    // Act
    const response = await request.post(`${baseURL}${endpoints.login}`, {
      data: invalidCredentials,
      headers,
    });

    // Assert
    expect(response.status()).toBe(400);

    const result = await response.json();
    expect(result.error).toBe('Missing password');
  });

  test('POST /login - 無效帳號應回傳錯誤', async ({ request }) => {
    // Arrange
    const invalidCredentials = {
      email: 'invalid@example.com',
      password: 'somepassword',
    };

    // Act
    const response = await request.post(`${baseURL}${endpoints.login}`, {
      data: invalidCredentials,
      headers,
    });

    // Assert
    expect(response.status()).toBe(400);

    const result = await response.json();
    expect(result.error).toBe('user not found');
  });
});
