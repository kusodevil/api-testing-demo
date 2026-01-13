# API Testing Demo

一個使用 Playwright 進行 API 自動化測試的展示專案，涵蓋 RESTful API 與 Swagger API 的完整測試範例。

## 專案簡介

本專案展示如何使用 Playwright Test 框架進行 API 測試，包含：

- **RESTful API 測試** - 針對 JSONPlaceholder 和 ReqRes 服務
- **Swagger API 測試** - 針對 PetStore Swagger 範例 API
- **進階測試類型** - 效能、安全性、併發、E2E 等完整測試範例

## 技術棧

- **測試框架**: Playwright Test v1.57.0
- **報告工具**: Playwright HTML Report + Allure Reporter
- **通知整合**: Slack Webhook
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
│   ├── petstore/
│   │   ├── pet.spec.js           # Pet API 測試
│   │   └── store.spec.js         # Store API 測試
│   └── advanced/                 # 進階測試範例
│       ├── boundary.spec.js      # 邊界測試
│       ├── field-validation.spec.js    # 欄位驗證
│       ├── schema-validation.spec.js   # Schema 驗證
│       ├── pagination.spec.js    # 分頁測試
│       ├── sorting-filtering.spec.js   # 排序篩選
│       ├── performance.spec.js   # 效能測試
│       ├── security.spec.js      # 安全性測試
│       ├── error-handling.spec.js      # 錯誤處理
│       ├── idempotency.spec.js   # 冪等性測試
│       ├── concurrency.spec.js   # 併發測試
│       ├── timeout-retry.spec.js # 超時與重試
│       ├── http-headers.spec.js  # HTTP Headers
│       ├── data-integrity.spec.js      # 資料完整性
│       └── e2e-crud.spec.js      # E2E CRUD 流程
├── utils/
│   └── slack-notify.js           # Slack 通知工具
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

## 測試類型涵蓋

### 基礎測試
| 類型 | 檔案 | 說明 |
|------|------|------|
| 正向測試 | `posts.spec.js` 等 | 成功操作驗證 |
| 反向測試 | `error-handling.spec.js` | 錯誤處理與異常情況 |

### 進階測試
| 類型 | 檔案 | 說明 |
|------|------|------|
| 邊界測試 | `boundary.spec.js` | 空值、極端值、特殊字元 |
| 欄位驗證 | `field-validation.spec.js` | 必要欄位、資料型別 |
| Schema 驗證 | `schema-validation.spec.js` | JSON 結構驗證 |
| 分頁測試 | `pagination.spec.js` | 分頁功能驗證 |
| 排序篩選 | `sorting-filtering.spec.js` | 排序、篩選、組合查詢 |
| 效能測試 | `performance.spec.js` | 回應時間、負載測試 |
| 安全性測試 | `security.spec.js` | SQL Injection、XSS、認證 |
| 冪等性測試 | `idempotency.spec.js` | GET/PUT/DELETE 冪等性 |
| 併發測試 | `concurrency.spec.js` | 並行請求、Race Condition |
| 超時與重試 | `timeout-retry.spec.js` | 超時處理、指數退避 |
| HTTP Headers | `http-headers.spec.js` | Content-Type、CORS、Cache |
| 資料完整性 | `data-integrity.spec.js` | 一致性、關聯資料 |
| E2E 流程 | `e2e-crud.spec.js` | 完整 CRUD 流程測試 |

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

# 執行進階測試
npm run test:advanced
```

### 查看報告

```bash
npm run report
```

## Slack 通知整合

專案支援測試完成後發送 Slack 通知。

### 設定方式

1. 在 Slack 建立 Incoming Webhook
2. 設定環境變數：
   ```bash
   export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
   ```

3. 執行測試並發送通知：
   ```bash
   npm run test:notify
   ```

### 通知內容

- 測試執行結果（通過/失敗數量）
- 執行時間
- 失敗測試的詳細資訊
- 報告連結

## 報告工具

專案整合兩種報告工具：

1. **Playwright HTML Report** - 提供測試結果視覺化
2. **Allure Report** - 提供詳細的測試歷史與趨勢分析

### 產生 Allure 報告

```bash
# 產生報告
npx allure generate allure-results -o allure-report --clean

# 開啟報告
npx allure open allure-report
```

## CI/CD 整合

專案已支援 CI 環境執行，可透過以下環境變數調整行為：

| 變數 | 說明 |
|------|------|
| `CI` | 設為 `true` 時啟用 CI 模式（重試 2 次、單一 worker） |
| `SLACK_WEBHOOK_URL` | Slack 通知的 Webhook URL |

### GitHub Actions 範例

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - name: Notify Slack
        if: always()
        run: npm run test:notify
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## 授權

MIT License
