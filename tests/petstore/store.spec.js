/**
 * PetStore - Store API 測試
 *
 * 商店訂單相關操作
 *
 * API 文件: https://petstore.swagger.io/
 */
const { test, expect } = require('@playwright/test');
const { API } = require('../../api/endpoints');

const { baseURL, endpoints } = API.petstore;

test.describe('Store API - 庫存查詢', () => {
  test('GET /store/inventory - 應取得庫存狀態', async ({ request }) => {
    // Act
    const response = await request.get(`${baseURL}${endpoints.store}`);

    // Assert
    expect(response.status()).toBe(200);

    const inventory = await response.json();
    expect(typeof inventory).toBe('object');
    // 庫存會有不同狀態的數量，如 available, pending, sold
  });
});

test.describe('Store API - 訂單操作', () => {
  let testOrderId;

  test.beforeAll(() => {
    testOrderId = Math.floor(Math.random() * 10) + 1; // PetStore 訂單 ID 範圍較小
  });

  test('POST /store/order - 應成功建立訂單', async ({ request }) => {
    // Arrange
    const newOrder = {
      id: testOrderId,
      petId: 1,
      quantity: 1,
      shipDate: new Date().toISOString(),
      status: 'placed',
      complete: false,
    };

    // Act
    const response = await request.post(`${baseURL}${endpoints.order}`, {
      data: newOrder,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Assert
    expect(response.status()).toBe(200);

    const order = await response.json();
    expect(order.id).toBe(testOrderId);
    expect(order.status).toBe('placed');
  });

  test('GET /store/order/:id - 應取得訂單資料', async ({ request }) => {
    // Act
    const response = await request.get(`${baseURL}${endpoints.orderById(testOrderId)}`);

    // Assert
    expect(response.status()).toBe(200);

    const order = await response.json();
    expect(order.id).toBe(testOrderId);
    expect(order).toHaveProperty('petId');
    expect(order).toHaveProperty('quantity');
    expect(order).toHaveProperty('status');
  });

  test('DELETE /store/order/:id - 應成功刪除訂單', async ({ request }) => {
    // Act
    const response = await request.delete(`${baseURL}${endpoints.orderById(testOrderId)}`);

    // Assert
    expect(response.status()).toBe(200);
  });

  test('GET /store/order/:id - 不存在的訂單應回傳 404', async ({ request }) => {
    // Arrange
    const invalidOrderId = 99999;

    // Act
    const response = await request.get(`${baseURL}${endpoints.orderById(invalidOrderId)}`);

    // Assert
    expect(response.status()).toBe(404);
  });
});
