/**
 * 录制「财务对账」操作演示动图
 *
 * 流程：上传三个文件 → 配置列映射 → 开始对账 → 查看结果
 * 输出：docs/screenshots/demo-reconciliation.gif 以及结果页高清截图
 *
 * 运行前需先启动本地服务：node simple-server.js 3000
 * 用法：node scripts/capture-demo-gif.js
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const { PNG } = require('pngjs');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');

const BASE_URL = process.env.CAPTURE_URL || 'http://localhost:3000';
const OUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const DATA_DIR = path.join(__dirname, '..', 'docs', 'demo-data');

// 动图参数
const GIF_WIDTH = 1100;     // 缩放后宽度
const FRAME_DELAY = 500;    // 每帧停留毫秒
const GIF_COLORS = 256;     // 调色板颜色数（UI 文本建议 256）
const VIEWPORT = { width: 1440, height: 860 };

const BROWSER_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

function findBrowser() {
  for (const p of BROWSER_CANDIDATES) if (p && fs.existsSync(p)) return p;
  return null;
}

/**
 * 把 PNG buffer 缩放并转成 GIF 帧数据。
 *
 * 用盒式均值（box filter）而非最近邻 —— 最近邻会直接丢弃像素，
 * 文字笔画被砍掉一半后明显发虚；均值缩放相当于超采样，文字边缘平滑得多。
 */
function pngToGifFrame(buffer, targetWidth) {
  const png = PNG.sync.read(buffer);
  const scale = png.width / targetWidth;
  const w = targetWidth;
  const h = Math.round(png.height / scale);
  const rgba = new Uint8Array(w * h * 4);

  for (let y = 0; y < h; y++) {
    const sy0 = Math.floor(y * scale);
    const sy1 = Math.min(png.height, Math.max(sy0 + 1, Math.floor((y + 1) * scale)));
    for (let x = 0; x < w; x++) {
      const sx0 = Math.floor(x * scale);
      const sx1 = Math.min(png.width, Math.max(sx0 + 1, Math.floor((x + 1) * scale)));

      let r = 0, g = 0, b = 0, n = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        const rowOffset = sy * png.width;
        for (let sx = sx0; sx < sx1; sx++) {
          const i = (rowOffset + sx) * 4;
          r += png.data[i];
          g += png.data[i + 1];
          b += png.data[i + 2];
          n++;
        }
      }

      const di = (y * w + x) * 4;
      rgba[di] = r / n;
      rgba[di + 1] = g / n;
      rgba[di + 2] = b / n;
      rgba[di + 3] = 255;
    }
  }
  return { rgba, width: w, height: h };
}

(async () => {
  const exe = findBrowser();
  if (!exe) {
    console.error('未找到浏览器');
    process.exit(1);
  }

  const txnFile = path.join(DATA_DIR, '付款流水.xlsx');
  const invFile = path.join(DATA_DIR, '发票明细.xlsx');
  const rcpFile = path.join(DATA_DIR, '收据明细.xlsx');
  for (const f of [txnFile, invFile, rcpFile]) {
    if (!fs.existsSync(f)) {
      console.error('缺少演示数据:', f);
      console.error('请先运行: node scripts/generate-demo-data.js');
      process.exit(1);
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    executablePath: exe,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'],
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2, // 2 倍分辨率渲染，缩图时相当于超采样，文字更锐利
    locale: 'zh-CN',
  });

  const page = await context.newPage();
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) return route.continue();
    return route.abort();
  });

  // ---------- 帧采集 ----------
  const frames = [];
  let capturing = true;

  async function captureFrame() {
    if (!capturing) return;
    try {
      const buf = await page.screenshot({ type: 'png' });
      frames.push(buf);
    } catch { /* 页面切换瞬间可能失败，忽略 */ }
  }

  const steps = [];
  const step = (msg) => { steps.push(msg); console.log('  ·', msg); };

  console.log('开始录制对账演示...');
  console.log('');

  // 1. 打开对账页
  await page.goto(BASE_URL + '/reconciliation', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#root > *', { timeout: 15000 });
  await page.waitForTimeout(600);
  await captureFrame();
  step('打开财务对账页面');

  // 2. 依次上传三个文件（antd Dragger 内部是隐藏的 input[type=file]）
  const inputs = page.locator('input[type="file"]');
  await inputs.nth(0).setInputFiles(txnFile);
  await page.waitForTimeout(550);
  await captureFrame();
  step('上传付款流水.xlsx');

  await inputs.nth(1).setInputFiles(invFile);
  await page.waitForTimeout(550);
  await captureFrame();
  step('上传发票明细.xlsx');

  await inputs.nth(2).setInputFiles(rcpFile);
  await page.waitForTimeout(700);
  await captureFrame();
  step('上传收据明细.xlsx');

  // 3. 进入配置映射步骤
  const nextBtn = page.getByRole('button', { name: /下一步/ });
  await nextBtn.waitFor({ timeout: 10000 });
  await nextBtn.click();
  await page.waitForTimeout(900);
  await captureFrame();
  step('进入列映射配置（自动识别列名）');

  // 滚动展示映射与匹配参数
  await page.mouse.wheel(0, 320);
  await page.waitForTimeout(550);
  await captureFrame();

  await page.mouse.wheel(0, 320);
  await page.waitForTimeout(550);
  await captureFrame();
  step('核对匹配参数与列映射');

  // 4. 开始对账
  const runBtn = page.getByRole('button', { name: /开始对账/ });
  await runBtn.waitFor({ timeout: 10000 });
  await runBtn.scrollIntoViewIfNeeded();
  await runBtn.click();
  await page.waitForTimeout(1000);
  await captureFrame();
  step('点击开始对账');

  // 5. 结果页
  await page.waitForTimeout(900);
  await page.mouse.wheel(0, -400);
  await page.waitForTimeout(700);
  await captureFrame();
  step('查看匹配结果与统计');

  await page.mouse.wheel(0, 260);
  await page.waitForTimeout(800);
  await captureFrame();
  step('查看结果明细表格');

  // 结果页高清截图（2 倍分辨率单独截一张，用于 README 静态展示）
  await page.mouse.wheel(0, -600);
  await page.waitForTimeout(700);
  capturing = false;

  const resultShot = path.join(OUT_DIR, '08-reconciliation-result.png');
  await page.screenshot({ path: resultShot });
  console.log('');
  console.log('  结果页截图:', path.basename(resultShot));

  // 兜底：多补一帧结尾
  await page.waitForTimeout(300);

  await browser.close();

  // ---------- 编码 GIF ----------
  console.log('');
  console.log('编码动图，共', frames.length, '帧...');

  const gif = GIFEncoder();
  let size = null;

  for (let i = 0; i < frames.length; i++) {
    const frame = pngToGifFrame(frames[i], GIF_WIDTH);
    size = { width: frame.width, height: frame.height };
    const palette = quantize(frame.rgba, GIF_COLORS);
    const index = applyPalette(frame.rgba, palette);
    gif.writeFrame(index, frame.width, frame.height, { palette, delay: FRAME_DELAY });
  }

  gif.finish();
  const out = gif.bytes();
  const gifPath = path.join(OUT_DIR, 'demo-reconciliation.gif');
  fs.writeFileSync(gifPath, Buffer.from(out));

  console.log('');
  console.log('✅ 动图已生成:', gifPath);
  console.log('   帧数  :', frames.length);
  console.log('   尺寸  :', size.width + 'x' + size.height);
  console.log('   时长  :', Math.round((frames.length * FRAME_DELAY) / 1000) + ' 秒');
  console.log('   体积  :', Math.round(fs.statSync(gifPath).size / 1024) + ' KB');
})();
