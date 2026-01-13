# API Testing Demo

一個使用 Playwright 進行 API 自動化測試的展示專案，涵蓋 RESTful API 與 Swagger API 的完整測試範例。

## 專案簡介

本專案展示如何使用 Playwright Test 框架進行 API 測試，包含：

- **RESTful API 測試** - 針對 JSONPlaceholder 和 ReqRes 服務
- **Swagger API 測試** - 針對 PetStore Swagger 範例 API

## 技術棧

- **測試框架**: Playwright Test v1.57.0
- **報告工具**: Playwright HTML Report + Allure Reporter
- **執行環境**: Node.js

## 專案結構

```
api-testing-demo/
├── api/
│   └── endpoints.js              # API 端點集中配置
├── tests/
│   ├── jsonplaceholder/
│   │   ├── posts.spec.js         # Posts CRUD 測試
│   │   └── users.spec.js         # Users API 測試
│   ├── reqres/
│   │   ├── auth.spec.js          # 認證 API 測試
│   │   └── users.spec.js         # Users API 測試
│   └── petstore/
│       ├── pet.spec.js           # Pet API 測試
│       └── store.spec.js         # Store API 測試
├── playwright.config.js          # Playwright 配置
└── package.json
```

## 測試的 API 服務

### 1. JSONPlaceholder (RESTful)

模擬的 REST API，用於測試 CRUD 操作。

| 測試項目 | 說明 |
|---------|------|
| Posts CRUD | 文章的新增、查詢、更新、刪除 |
| Users 查詢 | 用戶資料查詢與結構驗證 |
| 關聯查詢 | 文章留言的關聯資料查詢 |

### 2. ReqRes (RESTful)

提供認證功能的 REST API。

| 測試項目 | 說明 |
|---------|------|
| 註冊功能 | 成功註冊與錯誤處理 |
| 登入功能 | 成功登入與錯誤處理 |
| 公開端點 | API 可用性與效能驗證 |

### 3. PetStore (Swagger)

Swagger 官方範例 API，完整的商業應用模擬。

| 測試項目 | 說明 |
|---------|------|
| Pet CRUD | 寵物資料的完整 CRUD 操作 |
| 狀態查詢 | 依狀態篩選寵物 |
| 庫存管理 | 商店庫存查詢 |
| 訂單管理 | 訂單的新增、查詢、刪除 |

## 測試涵蓋範圍

- **HTTP 方法**: GET, POST, PUT, PATCH, DELETE
- **狀態碼驗證**: 200, 201, 400, 404
- **正向測試**: 成功操作驗證
- **負向測試**: 錯誤處理與邊界情況
- **效能測試**: 回應時間驗證
- **結構驗證**: JSON 資料結構與型別檢查

## 安裝與執行

### 安裝依賴

```bash
npm install
```

### 執行測試

```bash
# 執行所有測試
npm test

# 執行特定服務的測試
npm run test:jsonplaceholder
npm run test:reqres
npm run test:petstore
```

### 查看報告

```bash
npm run report
```

## 報告工具

專案整合兩種報告工具：

1. **Playwright HTML Report** - 提供測試結果視覺化
2. **Allure Report** - 提供詳細的測試歷史與趨勢分析

## 授權

MIT License
