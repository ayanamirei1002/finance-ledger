/**
 * 财务台账管理系统 - 静态服务器
 *
 * 用途：托管 `pnpm build` 生成的 dist/ 产物（生产构建预览），
 *      若 dist/ 不存在则回退到项目演示页 index-simple.html。
 *
 * 用法：node simple-server.js [端口]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2]) || 3000;
const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const hasDist = fs.existsSync(path.join(DIST_DIR, 'index.html'));
const SERVE_DIR = hasDist ? DIST_DIR : ROOT_DIR;
const FALLBACK_INDEX = hasDist
  ? path.join(DIST_DIR, 'index.html')
  : path.join(ROOT_DIR, 'index-simple.html');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('读取文件失败: ' + err.message);
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  // 阻止路径穿越
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  let fullPath = path.join(SERVE_DIR, safePath);

  // 目录或不存在 -> 交给 SPA 入口（前端路由由 React Router 处理）
  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    // 构建产物缺失：明确返回 404，不要回退 HTML（否则浏览器会把 HTML 当 JS 解析）
    if (urlPath.startsWith('/assets/')) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('资源不存在（可能已重新构建，请强制刷新 Ctrl+F5）: ' + urlPath);
      return;
    }
    if (hasDist) {
      sendFile(res, FALLBACK_INDEX);
      return;
    }
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      const indexPath = path.join(fullPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        sendFile(res, indexPath);
        return;
      }
    }
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 - 页面未找到</h1><p>' + urlPath + '</p><a href="/">返回首页</a>');
    return;
  }

  sendFile(res, fullPath);
});

server.listen(PORT, () => {
  console.log('');
  console.log('  财务台账管理系统 - 静态服务器已启动');
  console.log('  ------------------------------------------');
  console.log('  模式: ' + (hasDist ? '生产构建预览 (dist/)' : '项目演示页'));
  console.log('  地址: http://localhost:' + PORT + '/');
  console.log('  停止: 按 Ctrl+C');
  console.log('');
});

process.on('SIGINT', () => {
  console.log('\n服务器已停止');
  process.exit(0);
});
