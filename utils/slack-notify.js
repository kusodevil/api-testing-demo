/**
 * Slack 通知工具
 *
 * 發送測試結果到 Slack 頻道
 *
 * 使用方式：
 * 1. 設定環境變數 SLACK_WEBHOOK_URL
 * 2. 執行 node utils/slack-notify.js [json-result-file]
 */

const fs = require('fs');
const path = require('path');

// Slack Webhook URL
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

/**
 * 解析 Playwright JSON 報告
 */
function parseTestResults(resultFile) {
  try {
    if (fs.existsSync(resultFile)) {
      const data = JSON.parse(fs.readFileSync(resultFile, 'utf-8'));
      return data;
    }
  } catch (error) {
    console.error('無法解析測試結果檔案:', error.message);
  }
  return null;
}

/**
 * 從測試輸出解析結果
 */
function parseFromOutput(output) {
  const passedMatch = output.match(/(\d+) passed/);
  const failedMatch = output.match(/(\d+) failed/);
  const skippedMatch = output.match(/(\d+) skipped/);
  const timeMatch = output.match(/\((\d+\.?\d*)s\)/);

  return {
    passed: passedMatch ? parseInt(passedMatch[1], 10) : 0,
    failed: failedMatch ? parseInt(failedMatch[1], 10) : 0,
    skipped: skippedMatch ? parseInt(skippedMatch[1], 10) : 0,
    duration: timeMatch ? parseFloat(timeMatch[1]) : 0,
  };
}

/**
 * 建立 Slack 訊息
 */
function createSlackMessage(results, options = {}) {
  const { passed, failed, skipped, duration } = results;
  const total = passed + failed + skipped;
  const status = failed > 0 ? 'failure' : 'success';
  const emoji = failed > 0 ? ':x:' : ':white_check_mark:';
  const color = failed > 0 ? '#dc3545' : '#28a745';

  const projectName = options.projectName || 'API Testing Demo';
  const branch = options.branch || process.env.GITHUB_REF_NAME || 'main';
  const runUrl = options.runUrl || process.env.GITHUB_SERVER_URL
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null;

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${projectName} - 測試結果`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*狀態:*\n${status === 'success' ? '通過 :tada:' : '失敗 :warning:'}`,
        },
        {
          type: 'mrkdwn',
          text: `*分支:*\n\`${branch}\``,
        },
        {
          type: 'mrkdwn',
          text: `*通過:*\n${passed} 個測試`,
        },
        {
          type: 'mrkdwn',
          text: `*失敗:*\n${failed} 個測試`,
        },
        {
          type: 'mrkdwn',
          text: `*跳過:*\n${skipped} 個測試`,
        },
        {
          type: 'mrkdwn',
          text: `*執行時間:*\n${duration.toFixed(1)} 秒`,
        },
      ],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `總測試數: ${total} | 通過率: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`,
        },
      ],
    },
  ];

  // 如果有執行 URL，加入按鈕
  if (runUrl) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '查看詳細報告',
            emoji: true,
          },
          url: runUrl,
          style: 'primary',
        },
      ],
    });
  }

  return {
    attachments: [
      {
        color,
        blocks,
      },
    ],
  };
}

/**
 * 發送 Slack 通知
 */
async function sendSlackNotification(message) {
  if (!SLACK_WEBHOOK_URL) {
    console.error('錯誤: SLACK_WEBHOOK_URL 環境變數未設定');
    console.log('請設定: export SLACK_WEBHOOK_URL="your-webhook-url"');
    return false;
  }

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (response.ok) {
      console.log('Slack 通知發送成功!');
      return true;
    } else {
      console.error('Slack 通知發送失敗:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('發送 Slack 通知時發生錯誤:', error.message);
    return false;
  }
}

/**
 * 主程式
 */
async function main() {
  // 從命令列參數或標準輸入取得測試結果
  const args = process.argv.slice(2);

  let results;

  if (args.length > 0 && fs.existsSync(args[0])) {
    // 從檔案讀取
    const data = parseTestResults(args[0]);
    if (data) {
      results = {
        passed: data.stats?.expected || 0,
        failed: data.stats?.unexpected || 0,
        skipped: data.stats?.skipped || 0,
        duration: (data.stats?.duration || 0) / 1000,
      };
    }
  } else if (process.env.TEST_PASSED !== undefined) {
    // 從環境變數讀取
    results = {
      passed: parseInt(process.env.TEST_PASSED || '0', 10),
      failed: parseInt(process.env.TEST_FAILED || '0', 10),
      skipped: parseInt(process.env.TEST_SKIPPED || '0', 10),
      duration: parseFloat(process.env.TEST_DURATION || '0'),
    };
  } else {
    // 使用預設值（用於測試）
    console.log('使用預設測試結果（可透過環境變數或檔案傳入實際結果）');
    results = {
      passed: 239,
      failed: 0,
      skipped: 0,
      duration: 24.4,
    };
  }

  console.log('測試結果:', results);

  const message = createSlackMessage(results);
  await sendSlackNotification(message);
}

// 匯出函數供其他模組使用
module.exports = {
  parseTestResults,
  parseFromOutput,
  createSlackMessage,
  sendSlackNotification,
};

// 如果直接執行此檔案
if (require.main === module) {
  main().catch(console.error);
}
