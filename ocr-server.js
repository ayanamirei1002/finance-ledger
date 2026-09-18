/**
 * 财务台账管理系统 - 本地 OCR 服务
 *
 * 复用 Windows 内置 OCR 引擎（Windows.Media.Ocr），完全离线、无需 API Key。
 * 通过子进程调用 scripts/ocr-recognize.ps1 完成识别。
 *
 * 启动: node ocr-server.js [端口]        （默认 3100）
 *
 * 接口:
 *   GET  /health          -> { ok, engine, languages, uptimeMs }
 *   POST /ocr             -> { text, lines, lineCount, elapsedMs, language, ... }
 *        请求体二选一:
 *          a) JSON:  { "image": "<base64>", "mimeType": "image/png" }
 *          b) 原始二进制 + Content-Type: image/*
 */

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const PORT = Number(process.argv[2]) || Number(process.env.OCR_PORT) || 3100;
const ROOT_DIR = __dirname;
const PS_SCRIPT = path.join(ROOT_DIR, 'scripts', 'ocr-recognize.ps1');
const DEFAULT_LANGUAGE = 'zh-Hans-CN';
const MAX_BODY = 20 * 1024 * 1024; // 20MB
const STARTED_AT = Date.now();

const EXT_BY_MIME = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/bmp': '.bmp',
  'image/gif': '.gif',
  'image/tiff': '.tif',
  'image/webp': '.png', // Windows OCR 不直接支持 webp，交由前端转换
};

// Windows OCR 支持的语言包（启动时探测一次）
let availableLanguages = null;
function detectLanguages() {
  return new Promise((resolve) => {
    const ps = 'powershell.exe';
    const args = [
      '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command',
      "[Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime] | Out-Null; " +
      "([Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages | ForEach-Object { $_.LanguageTag }) -join ','",
    ];
    execFile(ps, args, { timeout: 30000, windowsHide: true }, (err, stdout) => {
      if (err) {
        resolve([]);
        return;
      }
      resolve(String(stdout).trim().split(',').filter(Boolean));
    });
  });
}

/** 调用 PowerShell 识别一张图片 */
function recognize(imagePath, languageTag) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(
      os.tmpdir(),
      `dsh-ocr-out-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`
    );

    const args = [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', PS_SCRIPT,
      '-ImagePath', imagePath,
      '-OutputPath', outputPath,
      '-LanguageTag', languageTag || DEFAULT_LANGUAGE,
    ];

    execFile('powershell.exe', args, { timeout: 60000, windowsHide: true }, (err, stdout, stderr) => {
      let payload = null;
      try {
        if (fs.existsSync(outputPath)) {
          payload = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        }
      } catch (parseErr) {
        return reject(new Error('识别结果解析失败: ' + parseErr.message));
      } finally {
        try { fs.unlinkSync(outputPath); } catch { /* ignore */ }
      }

      if (payload && payload.error) {
        return reject(new Error(payload.error));
      }
      if (!payload) {
        const detail = (stderr || stdout || (err && err.message) || '未知错误').toString().trim();
        return reject(new Error('OCR 执行失败: ' + detail.slice(0, 500)));
      }
      resolve(payload);
    });
  });
}

function sendJson(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store',
  });
  res.end(data);
}

/** 读取请求体（限制大小），返回 Buffer */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error(`请求体超过上限 ${Math.round(MAX_BODY / 1024 / 1024)}MB`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = (req.url || '/').split('?')[0];

  // 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && (url === '/health' || url === '/')) {
    if (availableLanguages === null) {
      availableLanguages = await detectLanguages();
    }
    sendJson(res, 200, {
      ok: availableLanguages.length > 0,
      engine: 'windows-ocr (Windows.Media.Ocr)',
      languages: availableLanguages,
      defaultLanguage: DEFAULT_LANGUAGE,
      uptimeMs: Date.now() - STARTED_AT,
    });
    return;
  }

  if (req.method === 'POST' && url === '/ocr') {
    const contentType = (req.headers['content-type'] || '').toLowerCase();
    let tmpImagePath = null;

    try {
      const body = await readBody(req);
      let buffer;
      let ext = '.png';
      let languageTag = DEFAULT_LANGUAGE;

      if (contentType.includes('application/json')) {
        let parsed;
        try {
          parsed = JSON.parse(body.toString('utf8'));
        } catch {
          sendJson(res, 400, { error: '请求体不是合法 JSON' });
          return;
        }
        if (!parsed.image) {
          sendJson(res, 400, { error: '缺少 image 字段（期望 base64 图片数据）' });
          return;
        }
        // 允许带 data URL 前缀
        const base64 = String(parsed.image).replace(/^data:[^;]+;base64,/, '');
        buffer = Buffer.from(base64, 'base64');
        ext = EXT_BY_MIME[String(parsed.mimeType || '').toLowerCase()] || '.png';
        if (parsed.language) languageTag = String(parsed.language);
      } else if (contentType.startsWith('image/')) {
        buffer = body;
        ext = EXT_BY_MIME[contentType.split(';')[0].trim()] || '.png';
      } else {
        sendJson(res, 415, {
          error: '不支持的 Content-Type，请用 application/json（base64）或 image/*（二进制）',
        });
        return;
      }

      if (!buffer || buffer.length === 0) {
        sendJson(res, 400, { error: '图片数据为空' });
        return;
      }

      tmpImagePath = path.join(
        os.tmpdir(),
        `dsh-ocr-img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
      );
      fs.writeFileSync(tmpImagePath, buffer);

      const started = Date.now();
      const result = await recognize(tmpImagePath, languageTag);
      sendJson(res, 200, { ...result, totalMs: Date.now() - started, bytes: buffer.length });
    } catch (err) {
      sendJson(res, 500, { error: err.message || String(err) });
    } finally {
      if (tmpImagePath) {
        try { fs.unlinkSync(tmpImagePath); } catch { /* ignore */ }
      }
    }
    return;
  }

  sendJson(res, 404, { error: '未知接口，可用: GET /health, POST /ocr' });
});

if (!fs.existsSync(PS_SCRIPT)) {
  console.error(`找不到识别脚本: ${PS_SCRIPT}`);
  process.exit(1);
}

server.listen(PORT, '127.0.0.1', async () => {
  availableLanguages = await detectLanguages();
  console.log('');
  console.log('  财务台账管理系统 - 本地 OCR 服务已启动');
  console.log('  ------------------------------------------');
  console.log('  引擎    : Windows 内置 OCR (Windows.Media.Ocr)');
  console.log('  语言包  : ' + (availableLanguages.length ? availableLanguages.join(', ') : '未检测到'));
  console.log('  地址    : http://127.0.0.1:' + PORT);
  console.log('  接口    : GET /health  |  POST /ocr');
  console.log('  停止    : 按 Ctrl+C');
  console.log('');
});

process.on('SIGINT', () => {
  console.log('\nOCR 服务已停止');
  process.exit(0);
});
