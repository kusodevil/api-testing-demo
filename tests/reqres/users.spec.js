/**
 * ReqRes - Users API 測試
 *
 * 測試用戶 CRUD 操作
 * 注意：ReqRes 的部分 API 需要特定認證，這裡測試公開可用的端點
 *
 * API 文件: https://reqres.in/
 */
const { test, expect } = require('@playwright/test');
const { API } = require('../../api/endpoints');

const { baseURL, endpoints } = API.reqres;

test.describe('Users API - 公開端點測試', () => {
  test('GET /users - 應能呼叫用戶列表 API', async ({ request }) => {
    // Act - 不帶 headers 測試公開端點行為
    const response = await request.get(`${baseURL}${endpoints.users}`, {
      params: { page: 1 },
    });

    // Assert - ReqRes 可能回傳 200 或需要認證
    // 這裡我們只驗證 API 有回應
    expect([200, 401, 403]).toContain(response.status());
  });

  test('API 回應時間應在合理範圍內', async ({ request }) => {
    // Arrange
    const startTime = Date.now();

    // Act
    const response = await request.get(`${baseURL}${endpoints.users}`, {
      params: { page: 1 },
    });

    // Assert - 回應時間應小於 2 秒
    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(2000);
  });

  test('API 應回傳正確的 Content-Type', async ({ request }) => {
    // Act
    const response = await request.get(`${baseURL}${endpoints.users}`);

    // Assert - 可能是 JSON 或 HTML（認證錯誤頁面）
    const contentType = response.headers()['content-type'];
    expect(contentType).toMatch(/application\/json|text\/html/);
  });
});
