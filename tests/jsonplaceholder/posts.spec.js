/**
 * JSONPlaceholder - Posts API 測試
 *
 * 測試 CRUD 操作：
 * - GET: 取得文章列表、單一文章
 * - POST: 建立新文章
 * - PUT: 更新文章
 * - DELETE: 刪除文章
 *
 * API 文件: https://jsonplaceholder.typicode.com/
 */
const { test, expect } = require('@playwright/test');
const { API } = require('../../api/endpoints');

const { baseURL, endpoints } = API.jsonplaceholder;

test.describe('Posts API - CRUD 操作', () => {
  test('GET /posts - 應取得所有文章列表', async ({ request }) => {
    // Act
    const response = await request.get(`${baseURL}${endpoints.posts}`);

    // Assert
    expect(response.status()).toBe(200);

    const posts = await response.json();
    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBe(100); // JSONPlaceholder 固定有 100 筆文章
  });

  test('GET /posts/:id - 應取得單一文章', async ({ request }) => {
    // Arrange
    const postId = 1;

    // Act
    const response = await request.get(`${baseURL}${endpoints.post(postId)}`);

    // Assert
    expect(response.status()).toBe(200);

    const post = await response.json();
    expect(post.id).toBe(postId);
    expect(post).toHaveProperty('title');
    expect(post).toHaveProperty('body');
    expect(post).toHaveProperty('userId');
  });

  test('GET /posts/:id - 不存在的文章應回傳 404', async ({ request }) => {
    // Arrange
    const invalidPostId = 99999;

    // Act
    const response = await request.get(`${baseURL}${endpoints.post(invalidPostId)}`);

    // Assert
    expect(response.status()).toBe(404);
  });

  test('POST /posts - 應成功建立新文章', async ({ request }) => {
    // Arrange
    const newPost = {
      title: 'Test Post Title',
      body: 'This is the test post body content.',
      userId: 1,
    };

    // Act
    const response = await request.post(`${baseURL}${endpoints.posts}`, {
      data: newPost,
    });

    // Assert
    expect(response.status()).toBe(201);

    const createdPost = await response.json();
    expect(createdPost.title).toBe(newPost.title);
    expect(createdPost.body).toBe(newPost.body);
    expect(createdPost.userId).toBe(newPost.userId);
    expect(createdPost).toHaveProperty('id'); // 應該有自動產生的 id
  });

  test('PUT /posts/:id - 應成功更新文章', async ({ request }) => {
    // Arrange
    const postId = 1;
    const updatedPost = {
      id: postId,
      title: 'Updated Title',
      body: 'Updated body content.',
      userId: 1,
    };

    // Act
    const response = await request.put(`${baseURL}${endpoints.post(postId)}`, {
      data: updatedPost,
    });

    // Assert
    expect(response.status()).toBe(200);

    const post = await response.json();
    expect(post.title).toBe(updatedPost.title);
    expect(post.body).toBe(updatedPost.body);
  });

  test('PATCH /posts/:id - 應成功部分更新文章', async ({ request }) => {
    // Arrange
    const postId = 1;
    const partialUpdate = {
      title: 'Partially Updated Title',
    };

    // Act
    const response = await request.patch(`${baseURL}${endpoints.post(postId)}`, {
      data: partialUpdate,
    });

    // Assert
    expect(response.status()).toBe(200);

    const post = await response.json();
    expect(post.title).toBe(partialUpdate.title);
  });

  test('DELETE /posts/:id - 應成功刪除文章', async ({ request }) => {
    // Arrange
    const postId = 1;

    // Act
    const response = await request.delete(`${baseURL}${endpoints.post(postId)}`);

    // Assert
    expect(response.status()).toBe(200);
  });
});

test.describe('Posts API - 關聯查詢', () => {
  test('GET /posts/:id/comments - 應取得文章的所有留言', async ({ request }) => {
    // Arrange
    const postId = 1;

    // Act
    const response = await request.get(`${baseURL}${endpoints.postComments(postId)}`);

    // Assert
    expect(response.status()).toBe(200);

    const comments = await response.json();
    expect(Array.isArray(comments)).toBe(true);
    expect(comments.length).toBeGreaterThan(0);

    // 驗證每個留言都屬於該文章
    comments.forEach((comment) => {
      expect(comment.postId).toBe(postId);
    });
  });
});
