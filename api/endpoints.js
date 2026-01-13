/**
 * API Endpoints 設定
 *
 * 集中管理所有 API 的 base URL 和 endpoints
 */

const API = {
  // JSONPlaceholder - 假資料 API
  jsonplaceholder: {
    baseURL: 'https://jsonplaceholder.typicode.com',
    endpoints: {
      posts: '/posts',
      post: (id) => `/posts/${id}`,
      users: '/users',
      user: (id) => `/users/${id}`,
      comments: '/comments',
      postComments: (postId) => `/posts/${postId}/comments`,
    },
  },

  // ReqRes - 用戶認證 API
  reqres: {
    baseURL: 'https://reqres.in/api',
    endpoints: {
      users: '/users',
      user: (id) => `/users/${id}`,
      register: '/register',
      login: '/login',
    },
  },

  // PetStore - Swagger 範例 API
  petstore: {
    baseURL: 'https://petstore.swagger.io/v2',
    endpoints: {
      pet: '/pet',
      petById: (id) => `/pet/${id}`,
      petByStatus: '/pet/findByStatus',
      store: '/store/inventory',
      order: '/store/order',
      orderById: (id) => `/store/order/${id}`,
      user: '/user',
      userByUsername: (username) => `/user/${username}`,
      userLogin: '/user/login',
    },
  },
};

module.exports = { API };
