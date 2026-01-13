/**
 * PetStore - Pet API 測試
 *
 * Swagger 範例 API - 寵物相關操作
 *
 * API 文件: https://petstore.swagger.io/
 */
const { test, expect } = require('@playwright/test');
const { API } = require('../../api/endpoints');

const { baseURL, endpoints } = API.petstore;

// 產生唯一的寵物 ID
const generatePetId = () => Math.floor(Math.random() * 1000000) + Date.now();

test.describe('Pet API - CRUD 操作', () => {
  let testPetId;

  test.beforeAll(() => {
    testPetId = generatePetId();
  });

  test('POST /pet - 應成功新增寵物', async ({ request }) => {
    // Arrange
    const newPet = {
      id: testPetId,
      name: 'Test Dog',
      category: {
        id: 1,
        name: 'Dogs',
      },
      photoUrls: ['https://example.com/photo.jpg'],
      tags: [
        {
          id: 1,
          name: 'friendly',
        },
      ],
      status: 'available',
    };

    // Act
    const response = await request.post(`${baseURL}${endpoints.pet}`, {
      data: newPet,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Assert
    expect(response.status()).toBe(200);

    const pet = await response.json();
    expect(pet.id).toBe(testPetId);
    expect(pet.name).toBe(newPet.name);
    expect(pet.status).toBe(newPet.status);
  });

  test('GET /pet/:id - 應取得寵物資料', async ({ request }) => {
    // Act
    const response = await request.get(`${baseURL}${endpoints.petById(testPetId)}`);

    // Assert
    expect(response.status()).toBe(200);

    const pet = await response.json();
    expect(pet.id).toBe(testPetId);
    expect(pet).toHaveProperty('name');
    expect(pet).toHaveProperty('status');
  });

  test('PUT /pet - 應成功更新寵物資料', async ({ request }) => {
    // Arrange
    const updatedPet = {
      id: testPetId,
      name: 'Updated Dog Name',
      category: {
        id: 1,
        name: 'Dogs',
      },
      photoUrls: ['https://example.com/new-photo.jpg'],
      tags: [
        {
          id: 1,
          name: 'playful',
        },
      ],
      status: 'sold',
    };

    // Act
    const response = await request.put(`${baseURL}${endpoints.pet}`, {
      data: updatedPet,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Assert
    expect(response.status()).toBe(200);

    const pet = await response.json();
    expect(pet.name).toBe(updatedPet.name);
    expect(pet.status).toBe(updatedPet.status);
  });

  test('DELETE /pet/:id - 應成功刪除寵物', async ({ request }) => {
    // Act
    const response = await request.delete(`${baseURL}${endpoints.petById(testPetId)}`);

    // Assert
    expect(response.status()).toBe(200);
  });

  test('GET /pet/:id - 刪除後應找不到寵物', async ({ request }) => {
    // Act
    const response = await request.get(`${baseURL}${endpoints.petById(testPetId)}`);

    // Assert
    expect(response.status()).toBe(404);
  });
});

test.describe('Pet API - 狀態查詢', () => {
  test('GET /pet/findByStatus - 應取得 available 狀態的寵物', async ({ request }) => {
    // Act
    const response = await request.get(`${baseURL}${endpoints.petByStatus}`, {
      params: { status: 'available' },
    });

    // Assert
    expect(response.status()).toBe(200);

    const pets = await response.json();
    expect(Array.isArray(pets)).toBe(true);

    // 驗證所有寵物都是 available 狀態
    pets.forEach((pet) => {
      expect(pet.status).toBe('available');
    });
  });

  test('GET /pet/findByStatus - 應取得 pending 狀態的寵物', async ({ request }) => {
    // Act
    const response = await request.get(`${baseURL}${endpoints.petByStatus}`, {
      params: { status: 'pending' },
    });

    // Assert
    expect(response.status()).toBe(200);

    const pets = await response.json();
    expect(Array.isArray(pets)).toBe(true);
  });

  test('GET /pet/findByStatus - 應取得 sold 狀態的寵物', async ({ request }) => {
    // Act
    const response = await request.get(`${baseURL}${endpoints.petByStatus}`, {
      params: { status: 'sold' },
    });

    // Assert
    expect(response.status()).toBe(200);

    const pets = await response.json();
    expect(Array.isArray(pets)).toBe(true);
  });
});
