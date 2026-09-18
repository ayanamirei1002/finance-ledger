# 部署指南

## 方式一：部署到 Vercel（推荐，2 分钟）

### 前提

- GitHub 账号
- 项目已推送到 GitHub 仓库

### 步骤

1. **登录 [vercel.com](https://vercel.com)**，用 GitHub 账号授权

2. **导入仓库**
   - 点「Add New → Project」
   - 选择你的 `finance-ledger` 仓库
   - 点「Import」

3. **配置构建参数**（Vercel 通常会自动识别 Vite 项目，确认以下设置）
   - Framework Preset: **Vite**
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

4. **部署**
   - 点「Deploy」
   - 等待约 2 分钟
   - 完成后获得 `https://your-project.vercel.app` 链接

5. **自定义域名**（可选）
   - 在项目 Settings → Domains 添加你的域名
   - 按提示配置 DNS

### 配置文件

项目已包含 `vercel.json`，配置了：

- SPA 路由回退（`/ledger`、`/reconciliation` 等前端路由正常工作）
- Vite 框架自动识别

### 注意事项

- **OCR 功能**：依赖 Windows 本地引擎，线上不可用。首页会显示提示。
- **对账功能**：完全可用（纯前端计算，xlsx 在浏览器内运行）
- **报表功能**：完全可用（mock 数据，展示图表交互）
- **免费额度**：Vercel 的 Hobby 计划完全免费，足够个人项目使用

---

## 方式二：部署到 Netlify

1. 登录 [netlify.com](https://netlify.com)
2. 「Add new site → Import an existing project」
3. 选择 GitHub 仓库
4. Build command: `pnpm build`
5. Publish directory: `dist`
6. Deploy

---

## 方式三：GitHub Pages

```bash
# 安装 gh-pages
pnpm add -D gh-pages

# 在 package.json 的 scripts 中添加：
"deploy": "pnpm build && gh-pages -d dist"

# 运行
pnpm deploy
```

注意：GitHub Pages 不支持 SPA 路由回退，需要额外配置 404.html。

---

## 方式四：打包成桌面 exe（需要 Rust）

```bash
# 1. 安装 Rust（见 INSTALL.md）

# 2. 构建
pnpm tauri build

# 3. 产物位置
# src-tauri/target/release/bundle/msi/   → .msi 安装包
# src-tauri/target/release/              → .exe 可执行文件
```

桌面版包含完整功能（含 OCR、SQLite 持久化）。

---

## 发布清单

- [x] `vercel.json` — SPA 路由回退
- [x] `vite.config.ts` — 代码分割（antd/charts/xlsx 独立 chunk）
- [x] `.gitignore` — 排除 node_modules、dist、.env
- [x] 推送到 GitHub
- [x] 在 Vercel 导入并部署
- [x] 官网链接自动显示在 GitHub 仓库 About 区

---

## 国内网络访问说明

### 现象

`*.vercel.app` 域名在国内**无法直连**，但 Vercel 的服务器 IP 本身是可达的。

### 实测数据

| 目标 | 直连结果 |
|------|---------|
| `finance-ledger-tau.vercel.app`（本机 DNS 解析 → `184.72.1.148`） | ❌ 超时 |
| `216.198.79.195`（Cloudflare DoH 查到的真实 IP） | ✅ 通，76ms |
| `64.29.17.195`（真实 IP 2） | ✅ 通，80ms |
| `76.76.21.21`（Vercel 经典 anycast IP） | ✅ 通，74ms |
| `vercel.com` | ✅ 通，288ms |

**结论：这是 `*.vercel.app` 的 DNS 污染，不是 IP 层封锁。**

### 解决方案

| 方案 | 成本 | 效果 |
|------|------|------|
| 直接用 `.vercel.app` 链接 | 免费 | 访问者需要代理 |
| **绑定自有域名**（推荐） | 约 ¥30/年 | 国内直连可访问，无需代理 |
| 部署到国内静态托管 | 视平台而定 | 国内访问最快，但需备案（用国内服务器时） |

绑定自有域名的步骤（域名指向境外服务器，**无需 ICP 备案**）：

1. 在阿里云 / 腾讯云购买域名（`.top` / `.xyz` 约 ¥30/年）
2. Vercel 项目 → **Settings → Domains** → 输入你的域名 → Add
3. 到域名注册商的 DNS 解析页添加记录（Vercel 会给出确切值）：
   - `A` 记录：`@` → `76.76.21.21`
   - `CNAME` 记录：`www` → `cname.vercel-dns.com`
4. 等待 DNS 生效（几分钟到几小时），Vercel 会自动签发 SSL 证书

### 本地验证部署

```bash
node scripts/verify-deploy.js          # 检查线上站点与资源是否正常
```

### 推送时遇到网络问题

若 `git push` 报 `Failed to connect to github.com:443`，说明 GitHub 被间歇性阻断，可通过代理推送：

```bash
git config --local http.proxy http://127.0.0.1:7897
git config --local https.proxy http://127.0.0.1:7897
git config --local http.sslBackend openssl
git push
```

> 注意：`http.sslBackend` 必须设为 `openssl`。Git for Windows 默认的 `schannel` 后端
> 无法穿透 HTTP 代理隧道，会报 `schannel: failed to receive handshake`。

> 另外 `-c` 参数必须写在子命令**之前**：`git -c key=value push`（写成 `git push -c key=value` 会打印帮助信息）。
