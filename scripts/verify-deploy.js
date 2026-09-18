// 验证 Vercel 线上部署是否正常服务
const BASE = 'https://finance-ledger-tau.vercel.app';

async function check(path, label) {
  try {
    const t = Date.now();
    const r = await fetch(BASE + path, { signal: AbortSignal.timeout(25000), redirect: 'follow' });
    const txt = await r.text();
    console.log(label.padEnd(32), '->', r.status, (Date.now() - t) + 'ms', txt.length + ' bytes');
    return r.status === 200 ? txt : null;
  } catch (e) {
    console.log(label.padEnd(32), '-> FAIL', (e.cause && e.cause.code) || e.message);
    return null;
  }
}

(async () => {
  console.log('验证目标:', BASE);
  console.log('');

  const html = await check('/', '首页');
  await check('/reconciliation', '财务对账路由 (SPA 回退)');
  await check('/report', '报表中心路由 (SPA 回退)');

  if (html) {
    const jsMatch = html.match(/src="([^"]+\.js)"/);
    const cssMatch = html.match(/href="([^"]+\.css)"/);
    const preloads = [...html.matchAll(/href="([^"]+\.js)"/g)].map(m => m[1]);

    if (jsMatch) await check(jsMatch[1], '主 JS bundle');
    if (cssMatch) await check(cssMatch[1], '主 CSS');
    for (const p of preloads.slice(0, 5)) await check(p, '预加载 chunk');

    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
    console.log('');
    console.log('页面标题:', title);
    console.log('入口脚本:', jsMatch ? jsMatch[1] : '未找到');
  }
})();
