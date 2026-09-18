/**
 * 生成应用界面截图（用于 README 展示）
 *
 * 使用系统自带的 Chrome/Edge，无需下载浏览器。
 * 运行前需先启动本地服务：node simple-server.js 3000
 *
 * 用法：node scripts/capture-screenshots.js
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const BASE_URL = process.env.CAPTURE_URL || 'http://localhost:3000';
const OUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const VIEWPORT = { width: 1440, height: 900 };

// 候选浏览器路径（优先 Chrome，其次 Edge）
const BROWSER_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

function findBrowser() {
  for (const p of BROWSER_CANDIDATES) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

const PAGES = [
  { path: '/', name: '01-dashboard', label: '工作台', wait: 1200 },
  { path: '/ledger', name: '02-ledger', label: '台账管理', wait: 1000 },
  { path: '/invoice', name: '03-invoice', label: '票据管理', wait: 1000 },
  { path: '/reconciliation', name: '04-reconciliation', label: '财务对账', wait: 1000 },
  { path: '/report', name: '05-report', label: '报表中心', wait: 3000 }, // 图表渲染需要时间
  { path: '/settings', name: '06-settings', label: '系统设置', wait: 1000 },
];

(async () => {
  const exe = findBrowser();
  if (!exe) {
    console.error('未找到 Chrome 或 Edge 浏览器');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('浏览器:', exe);
  console.log('目标  :', BASE_URL);
  console.log('输出  :', OUT_DIR);
  console.log('');

  const browser = await chromium.launch({
    executablePath: exe,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=2'],
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2, // 2 倍分辨率，README 里更清晰
    locale: 'zh-CN',
  });

  const page = await context.newPage();

  // 屏蔽外部字体请求，避免网络干扰导致截图卡住
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
      return route.continue();
    }
    return route.abort();
  });

  const results = [];

  for (const p of PAGES) {
    const url = BASE_URL + p.path;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // 等待 React 渲染出内容
      await page.waitForSelector('#root > *', { timeout: 15000 });
      await page.waitForTimeout(p.wait);

      const file = path.join(OUT_DIR, p.name + '.png');
      await page.screenshot({ path: file, fullPage: false });

      const size = fs.statSync(file).size;
      results.push({ label: p.label, file: p.name + '.png', ok: true, size });
      console.log('  ✅', p.label.padEnd(10), p.name + '.png', Math.round(size / 1024) + ' KB');
    } catch (e) {
      results.push({ label: p.label, ok: false, error: e.message });
      console.log('  ❌', p.label.padEnd(10), e.message.split('\n')[0]);
    }
  }

  // 额外：对账页面展开到「配置映射」步骤，展示核心功能
  try {
    await page.goto(BASE_URL + '/reconciliation', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root > *', { timeout: 15000 });
    await page.waitForTimeout(800);
    const file = path.join(OUT_DIR, '07-reconciliation-steps.png');
    await page.screenshot({ path: file });
    results.push({ label: '对账流程', file: '07-reconciliation-steps.png', ok: true, size: fs.statSync(file).size });
    console.log('  ✅', '对账流程'.padEnd(8), '07-reconciliation-steps.png');
  } catch (e) {
    console.log('  ❌', '对账流程', e.message.split('\n')[0]);
  }

  await browser.close();

  const ok = results.filter((r) => r.ok).length;
  console.log('');
  console.log(`完成：${ok}/${results.length} 张截图生成成功`);
  process.exit(ok > 0 ? 0 : 1);
})();
